import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderEmail } from '../middleware/mailer.js';
import { requireAdmin } from '../middleware/auth.js';
import { getSettings } from './settings.js';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const adminOnly = (req, res) => {
  let denied = true;
  requireAdmin(req, res, () => { denied = false; });
  return !denied;
};

const getId = (req) => {
  const m = new URL(req.url, 'http://localhost').pathname.match(/\/api\/orders\/?([^/]*)$/);
  return m?.[1] || null;
};

const ordersHandler = async (req, res) => {
  const { method } = req;

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  const id = getId(req);
  if (id && !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'ID غير صالح' });
  }

  // ===== عمليات الأدمن =====
  if (method === 'GET') {
    if (!adminOnly(req, res)) return;
    if (id) {
      const order = await Order.findById(id);
      return order ? res.json(order) : res.status(404).json({ message: 'الطلب غير موجود' });
    }
    const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
    return res.json(await Order.find(filter).sort({ createdAt: -1 }).limit(500));
  }

  if (method === 'PATCH' || method === 'PUT') {
    if (!adminOnly(req, res)) return;
    if (!id) return res.status(400).json({ message: 'ID مطلوب' });
    const b = req.body || {};
    const update = {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return res.status(400).json({ message: 'حالة غير صالحة' });
      update.status = b.status;
    }
    if (b.adminNote !== undefined) update.adminNote = String(b.adminNote);
    if (b.deliveryFee !== undefined && Number(b.deliveryFee) >= 0) update.deliveryFee = Number(b.deliveryFee);
    if (b.customer && typeof b.customer === 'object') {
      for (const f of ['name', 'phone', 'email', 'address', 'city', 'notes']) {
        if (b.customer[f] !== undefined) update[`customer.${f}`] = String(b.customer[f]);
      }
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });
    order.set(update);
    if (update.deliveryFee !== undefined) order.total = order.totalPrice + order.deliveryFee;
    await order.save();
    return res.json(order);
  }

  if (method === 'DELETE') {
    if (!adminOnly(req, res)) return;
    if (!id) return res.status(400).json({ message: 'ID مطلوب' });
    const order = await Order.findByIdAndDelete(id);
    return order ? res.json({ message: 'تم حذف الطلب' }) : res.status(404).json({ message: 'الطلب غير موجود' });
  }

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customer, items } = req.body || {};

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'بيانات العميل غير كاملة'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    // تنظيف الأصناف + التحقق من الكمية
    const cleanItems = [];
    for (const item of items) {
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ success: false, message: 'كمية غير صالحة' });
      }
      cleanItems.push({
        productId: item.productId ? String(item.productId) : undefined,
        name: String(item.name || ''),
        price: Number(item.price),
        quantity,
        selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
        image: item.image ? String(item.image) : undefined,
        category: item.category ? String(item.category) : undefined
      });
    }

    // الأسعار من الداتابيز (لو المنتج موجود) بدل الاعتماد على العميل
    const ids = cleanItems
      .map((i) => i.productId)
      .filter((id) => id && mongoose.isValidObjectId(id));
    if (ids.length) {
      const products = await Product.find({ _id: { $in: ids } }).select('name price');
      const byId = new Map(products.map((p) => [String(p._id), p]));
      for (const item of cleanItems) {
        const p = byId.get(item.productId);
        if (p) {
          item.price = p.price;
          item.name = p.name;
        }
      }
    }

    if (cleanItems.some((i) => !Number.isFinite(i.price) || i.price < 0)) {
      return res.status(400).json({ success: false, message: 'سعر غير صالح' });
    }

    const totalPrice = cleanItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // رسوم التوصيل من إعدادات المتجر (مش من العميل)
    const settings = await getSettings();
    const fee =
      settings.freeShippingThreshold > 0 && totalPrice >= settings.freeShippingThreshold
        ? 0
        : settings.deliveryFee;

    const order = await Order.create({
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        email: customer.email ? String(customer.email).trim() : undefined,
        address: customer.address ? String(customer.address).trim() : undefined,
        city: customer.city ? String(customer.city).trim() : undefined,
        notes: customer.notes ? String(customer.notes).trim() : undefined
      },
      items: cleanItems,
      totalPrice,
      deliveryFee: fee,
      total: totalPrice + fee,
      status: 'pending',
      ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    // الإيميل فشله ما يفشلش الطلب (الطلب اتحفظ بالفعل)
    try {
      await sendOrderEmail(order);
    } catch (mailError) {
      console.error('❌ Order email failed:', mailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'تم استقبال طلبك بنجاح! سيتم التواصل معك قريباً ✅',
      orderId: order._id
    });
  } catch (error) {
    console.error('❌ Order error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'بيانات الطلب غير صالحة' });
    }
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال الطلب'
    });
  }
};

export default ordersHandler;

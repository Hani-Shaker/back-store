import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderEmail } from '../middleware/mailer.js';

const DEFAULT_DELIVERY_FEE = 50; // نفس قيمة Order model

const ordersHandler = async (req, res) => {
  const { method } = req;

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customer, items, deliveryFee } = req.body || {};

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
    const fee = Number.isFinite(Number(deliveryFee)) && Number(deliveryFee) >= 0
      ? Number(deliveryFee)
      : DEFAULT_DELIVERY_FEE;

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

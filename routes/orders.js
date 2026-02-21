import express from 'express';
import Order from '../models/Order.js';
import { sendOrderEmail } from '../middleware/mailer.js';

const router = express.Router();

// POST /api/orders - إنشاء طلب جديد
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalPrice, deliveryFee = 50 } = req.body;

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city) {
      return res.status(400).json({ message: 'يرجى ملء جميع الحقول المطلوبة' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'السلة فارغة' });
    }

    const grandTotal = totalPrice + deliveryFee;
    const order = await Order.create({ customer, items, totalPrice, deliveryFee, grandTotal });

    // إرسال إيميل (non-blocking)
    sendOrderEmail(order).catch((err) => console.error('Email error:', err));

    res.status(201).json({ message: 'تم إرسال الطلب بنجاح! سنتواصل معك قريباً ✅', orderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ، حاول مرة أخرى' });
  }
});

// GET /api/orders - جلب كل الطلبات (للأدمن)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

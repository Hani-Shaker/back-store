import Order from '../models/Order.js';

const ordersHandler = async (req, res) => {
  const { method, body } = req;

  try {
    if (method === 'GET') {
      // ✅ GET /api/orders - جلب جميع الطلبات
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json(orders);
    }

    if (method === 'POST') {
      // ✅ POST /api/orders - إنشاء طلب جديد
      const { customer, items, totalPrice, deliveryFee } = body;

      if (!customer || !items || !totalPrice) {
        return res.status(400).json({ message: 'بيانات الطلب ناقصة' });
      }

      const order = await Order.create({
        customer,
        items,
        totalPrice: parseFloat(totalPrice),
        deliveryFee: parseFloat(deliveryFee) || 0,
        status: 'pending'
      });

      return res.status(201).json({
        message: 'تم استقبال الطلب بنجاح',
        order
      });
    }

    return res.status(405).json({ 
      message: 'Method not allowed',
      allowedMethods: ['GET', 'POST']
    });

  } catch (error) {
    console.error('❌ Orders handler error:', error);
    return res.status(500).json({ 
      message: 'خطأ في معالجة الطلب',
      error: error.message 
    });
  }
};

export default ordersHandler;
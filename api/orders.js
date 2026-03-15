import Order from '../models/Order.js';
import nodemailer from 'nodemailer';

// ========== Email Helper ==========
async function sendOrderEmailNotification(order) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const itemsHTML = order.items.map(item => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">${item.name}</td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">${item.price} ج.م</td>
        <td style="padding: 10px; text-align: right;">${item.quantity * item.price} ج.م</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `📦 طلبية جديدة من ${order.customer.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #19cee6;">طلبية جديدة 📦</h2>
            
            <h3>بيانات العميل:</h3>
            <p><strong>الاسم:</strong> ${order.customer.name}</p>
            <p><strong>الهاتف:</strong> ${order.customer.phone}</p>
            <p><strong>البريد:</strong> ${order.customer.email || '-'}</p>
            <p><strong>المدينة:</strong> ${order.customer.city}</p>
            <p><strong>العنوان:</strong> ${order.customer.address}</p>
            
            <h3>المنتجات:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead style="background: #f0f0f0;">
                <tr>
                  <th style="padding: 10px; text-align: right;">المنتج</th>
                  <th style="padding: 10px; text-align: center;">الكمية</th>
                  <th style="padding: 10px; text-align: right;">السعر</th>
                  <th style="padding: 10px; text-align: right;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
              <p><strong>المنتجات:</strong> ${order.totalPrice} ج.م</p>
              <p><strong>التوصيل:</strong> ${order.deliveryFee} ج.م</p>
              <p style="font-size: 18px; color: #28a745;"><strong>الإجمالي:</strong> ${order.total} ج.م</p>
            </div>
            
            <hr>
            <p><strong>IP Address:</strong> ${order.ipAddress}</p>
            <p><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleString('ar-EG')}</p>
            <p style="color: #666; font-size: 12px;">تم الإرسال تلقائيًا من موقعك</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

// ========== Main Handler ==========
const ordersHandler = async (req, res) => {
  const { method, body } = req;

  // CORS
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customer, items, totalPrice, deliveryFee } = body;

    console.log('📥 Order submission:', { name: customer.name, phone: customer.phone });

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ 
        success: false,
        message: 'بيانات العميل غير كاملة' 
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'السلة فارغة' 
      });
    }

    // حفظ الطلب
    const order = await Order.create({
      customer,
      items,
      totalPrice,
      deliveryFee: deliveryFee || 50,
      total: totalPrice + (deliveryFee || 50),
      status: 'pending',
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    console.log('✅ Order saved:', order._id);

    // إرسال الإيميل
    await sendOrderEmailNotification(order);

    return res.status(201).json({
      success: true,
      message: 'تم استقبال طلبك بنجاح! سيتم التواصل معك قريباً ✅',
      orderId: order._id
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export default ordersHandler;
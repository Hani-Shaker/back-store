import Contact from '../models/Contact.js';
import nodemailer from 'nodemailer';

// ========== Email Helper ==========
async function sendEmailNotification(contact) {
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `📬 رسالة جديدة من ${contact.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #19cee6;">رسالة جديدة من صفحة التواصل 📬</h2>
            <p><strong>الاسم:</strong> ${contact.name}</p>
            <p><strong>البريد الإلكتروني:</strong> ${contact.email}</p>
            <p><strong>الموضوع:</strong> ${contact.subject}</p>
            <hr>
            <h3>الرسالة:</h3>
            <div style="background: #f9f9f9; padding: 15px; border-right: 4px solid #19cee6; border-radius: 5px;">
              <p style="line-height: 1.8; color: #333;">${contact.message}</p>
            </div>
            <hr>
            <p><strong>IP Address:</strong> ${contact.ipAddress}</p>
            <p><strong>التاريخ:</strong> ${new Date(contact.createdAt).toLocaleString('ar-EG')}</p>
            <p style="color: #666; font-size: 12px;">تم الإرسال تلقائيًا من موقعك</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Contact email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

// ========== Main Handler ==========
const contactHandler = async (req, res) => {
  const { method, body } = req;

  // CORS
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, userId } = body;

    console.log('📥 Contact submission:', { name, email });

    // التحقق من البيانات المطلوبة
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'جميع الحقول مطلوبة' 
      });
    }

    // التحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني غير صحيح' 
      });
    }

    // حفظ الرسالة
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject || 'بدون عنوان',
      message: message.trim(),
      status: 'new',
      userId: userId || null,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    console.log('✅ Contact saved:', contact._id);

    // إرسال الإيميل
    await sendEmailNotification(contact);

    return res.status(201).json({
      success: true,
      message: 'تم استقبال رسالتك بنجاح! 🎉',
      contactId: contact._id
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export default contactHandler;
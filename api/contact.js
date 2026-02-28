
import Contact from '../models/Contact.js';

const contactHandler = async (req, res) => {
  const { method, body } = req;

  try {
    if (method === 'POST') {
      // ✅ POST /api/contact - إرسال رسالة تواصل
      const { name, email, subject, message } = body;

      if (!name || !email || !message) {
        return res.status(400).json({ 
          message: 'جميع الحقول مطلوبة' 
        });
      }

      // التحقق من صيغة البريد الإلكتروني
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: 'البريد الإلكتروني غير صحيح' 
        });
      }

      const contact = await Contact.create({
        name: name.trim(),
        email: email.trim(),
        subject: subject || 'بدون عنوان',
        message: message.trim(),
        status: 'new'
      });

      return res.status(201).json({
        message: 'تم استقبال رسالتك بنجاح ✅',
        contact
      });
    }

    return res.status(405).json({ 
      message: 'Method not allowed',
      allowedMethods: ['POST']
    });

  } catch (error) {
    console.error('❌ Contact handler error:', error);
    return res.status(500).json({ 
      message: 'خطأ في إرسال الرسالة',
      error: error.message 
    });
  }
};

export default contactHandler;

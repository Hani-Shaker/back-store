import Contact from '../models/Contact.js';
import nodemailer from 'nodemailer';

let transporter;

// ✅ إضافة tls config
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // ✅ حل مؤقت لـ SSL issue
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email config error:', error.message);
    } else {
      console.log('✅ Email service ready');
    }
  });
}

const contactHandler = async (req, res) => {
  const { method, body } = req;

  try {
    if (method === 'POST') {
      const { name, email, subject, message } = body;

      console.log('📨 New contact:', name);

      if (!name || !email || !message) {
        return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'البريد الإلكتروني غير صحيح' });
      }

      // ✅ احفظ في DB
      const contact = await Contact.create({
        name: name.trim(),
        email: email.trim(),
        subject: subject || 'بدون عنوان',
        message: message.trim(),
        status: 'new'
      });

      console.log('✅ Contact saved');

      // ✅ بعت emails
      if (transporter && process.env.OWNER_EMAIL) {
        try {
          // للمالك
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.OWNER_EMAIL,
            subject: `رسالة جديدة: ${subject || 'بدون عنوان'}`,
            html: `
              <h2>رسالة جديدة من صفحة التواصل</h2>
              <p><strong>الاسم:</strong> ${name}</p>
              <p><strong>البريد:</strong> ${email}</p>
              <p><strong>الموضوع:</strong> ${subject || 'بدون عنوان'}</p>
              <hr/>
              <p>${message}</p>
            `
          });

          console.log('📧 Email sent to owner');

          // للزائر
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'استقبلنا رسالتك! 🎉',
            html: `
              <h2>شكراً لك ${name}!</h2>
              <p>استقبلنا رسالتك بنجاح وسيتم الرد عليك قريباً.</p>
            `
          });

          console.log('📧 Confirmation sent to user');
        } catch (emailError) {
          console.warn('⚠️ Email warning:', emailError.message);
          // نرسل الرد للزائر حتى لو email فشل
        }
      }

      return res.status(201).json({
        message: 'تم استقبال رسالتك بنجاح ✅'
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ message: 'خطأ في معالجة الرسالة' });
  }
};

export default contactHandler;
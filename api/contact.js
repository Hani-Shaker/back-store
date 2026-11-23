import Contact from '../models/Contact.js';
import mongoose from 'mongoose';
import { sendContactEmail } from '../middleware/mailer.js';
import { requireAdmin } from '../middleware/auth.js';

const adminOnly = (req, res) => {
  let denied = true;
  requireAdmin(req, res, () => { denied = false; });
  return !denied;
};

const contactHandler = async (req, res) => {
  const { method } = req;

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  const id = new URL(req.url, 'http://localhost').pathname.match(/\/api\/contact\/?([^/]*)$/)?.[1] || null;
  if (id && !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'ID غير صالح' });
  }

  // ===== عمليات الأدمن =====
  if (method === 'GET') {
    if (!adminOnly(req, res)) return;
    return res.json(await Contact.find().sort({ createdAt: -1 }).limit(500));
  }
  if (method === 'PATCH' || method === 'PUT') {
    if (!adminOnly(req, res)) return;
    const status = req.body?.status;
    if (!id || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'بيانات غير صالحة' });
    }
    const doc = await Contact.findByIdAndUpdate(id, { status }, { new: true });
    return doc ? res.json(doc) : res.status(404).json({ message: 'الرسالة غير موجودة' });
  }
  if (method === 'DELETE') {
    if (!adminOnly(req, res)) return;
    const doc = id && await Contact.findByIdAndDelete(id);
    return doc ? res.json({ message: 'تم الحذف' }) : res.status(404).json({ message: 'الرسالة غير موجودة' });
  }

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, userId } = req.body || {};

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof message !== 'string' || !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني غير صحيح'
      });
    }

    if (message.length > 5000 || name.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'الرسالة أو الاسم أطول من المسموح'
      });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      subject: typeof subject === 'string' && subject.trim() ? subject.trim().slice(0, 300) : 'بدون عنوان',
      message: message.trim(),
      status: 'new',
      userId: userId ? String(userId) : null,
      ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    // فشل الإيميل ما يفشلش الطلب
    try {
      await sendContactEmail(contact);
    } catch (mailError) {
      console.error('❌ Contact email failed:', mailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'تم استقبال رسالتك بنجاح! 🎉',
      contactId: contact._id
    });
  } catch (error) {
    console.error('❌ Contact error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال الرسالة'
    });
  }
};

export default contactHandler;

import express from 'express';
import Contact from '../models/Contact.js';
import { sendContactEmail } from '../middleware/mailer.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'يرجى ملء الحقول المطلوبة' });
    }

    const contact = await Contact.create({ name, email, message });
    sendContactEmail(contact).catch((err) => console.error('Email error:', err));

    res.status(201).json({ message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ، حاول مرة أخرى' });
  }
});

export default router;

// routes/upload-drive.js
import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from "stream";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// إعداد Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json', // الملف اللي حملته
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({
  version: 'v3',
  auth
});

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم اختيار صورة' });
    }

    // رفع الصورة على Google Drive
const response = await drive.files.create({
  requestBody: {
    name: `${Date.now()}-${req.file.originalname}`,
    parents: [FOLDER_ID]
  },
  media: {
    mimeType: req.file.mimetype,
    body: Readable.from([req.file.buffer])
  },
  fields: "id, webViewLink, webContentLink",
  supportsAllDrives: true
});

    const fileId = response.data.id;

    // جعل الملف public (اختياري)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // الحصول على رابط الصورة المباشر
    const imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

    res.json({
      message: 'تم رفع الصورة بنجاح',
      url: imageUrl,
      fileId: fileId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'خطأ في رفع الصورة', error: error.message });
  }
});

export default router;

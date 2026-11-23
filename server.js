import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import connectDB from './config/db.js';
import productsHandler from './api/products.js';
import ordersHandler from './api/orders.js';
import contactHandler from './api/contact.js';
import adminVerifyHandler from './api/admin-verify.js';

const app = express();
app.set('trust proxy', 1); // للحصول على IP الحقيقي خلف Vercel

// ✅ CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://front-store-ecru.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile apps / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV === 'production') return callback(null, false);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Routes اللي مش محتاجة DB
app.get('/', (req, res) => {
  res.json({ message: '🛍️ E-Commerce Backend' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: '✅ OK' });
});

// ✅ اتصال MongoDB قبل أي route بيستخدم الداتابيز (مناسب لـ Vercel serverless)
const withDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    res.status(503).json({ message: 'تعذر الاتصال بقاعدة البيانات' });
  }
};

const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('❌ Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'حدث خطأ في السيرفر' });
    }
  }
};

app.all(/^\/api\/products(\/.*)?$/, withDB, wrapHandler(productsHandler));
app.all(/^\/api\/orders(\/.*)?$/, withDB, wrapHandler(ordersHandler));
app.all(/^\/api\/contact(\/.*)?$/, withDB, wrapHandler(contactHandler));
app.post('/api/admin/verify-password', wrapHandler(adminVerifyHandler));

app.use((req, res) => {
  res.status(404).json({ message: '❌ Route not found' });
});

// ✅ معالج أخطاء عام (JSON غير صالح، إلخ)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('❌ Error:', err);
  res.status(status).json({
    message: status >= 500 ? 'حدث خطأ في السيرفر' : 'طلب غير صالح'
  });
});

// على Vercel بيتم عمل export للـ app، ومحليًا بنعمل listen
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌ MongoDB Error:', err.message);
      process.exit(1);
    });
}

export default app;

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import ordersRouter from './routes/orders.js';
import contactRouter from './routes/contact.js';
import productsRouter from './routes/products.js';
import uploadDriveRouter from './routes/upload-drive.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ تحديد الأصول المسموحة
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://front-store-ecru.vercel.app',
];

// ✅ CORS - مرة واحدة فقط
app.use(cors({
  origin: (origin, callback) => {
    // السماح من أي مكان في الإنتاج (بدون origin في الطلب)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ JSON Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health Check (للتحقق من شغل الـ Server)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Admin Password Verification
app.post('/api/admin/verify-password', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'كلمة السر مطلوبة',
        authenticated: false 
      });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || '123456';

    if (password === adminPassword) {
      res.status(200).json({ 
        message: 'كلمة السر صحيحة',
        authenticated: true,
        token: Buffer.from(password).toString('base64')
      });
    } else {
      res.status(401).json({ 
        message: 'كلمة السر خاطئة',
        authenticated: false 
      });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ 
      message: 'خطأ في التحقق',
      authenticated: false 
    });
  }
});

// ✅ Routes
app.use('/api/upload-drive', uploadDriveRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/products', productsRouter);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'خطأ في السيرفر',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Allowed origins:', allowedOrigins);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Trying to connect to:', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'No URI provided');
    process.exit(1);
  });

// ✅ Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
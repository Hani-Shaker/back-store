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

app.use(cors({
  origin: '*',  // السماح من أي مكان
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ✅ CORS - للتطوير استخدم * أو localhost
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://front-store-ecru.vercel.app',
    '*'
  ],
  credentials: true
}));

app.use(express.json());

app.use('/api/upload-drive', uploadDriveRouter);
// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/products', productsRouter);

app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date() }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
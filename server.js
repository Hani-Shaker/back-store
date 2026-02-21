import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import ordersRouter from './routes/orders.js';
import contactRouter from './routes/contact.js';

dotenv.config();



const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL],
  credentials: true 
}));
// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
import productsRouter from './routes/products.js';
app.use('/api/products', productsRouter);

app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date() }));

// Connect to MongoDB Atlas
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

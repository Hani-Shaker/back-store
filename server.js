import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// ✅ CORS محسّنة
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://front-store-ecru.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // اسمح بـ كل مكان للـ development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ معالج الأخطاء
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: error.message || 'Server error'
      });
    }
  }
};

// ✅ Routes
app.get("/", (req, res) => {
  res.json({ message: "🛍️ E-Commerce Backend" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "✅ OK" });
});

import productsHandler from "./api/products.js";
import ordersHandler from "./api/orders.js";
import contactHandler from "./api/contact.js";
import adminVerifyHandler from "./api/admin-verify.js";

app.all("/api/products", wrapHandler(productsHandler));
app.all("/api/orders", wrapHandler(ordersHandler));
app.all("/api/contact", wrapHandler(contactHandler));
app.post("/api/admin/verify-password", wrapHandler(adminVerifyHandler));

app.use((req, res) => {
  res.status(404).json({ message: '❌ Route not found' });
});

// ✅ MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    connectTimeoutMS: 20000,
    socketTimeoutMS: 20000,
    serverSelectionTimeoutMS: 20000
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
});
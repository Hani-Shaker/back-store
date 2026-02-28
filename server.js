import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import productsHandler from "./routes/products.js";
import ordersHandler from "./routes/orders.js";
import contactHandler from "./routes/contact.js";
import uploadDriveHandler from "./routes/upload-drive.js";
import adminVerifyHandler from "./routes/admin-verify.js";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Error Handler Wrapper
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// ✅ Home Route
app.get("/", (req, res) => {
  res.json({ 
    message: "🛍️ E-Commerce Backend Running!",
    status: "✅ Online",
    version: "1.0.0",
    endpoints: {
      products: {
        getAll: "GET /api/products",
        create: "POST /api/products",
        update: "PUT /api/products/:id",
        delete: "DELETE /api/products/:id"
      },
      orders: {
        getAll: "GET /api/orders",
        create: "POST /api/orders"
      },
      contact: {
        send: "POST /api/contact"
      },
      uploads: "POST /api/upload-drive",
      admin: "POST /api/admin/verify-password"
    }
  });
});

// ✅ Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "✅ OK", 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "🟢 Connected" : "🔴 Disconnected"
  });
});

// ✅ API Routes
app.all("/api/products", wrapHandler(productsHandler));
app.all("/api/orders", wrapHandler(ordersHandler));
app.all("/api/contact", wrapHandler(contactHandler));
app.all("/api/upload-drive", wrapHandler(uploadDriveHandler));
app.post("/api/admin/verify-password", wrapHandler(adminVerifyHandler));

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    message: '❌ Route not found',
    path: req.path,
    method: req.method,
    suggestion: 'Check /api/health or GET / for available endpoints'
  });
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 E-Commerce Backend Server 🚀      ║
╚════════════════════════════════════════╝

📍 Server: http://localhost:${PORT}

📦 PRODUCTS:
   GET    /api/products          - Get all products
   POST   /api/products          - Create product
   PUT    /api/products/:id      - Update product
   DELETE /api/products/:id      - Delete product

📋 ORDERS:
   GET    /api/orders            - Get all orders
   POST   /api/orders            - Create order

💬 CONTACT:
   POST   /api/contact           - Send message

📤 UPLOADS:
   POST   /api/upload-drive      - Upload to Google Drive

🔐 ADMIN:
   POST   /api/admin/verify-password - Verify admin password

💚 HEALTH CHECK:
   GET    /api/health            - Server health status

🏠 HOME:
   GET    /                       - API Documentation

════════════════════════════════════════

✅ Ready to accept requests!
  `);
});

export default app;

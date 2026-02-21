import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// جلب كل المنتجات
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المنتجات' });
  }
});

// إضافة منتج جديد
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'الاسم والسعر مطلوبان' });
    }
    const product = await Product.create({ name, description, price, image, category, stock });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة المنتج' });
  }
});

// تعديل منتج
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تعديل المنتج' });
  }
});

// حذف منتج
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الحذف' });
  }
});

export default router;
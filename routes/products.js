import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * جلب جميع المنتجات
 * GET /api/products
 */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'خطأ في جلب المنتجات' });
  }
});

/**
 * جلب منتج واحد
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'خطأ في جلب المنتج' });
  }
});

/**
 * إضافة منتج جديد
 * POST /api/products
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image, category, stock, colors } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !price) {
      return res.status(400).json({ 
        message: 'الاسم والسعر مطلوبان' 
      });
    }

    // إنشاء المنتج
    const product = await Product.create({
      name: name.trim(),
      description: description || '',
      price: parseFloat(price),
      image: image || '',
      category: category || 'عام',
      stock: parseInt(stock) || 0,
      colors: Array.isArray(colors) && colors.length > 0 
        ? colors.filter(c => c && c.length > 0)
        : ['#000000']
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'خطأ في إضافة المنتج' });
  }
});

/**
 * تعديل منتج
 * PUT /api/products/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, image, category, stock, colors } = req.body;

    // تحضير البيانات للتحديث
    const updateData = {};
    
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (image) updateData.image = image;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
    
    if (colors) {
      updateData.colors = Array.isArray(colors) && colors.length > 0 
        ? colors.filter(c => c && c.length > 0)
        : ['#000000'];
    }

    // تحديث المنتج
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'خطأ في تعديل المنتج' });
  }
});

/**
 * حذف منتج
 * DELETE /api/products/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    res.json({ 
      message: 'تم حذف المنتج بنجاح',
      product 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'خطأ في حذف المنتج' });
  }
});

export default router;

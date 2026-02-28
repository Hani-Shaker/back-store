// routes/products.js
import Product from '../models/Product.js';

const productsHandler = async (req, res) => {
  const { method, query, body } = req;

  try {
    if (method === 'GET') {
      // ✅ GET /api/products - جلب جميع المنتجات
      const products = await Product.find().sort({ createdAt: -1 });
      return res.json(products);
    }

    if (method === 'POST') {
      // ✅ POST /api/products - إضافة منتج جديد
      const { name, description, price, image, category, stock, colors } = body;

      if (!name || !price) {
        return res.status(400).json({ message: 'الاسم والسعر مطلوبان' });
      }

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

      return res.status(201).json(product);
    }

    if (method === 'PUT') {
      // ✅ PUT /api/products/:id - تحديث منتج
      const { id } = query;
      
      if (!id) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const updateData = {};
      if (body.name) updateData.name = body.name.trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.price) updateData.price = parseFloat(body.price);
      if (body.image) updateData.image = body.image;
      if (body.category) updateData.category = body.category;
      if (body.stock !== undefined) updateData.stock = parseInt(body.stock) || 0;
      if (body.colors) {
        updateData.colors = Array.isArray(body.colors) && body.colors.length > 0
          ? body.colors.filter(c => c && c.length > 0)
          : ['#000000'];
      }

      const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

      if (!product) {
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      return res.json(product);
    }

    if (method === 'DELETE') {
      // ✅ DELETE /api/products/:id - حذف منتج
      const { id } = query;

      if (!id) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      return res.json({ message: 'تم حذف المنتج بنجاح', product });
    }

    // ❌ Method not allowed
    return res.status(405).json({ 
      message: 'Method not allowed',
      method: method,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    });

  } catch (error) {
    console.error('❌ Products handler error:', error);
    return res.status(500).json({ 
      message: 'خطأ في معالجة الطلب',
      error: error.message 
    });
  }
};

export default productsHandler;

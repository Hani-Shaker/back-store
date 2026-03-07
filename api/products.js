// backend/api/products.js
import Product from '../models/Product.js';

export default async (req, res) => {
  const { method, url, body } = req;

  // ✅ استخرج الـ ID من الـ URL
  const pathParts = url.split('/api/products/');
  const productId = pathParts[1] ? pathParts[1].split('?')[0] : null;

  console.log('Method:', method, 'ProductID:', productId);

  try {
    // GET - جلب المنتجات
    if (method === 'GET') {
      if (productId) {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'غير موجود' });
        return res.json(product);
      }
      const products = await Product.find().sort({ createdAt: -1 });
      return res.json(products);
    }

    // POST - إضافة منتج
    if (method === 'POST') {
      const { name, price, description, image, category, stock, colors } = body;
      if (!name || !price) return res.status(400).json({ message: 'الاسم والسعر مطلوبان' });

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

    // PUT - تحديث منتج
    if (method === 'PUT') {
      if (!productId) return res.status(400).json({ message: 'ID مطلوب' });

      console.log('🔄 Updating:', productId);

      const product = await Product.findByIdAndUpdate(productId, body, { new: true });
      if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

      console.log('✅ Updated:', product.name);
      return res.json(product);
    }

    // DELETE - حذف منتج
    if (method === 'DELETE') {
      if (!productId) return res.status(400).json({ message: 'ID مطلوب' });

      console.log('🗑️ Deleting:', productId);

      const product = await Product.findByIdAndDelete(productId);
      if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

      console.log('✅ Deleted:', product.name);
      return res.json({ message: 'تم الحذف بنجاح' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
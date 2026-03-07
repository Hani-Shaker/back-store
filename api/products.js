// backend/api/products.js
import Product from '../models/Product.js';

export default async (req, res) => {
  const { method, url, body } = req;

  // استخرج الـ ID من الـ URL
  const pathParts = url.split('/api/products/');
  const productId = pathParts[1] ? pathParts[1].split('?')[0] : null;

  console.log(`📍 ${method} /api/products${productId ? '/' + productId : ''}`);

  try {
    // GET - جلب المنتجات
    if (method === 'GET') {
      if (productId) {
        console.log('🔍 Fetching product:', productId);
        const product = await Product.findById(productId);
        if (!product) {
          console.log('❌ Product not found:', productId);
          return res.status(404).json({ message: 'غير موجود' });
        }
        return res.json(product);
      }

      console.log('📦 Fetching all products...');
      const products = await Product.find().sort({ createdAt: -1 });
      console.log(`✅ Found ${products.length} products`);
      return res.json(products);
    }

    // POST - إضافة منتج
    if (method === 'POST') {
      console.log('➕ Creating product');
      const { name, price, description, image, category, stock, colors } = body;

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

      console.log('✅ Product created:', product._id);
      return res.status(201).json(product);
    }

    // PUT - تحديث منتج
    if (method === 'PUT') {
      if (!productId) {
        console.log('❌ No ID provided for PUT');
        return res.status(400).json({ message: 'ID مطلوب' });
      }

      console.log('🔄 Updating product:', productId);

      // تأكد من أن body موجود
      if (!body || Object.keys(body).length === 0) {
        console.log('❌ Empty body for PUT');
        return res.status(400).json({ message: 'No data to update' });
      }

      const product = await Product.findByIdAndUpdate(
        productId, 
        body, 
        { new: true, runValidators: false }
      );

      if (!product) {
        console.log('❌ Product not found for update:', productId);
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      console.log('✅ Updated:', product.name);
      return res.json(product);
    }

    // DELETE - حذف منتج
    if (method === 'DELETE') {
      if (!productId) {
        console.log('❌ No ID provided for DELETE');
        return res.status(400).json({ message: 'ID مطلوب' });
      }

      console.log('🗑️ Deleting product:', productId);

      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        console.log('❌ Product not found for delete:', productId);
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      console.log('✅ Deleted:', product.name);
      return res.json({ message: 'تم الحذف بنجاح' });
    }

    return res.status(405).json({ message: 'Method not allowed', method });

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      message: error.message || 'خطأ في السيرفر',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
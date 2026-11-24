import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';

// الحقول المسموح بتعديلها (منع mass assignment)
const EDITABLE = [
  'name', 'description', 'price', 'image', 'category',
  'stock', 'colors', 'originalPrice', 'badge', 'images', 'variants', 'pickImage'
];

const cleanUrls = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((u) => String(u || '').trim())
    .filter(Boolean)
    .slice(0, 10);

const pick = (body) => {
  const out = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (out.name !== undefined) out.name = String(out.name).trim();
  if (out.price !== undefined) out.price = parseFloat(out.price);
  if (out.stock !== undefined) out.stock = parseInt(out.stock, 10) || 0;
  if (out.originalPrice !== undefined && out.originalPrice !== null && out.originalPrice !== '') {
    out.originalPrice = parseFloat(out.originalPrice);
  } else if (out.originalPrice === '') {
    out.originalPrice = null;
  }
  if (out.badge === '') out.badge = null;
  if (out.pickImage !== undefined) out.pickImage = out.pickImage === true || out.pickImage === 'true';
  if (out.images !== undefined) out.images = cleanUrls(out.images);
  if (out.variants !== undefined) {
    out.variants = (Array.isArray(out.variants) ? out.variants : [])
      .filter((v) => v && v.color)
      .slice(0, 12)
      .map((v) => ({ color: String(v.color), images: cleanUrls(v.images) }));
    // الألوان تتحسب من المتغيرات (المنتج ممكن يبقى من غير ألوان)
    out.colors = out.variants.map((v) => v.color);
  } else if (out.colors !== undefined) {
    out.colors = Array.isArray(out.colors) ? out.colors.filter((c) => c && c.length > 0) : [];
  }
  // الصورة الرئيسية = أول صورة متاحة (للتوافق مع باقي الموقع)
  if (out.images !== undefined || out.variants !== undefined) {
    const first = out.images?.[0] || out.variants?.find((v) => v.images.length)?.images[0];
    if (first) out.image = first;
    else if (out.image === undefined) out.image = '';
  }
  return out;
};

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map((e) => e.message).join('، ');
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'قيمة غير صالحة' });
  }
  console.error('Products API Error:', error);
  return res.status(500).json({ message: 'حدث خطأ في السيرفر' });
};

// CORS بيتعمل في server.js
export default async (req, res) => {
  const { method } = req;

  if (method === 'OPTIONS') {
    return res.status(204).end();
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;
  const match = pathname.match(/\/api\/products\/?([^/]*)$/);
  const productId = match?.[1] || null;

  if (productId && !mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'ID غير صالح' });
  }

  // أي عملية كتابة محتاجة تسجيل دخول الأدمن
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    let denied = true;
    requireAdmin(req, res, () => { denied = false; });
    if (denied) return; // الـ middleware رد بالفعل 401
  }

  try {
    if (method === 'GET') {
      if (productId) {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
        return res.status(200).json(product);
      }
      const products = await Product.find().sort({ createdAt: -1 });
      return res.status(200).json(products);
    }

    if (method === 'POST') {
      const data = pick(req.body || {});

      if (!data.name || data.price === undefined || Number.isNaN(data.price)) {
        return res.status(400).json({ message: 'الاسم والسعر مطلوبان' });
      }

      const product = await Product.create({
        ...data,
        description: data.description || '',
        image: data.image || '',
        category: data.category || 'عام',
        stock: data.stock || 0,
        colors: data.colors || []
      });

      return res.status(201).json(product);
    }

    if (method === 'PUT') {
      if (!productId) return res.status(400).json({ message: 'ID مطلوب' });

      const product = await Product.findByIdAndUpdate(productId, pick(req.body || {}), {
        new: true,
        runValidators: true
      });

      if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
      return res.status(200).json(product);
    }

    if (method === 'DELETE') {
      if (!productId) return res.status(400).json({ message: 'ID مطلوب' });

      const product = await Product.findByIdAndDelete(productId);
      if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

      return res.status(200).json({ message: 'تم الحذف بنجاح' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return handleError(res, error);
  }
};

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Contact from '../models/Contact.js';
import { requireAdmin } from '../middleware/auth.js';

export default async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  let denied = true;
  requireAdmin(req, res, () => { denied = false; });
  if (denied) return;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [productsCount, ordersCount, pendingOrders, newMessages, lowStock, revenueAgg, monthAgg, recentOrders] =
    await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Contact.countDocuments({ status: 'new' }),
      Product.find({ stock: { $lte: 3 } }).select('name stock image').sort({ stock: 1 }).limit(8),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5)
    ]);

  res.status(200).json({
    productsCount,
    ordersCount,
    pendingOrders,
    newMessages,
    totalRevenue: revenueAgg[0]?.total || 0,
    monthRevenue: monthAgg[0]?.total || 0,
    monthOrders: monthAgg[0]?.count || 0,
    lowStock,
    recentOrders
  });
};

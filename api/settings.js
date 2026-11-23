import Settings from '../models/Settings.js';
import { requireAdmin } from '../middleware/auth.js';

const FIELDS = [
  'storeName', 'tagline', 'phone', 'whatsapp', 'email', 'address',
  'instagram', 'facebook', 'deliveryFee', 'freeShippingThreshold', 'announcement'
];

export const getSettings = async () =>
  Settings.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

export default async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json(await getSettings());
  }

  if (req.method === 'PUT') {
    let denied = true;
    requireAdmin(req, res, () => { denied = false; });
    if (denied) return;

    const update = {};
    for (const f of FIELDS) {
      if (req.body?.[f] !== undefined) {
        update[f] = ['deliveryFee', 'freeShippingThreshold'].includes(f)
          ? Number(req.body[f]) || 0
          : String(req.body[f]);
      }
    }
    try {
      const doc = await Settings.findOneAndUpdate({ key: 'main' }, { $set: update }, {
        new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true
      });
      return res.status(200).json(doc);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join('، ') });
      }
      throw error;
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

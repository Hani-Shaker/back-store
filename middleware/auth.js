import crypto from 'crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 ساعة

const getSecret = () => {
  const secret = process.env.TOKEN_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD (or TOKEN_SECRET) is missing');
  return secret;
};

const sign = (payload) =>
  crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');

// مقارنة آمنة ضد timing attacks
export const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export const createAdminToken = () => {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const verifyAdminToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.role === 'admin' && data.exp > Date.now();
  } catch {
    return false;
  }
};

// Middleware: يتطلب Authorization: Bearer <token>
export const requireAdmin = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ message: 'غير مصرح — سجّل دخول الأدمن أولاً' });
  }
  next();
};

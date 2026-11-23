import { createAdminToken, safeEqual } from '../middleware/auth.js';

const adminVerifyHandler = async (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({
        message: 'كلمة السر مطلوبة',
        authenticated: false
      });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set');
      return res.status(500).json({
        message: 'إعدادات السيرفر ناقصة',
        authenticated: false
      });
    }

    if (safeEqual(password, adminPassword)) {
      return res.status(200).json({
        message: 'كلمة السر صحيحة ✅',
        authenticated: true,
        token: createAdminToken()
      });
    }

    return res.status(401).json({
      message: 'كلمة السر خاطئة ❌',
      authenticated: false
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      message: 'خطأ في التحقق',
      authenticated: false
    });
  }
};

export default adminVerifyHandler;

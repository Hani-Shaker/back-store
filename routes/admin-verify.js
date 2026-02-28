// routes/admin-verify.js
const adminVerifyHandler = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'كلمة السر مطلوبة',
        authenticated: false 
      });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || '123456';

    if (password === adminPassword) {
      return res.status(200).json({ 
        message: 'كلمة السر صحيحة ✅',
        authenticated: true,
        token: Buffer.from(password).toString('base64')
      });
    } else {
      return res.status(401).json({ 
        message: 'كلمة السر خاطئة ❌',
        authenticated: false 
      });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ 
      message: 'خطأ في التحقق',
      authenticated: false,
      error: error.message
    });
  }
};

export default adminVerifyHandler;

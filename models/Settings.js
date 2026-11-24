import mongoose from 'mongoose';

// وثيقة واحدة فقط (singleton) لإعدادات المتجر
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    storeName: { type: String, default: 'Lola Store', trim: true, maxlength: 60 },
    tagline: { type: String, default: 'أزياء وإكسسوارات بأحدث الصيحات', trim: true, maxlength: 160 },
    phone: { type: String, default: '01026385348', trim: true },
    whatsapp: { type: String, default: '201026385348', trim: true },
    email: { type: String, default: 'lolostore112@gmail.com', trim: true },
    address: { type: String, default: 'مصر - الفيوم', trim: true },
    instagram: { type: String, default: '', trim: true },
    facebook: { type: String, default: '', trim: true },
    deliveryFee: { type: Number, default: 50, min: 0 },
    freeShippingThreshold: { type: Number, default: 0, min: 0 }, // 0 = معطّل
    announcement: { type: String, default: '', trim: true, maxlength: 200 }
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // اسم المنتج
    name: {
      type: String,
      required: [true, 'اسم المنتج مطلوب'],
      trim: true,
      minlength: [2, 'الاسم يجب ألا يقل عن حرفين'],
      maxlength: [100, 'الاسم يجب أن لا يتجاوز 100 حرف']
    },

    // وصف المنتج
    description: {
      type: String,
      default: '',
      maxlength: [500, 'الوصف يجب أن لا يتجاوز 500 حرف']
    },

    // سعر المنتج
    price: {
      type: Number,
      required: [true, 'السعر مطلوب'],
      min: [0, 'السعر لا يمكن أن يكون سالب']
    },

    // رابط الصورة
    image: {
      type: String,
      default: ''
    },

    // صور المنتج الأساسية (تُعرض لو مفيش ألوان، أو لو اللون ملوش صور)
    images: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 10, 'الحد الأقصى 10 صور']
    },

    // متغيرات الألوان: كل لون له صوره الخاصة
    variants: {
      type: [
        new mongoose.Schema(
          {
            color: { type: String, match: [/^#[0-9A-F]{6}$/i, 'لون غير صالح'], required: true },
            images: { type: [String], default: [] }
          },
          { _id: false }
        )
      ],
      default: [],
      validate: [(v) => v.length <= 12, 'الحد الأقصى 12 لون']
    },

    // فئة المنتج
    category: {
      type: String,
      default: 'عام',
      enum: ['إلكترونيات', 'ملابس', 'إكسسوارات', 'أخرى', 'عام', 'ميكب', 'ادوات منزلية']
    },

    // الكمية المتاحة
    stock: {
      type: Number,
      default: 0,
      min: [0, 'الكمية لا يمكن أن تكون سالبة']
    },

    // ألوان المنتج المتاحة
    colors: [{
      type: String,
      validate: {
        validator: function(v) {
          // التحقق من صيغة hex color
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'لون غير صالح. يجب أن يكون بصيغة hex (#RRGGBB)'
      }
    }],

    // سعر أصلي (للخصومات)
    originalPrice: {
      type: Number,
      default: null
    },

    // badges (جديد، الأكثر مبيعاً، إلخ)
    badge: {
      type: String,
      enum: ['new', 'bestseller', 'sale', null],
      default: null
    }
  },
  {
    timestamps: true // createdAt و updatedAt تلقائياً
  }
);

export default mongoose.model('Product', productSchema);

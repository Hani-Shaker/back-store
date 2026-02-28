import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // اسم المنتج
    name: {
      type: String,
      required: [true, 'اسم المنتج مطلوب'],
      trim: true,
      minlength: [2, 'الاسم يجب أن يكون أطول من حرف واحد'],
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

    // فئة المنتج
    category: {
      type: String,
      default: 'عام',
      enum: ['إلكترونيات', 'ملابس', 'إكسسوارات', 'أثاث', 'أخرى', 'عام']
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

// تعيين قيمة افتراضية للألوان عند الإنشاء
productSchema.pre('save', function(next) {
  if (!this.colors || this.colors.length === 0) {
    this.colors = ['#000000'];
  }
  next();
});

export default mongoose.model('Product', productSchema);

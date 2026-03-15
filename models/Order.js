import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: {
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    notes: String
  },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    selectedColor: String,
    image: String,
    category: String
  }],
  totalPrice: Number,
  deliveryFee: { type: Number, default: 50 },
  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered'],
    default: 'pending'
  },
  ipAddress: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: 'Unknown' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  category: String,
  stock: { type: Number, default: 0 },
  colors: [{
  type: String,
  default: ''
}],
}, { timestamps: true });

export default mongoose.model('Product', productSchema);    
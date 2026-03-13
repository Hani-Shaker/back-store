import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String,
    trim: true
  },
  subject: { 
    type: String, 
    default: 'بدون عنوان'
  },
  message: { 
    type: String, 
    required: true
  },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);
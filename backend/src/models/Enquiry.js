import mongoose from 'mongoose';

// Stores both wholesale enquiries and contact-page messages.
const enquirySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['wholesale', 'contact'], required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    // wholesale-only fields
    businessName: { type: String, trim: true },
    city: { type: String, trim: true },
    productCategory: { type: String, trim: true },
    quantity: { type: Number, min: 1 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', enquirySchema);

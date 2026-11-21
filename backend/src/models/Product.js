import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Men', 'Women', 'Kids'],
    },
    type: { type: String, required: [true, 'Product type is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    oldPrice: { type: Number, min: 0, default: null },
    sizes: { type: [String], default: [] },
    colors: { type: [colorSchema], default: [] },
    image: { type: String, default: '', trim: true },
    tint: { type: String, default: '#eeeeee' }, // placeholder image colour (until real images are added)
    fabric: { type: String, trim: true },
    description: { type: String, trim: true },
    featured: { type: Boolean, default: false },
    // "isNew" is a reserved name in Mongoose, so it is stored as newArrival
    // and returned as isNew in API responses (see toJSON below).
    newArrival: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, type: 1 });

// Shape that matches what the React frontend already uses
productSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    ret.isNew = ret.newArrival;
    delete ret._id;
    delete ret.__v;
    delete ret.newArrival;
    return ret;
  },
});

export default mongoose.model('Product', productSchema);

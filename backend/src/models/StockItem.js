import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code (SKU) is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    unit: {
      type: String,
      default: 'Pieces',
      trim: true,
    },
    type: {
      type: String,
      default: 'General',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    openingStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Opening stock cannot be negative'],
    },
    totalInward: {
      type: Number,
      default: 0,
      min: [0, 'Total inward cannot be negative'],
    },
    totalOutward: {
      type: Number,
      default: 0,
      min: [0, 'Total outward cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Current stock cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Helper method to compute current stock and status
stockItemSchema.methods.recalculateStock = function () {
  this.currentStock = this.openingStock + this.totalInward - this.totalOutward;
  if (this.currentStock < 0) {
    throw new Error(`Calculation error: Current stock for ${this.name} (${this.itemCode}) cannot be negative (${this.currentStock}).`);
  }

  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.lowStockThreshold) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
};

stockItemSchema.index({ category: 1 });
stockItemSchema.index({ status: 1 });

export default mongoose.model('StockItem', stockItemSchema);

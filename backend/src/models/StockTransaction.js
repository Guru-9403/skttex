import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    stockItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: [true, 'Stock item reference is required'],
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['INWARD', 'OUTWARD'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      default: 'Pieces',
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    partyName: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByName: {
      type: String,
      default: 'Admin',
    },
  },
  { timestamps: true }
);

stockTransactionSchema.index({ type: 1, date: -1 });
stockTransactionSchema.index({ stockItem: 1, date: -1 });
stockTransactionSchema.index({ itemCode: 1 });

export default mongoose.model('StockTransaction', stockTransactionSchema);

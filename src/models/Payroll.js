import mongoose, { Schema, models, model } from 'mongoose';

const PayrollSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    basic: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PayrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = models.Payroll || model('Payroll', PayrollSchema);

import mongoose, { Schema, models, model } from 'mongoose';

const PayrollSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Salary Components (set by HR)
    basic_salary: { type: Number, default: 0, required: true }, // Fixed base pay
    allowance: { type: Number, default: 0 }, // Additional allowances
    bonus: { type: Number, default: 0 }, // Optional performance bonuses
    deductions: { type: Number, default: 0 }, // Taxes, late penalties, etc.
    leave_deduction: { type: Number, default: 0 }, // Auto-calculated from attendance if leave exceeds limit
    total_salary: { type: Number, default: 0 }, // Net salary after all calculations
    
    // Period Information
    month: { type: String, required: true }, // e.g., "October 2025" or "2025-10"
    
    // Legacy fields (for backward compatibility)
    year: { type: Number }, // Deprecated - extracted from month field
    
    // Payment Status
    status: { 
      type: String, 
      enum: ['Pending', 'Paid', 'Processing'], 
      default: 'Pending' 
    },
    payment_date: { type: Date }, // When salary was processed
    
    // Document Management
    payslip_url: { type: String, default: '' }, // Link to generated payslip (PDF)
    
    // Legacy fields (for backward compatibility)
    basic: { type: Number }, // Deprecated - use basic_salary
    allowances: { type: Number }, // Deprecated - use allowance
    net: { type: Number }, // Deprecated - use total_salary
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for unique payroll per user per month
PayrollSchema.index({ user: 1, month: 1 }, { unique: true });

// Pre-save hook to calculate total_salary and maintain backward compatibility
PayrollSchema.pre('save', function(next) {
  // Calculate total salary
  this.total_salary = (this.basic_salary || 0) + 
                      (this.allowance || 0) + 
                      (this.bonus || 0) - 
                      (this.deductions || 0) - 
                      (this.leave_deduction || 0);
  
  // Maintain backward compatibility with legacy fields
  this.basic = this.basic_salary;
  this.allowances = this.allowance;
  this.net = this.total_salary;
  
  // Extract year from month if month is in "YYYY-MM" or "Month YYYY" format
  if (this.month && !this.year) {
    const yearMatch = this.month.match(/\d{4}/);
    if (yearMatch) {
      this.year = parseInt(yearMatch[0]);
    }
  }
  
  next();
});

export const Payroll = models.Payroll || model('Payroll', PayrollSchema);

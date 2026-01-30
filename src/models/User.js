import mongoose, { Schema, models, model } from 'mongoose';
import bcrypt from 'bcrypt';
import './Department'; // Ensure Department model is loaded

export const rolesList = ['Admin', 'HR', 'Reporting Manager', 'Employee'];

// Delete the model if it exists to force re-compilation with new schema
if (models.User) {
  delete models.User;
}

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: rolesList, default: 'Employee' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: String, trim: true }, // Job title/designation
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' }, // Gender for leave eligibility
    
    // Leave entitlement date (date when employee becomes eligible for leaves)
    leave_entitlement_date: { 
      type: Date, 
      default: function() {
        // Default to January 1st of current year
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1);
      }
    },
    
  
    leave_limit: { type: Number, default: 10 }, // Annual leave limit (in days per year)
    
    // Sick leave fields (separate from regular leaves)
    sick_leave_limit: { type: Number, default: 3 }, // Annual sick leave limit (in days per year)
    
    // Maternity leave fields
    maternity_leave_limit: { type: Number, default: 0 }, // Annual maternity leave limit (in days per year) - Default 0, Contact HR to set limit
    
    // Paternity leave fields
    paternity_leave_limit: { type: Number, default: 2 }, // Annual paternity leave limit (in days per year)
    
    // Password reset tokens
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

// Indexes for common queries
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Calculate pro-rata leave limit based on entitlement date
UserSchema.methods.calculateProRataLeave = function(annualLimit, currentDate = new Date()) {
  const entitlementDate = this.leave_entitlement_date || new Date(currentDate.getFullYear(), 0, 1);
  const yearStart = new Date(currentDate.getFullYear(), 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  
  const entitlement = new Date(entitlementDate);
  entitlement.setHours(0, 0, 0, 0);
  
  // If entitlement date is January 1st of current year, return full quota
  if (entitlement.getTime() === yearStart.getTime()) {
    return annualLimit;
  }
  
  // Calculate pro-rata based on remaining days in the year
  const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
  yearEnd.setHours(23, 59, 59, 999);
  
  // Calculate total days in year
  const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDaysInYear = 365 + (isLeapYear(currentDate.getFullYear()) ? 1 : 0);
  
  // Calculate remaining days from entitlement date to end of year (inclusive)
  const oneDayMs = 1000 * 60 * 60 * 24;
  const remainingDays = Math.floor((yearEnd.getTime() - entitlement.getTime()) / oneDayMs) + 1;
  
  // Calculate pro-rata leave: (remaining days * leave limit) / total days in year
  const proRataLeave = Math.floor((remainingDays * annualLimit) / totalDaysInYear);
  
  return proRataLeave;
};

// Get calculated leave limits based on entitlement date
UserSchema.methods.getCalculatedLeaveLimits = function() {
  return {
    annual_leave: this.calculateProRataLeave(this.leave_limit),
    sick_leave: this.calculateProRataLeave(this.sick_leave_limit),
    maternity_leave: this.calculateProRataLeave(this.maternity_leave_limit),
    paternity_leave: this.calculateProRataLeave(this.paternity_leave_limit)
  };
};

export const User = models.User || model('User', UserSchema);

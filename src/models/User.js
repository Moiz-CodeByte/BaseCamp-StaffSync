import mongoose, { Schema, models, model } from 'mongoose';
import bcrypt from 'bcrypt';
import './Department'; // Ensure Department model is loaded

export const rolesList = ['Admin', 'HR', 'Employee'];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: rolesList, default: 'Employee' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    assignedHR: { type: Schema.Types.ObjectId, ref: 'User' },
    designation: { type: String, trim: true }, // Job title/designation
    
    // _basic_salary: { type: Number, default: 0 }, // Default monthly basic salary
    // get basic_salary() {
    //   return this._basic_salary;
    // },
    // set basic_salary(value) {
    //   this._basic_salary = value;
    // },
    //_allowance: { type: Number, default: 0 }, // Default monthly allowance
    leave_limit: { type: Number, default: 10 }, // Annual leave limit (in days per month)
    
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

export const User = models.User || model('User', UserSchema);

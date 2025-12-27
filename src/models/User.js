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
    reportingManagers: [{
      name: { type: String, required: true },
      email: { type: String, required: true }
    }],
    designation: { type: String, trim: true }, // Job title/designation
    
    // _basic_salary: { type: Number, default: 0 }, // Default monthly basic salary
    // get basic_salary() {
    //   return this._basic_salary;
    // },
    // set basic_salary(value) {
    //   this._basic_salary = value;
    // },
    //_allowance: { type: Number, default: 0 }, // Default monthly allowance
    leave_limit: { type: Number, default: 10 }, // Annual leave limit (in days)
    leaveEntitlementDate: { type: Date }, // Date when leave entitlement starts (defaults to Jan 1 of current year if not set)
    
    // Historical leave data (for migration purposes)
    previousLeavesAvailed: { type: Number, default: 0 }, // Leaves already used before system migration
    previousLeavesAvailedYear: { type: Number }, // Year when previousLeavesAvailed was set (auto-resets at year-end)
    
    // Password reset tokens
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

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

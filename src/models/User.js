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
    
    // Salary Information (set by HR/Admin)
    basic_salary: { type: Number, default: 0 }, // Default monthly basic salary
    allowance: { type: Number, default: 0 }, // Default monthly allowance
    leave_limit: { type: Number, default: 12 }, // Annual leave limit (in days)
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

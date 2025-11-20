import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  reportingManagers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    }
  }],
  hr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'HR is required']
  }
}, {
  timestamps: true,
  collection: 'departments'
});

export const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

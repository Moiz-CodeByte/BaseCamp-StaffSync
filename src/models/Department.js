import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  reportingManagerName: {
    type: String,
    required: [true, 'Reporting manager name is required'],
    trim: true
  },
  reportingManagerEmail: {
    type: String,
    required: [true, 'Reporting manager email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
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

import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
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

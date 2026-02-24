import mongoose from 'mongoose';

// Delete the model if it exists to force re-compilation with new schema
if (mongoose.models.Department) {
  delete mongoose.models.Department;
}

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
  },
  reportingManagers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  collection: 'departments'
});

export const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

import mongoose, { Schema, models, model } from 'mongoose';

const LeaveSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Annual', 'Sick', 'Casual', 'Unpaid'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    managerApprovals: [{
      managerEmail: { type: String, required: true },
      managerName: { type: String, required: true },
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      emailSent: { type: Boolean, default: false },
      emailSentAt: { type: Date },
      approvedAt: { type: Date }
    }]
  },
  { timestamps: true }
);

export const Leave = models.Leave || model('Leave', LeaveSchema);

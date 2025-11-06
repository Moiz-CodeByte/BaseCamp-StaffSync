import mongoose, { Schema, models, model } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'Half-Day'], default: 'Present' },
    leaveType: { type: String }, // Type of leave if status is Absent due to approved leave
    remarks: { type: String }, // Additional notes (e.g., "Approved Sick leave")
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model('Attendance', AttendanceSchema);

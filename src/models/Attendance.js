import mongoose, { Schema, models, model } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'Half-Day'], default: 'Present' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model('Attendance', AttendanceSchema);

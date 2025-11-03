import mongoose, { Schema, models, model } from 'mongoose';

const CalendarEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['Holiday', 'Meeting', 'Event'], default: 'Event' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CalendarEvent = models.CalendarEvent || model('CalendarEvent', CalendarEventSchema);

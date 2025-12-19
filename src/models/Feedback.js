import mongoose, { Schema, models, model } from 'mongoose';

const FeedbackSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['Bug Report', 'Feature Request', 'General Feedback', 'Complaint'], 
      required: true 
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'], 
      default: 'Medium' 
    },
    status: { 
      type: String, 
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
      default: 'Open' 
    },
    adminNotes: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Feedback = models.Feedback || model('Feedback', FeedbackSchema);

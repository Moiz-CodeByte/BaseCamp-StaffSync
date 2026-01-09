import { Leave } from '@/models/Leave';

/**
 * Automatically reject pending leave requests where the end date has passed
 * @returns {Promise<number>} Number of leaves auto-rejected
 */
export async function autoRejectExpiredLeaves() {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    // Find all pending leaves where end date is before today
    const expiredLeaves = await Leave.find({
      status: 'Pending',
      endDate: { $lt: now }
    });

    if (expiredLeaves.length === 0) {
      return 0;
    }

    // Update all expired leaves to Rejected
    const result = await Leave.updateMany(
      {
        status: 'Pending',
        endDate: { $lt: now }
      },
      {
        $set: {
          status: 'Rejected',
          updatedAt: new Date()
        }
      }
    );

    console.log(`Auto-rejected ${result.modifiedCount} expired leave request(s)`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error auto-rejecting expired leaves:', error);
    return 0;
  }
}

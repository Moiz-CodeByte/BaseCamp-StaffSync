import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Payroll } from '@/models/Payroll';
import { User } from '@/models/User';
import { Attendance } from '@/models/Attendance';

export async function POST(req) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin' && user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();

  const { month, bonus = 0, deductions = 0 } = await req.json();
  
  // Validate month format (e.g., "October 2025" or "2025-10")
  if (!month) {
    return NextResponse.json({ message: 'Month is required (e.g., "October 2025" or "2025-10")' }, { status: 400 });
  }

  const employees = await User.find({ 
    role: { $in: ['Employee', 'HR', 'Admin'] } 
  }).select('_id name basic_salary allowance leave_limit');
  
  const results = [];
  
  for (const emp of employees) {
    try {
      // Calculate leave deduction based on attendance
      const leave_deduction = await calculateLeaveDeduction(emp._id, month, emp.leave_limit || 12);
      
      const payload = {
        user: emp._id,
        month,
        basic_salary: emp.basic_salary || 0,
        allowance: emp.allowance || 0,
        bonus: bonus || 0,
        deductions: deductions || 0,
        leave_deduction,
        status: 'Pending',
      };

      const slip = await Payroll.findOneAndUpdate(
        { user: emp._id, month },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      results.push({ 
        user: String(emp._id), 
        name: emp.name,
        ok: true, 
        total_salary: slip.total_salary 
      });
    } catch (e) {
      results.push({ 
        user: String(emp._id), 
        name: emp.name,
        ok: false, 
        error: e.message 
      });
    }
  }
  
  return NextResponse.json({ results });
}

// Helper function to calculate leave deduction
async function calculateLeaveDeduction(userId, month, leaveLimit) {
  try {
    // Extract year and month number from month string
    const yearMatch = month.match(/\d{4}/);
    if (!yearMatch) return 0;
    
    const year = parseInt(yearMatch[0]);
    
    // Get month number (1-12)
    let monthNum;
    if (month.includes('-')) {
      // Format: "2025-10"
      monthNum = parseInt(month.split('-')[1]);
    } else {
      // Format: "October 2025"
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = month.split(' ')[0];
      monthNum = monthNames.indexOf(monthName) + 1;
    }
    
    if (!monthNum || monthNum < 1 || monthNum > 12) return 0;
    
    // Get attendance records for the year up to this month
    const startOfYear = new Date(year, 0, 1);
    const endOfMonth = new Date(year, monthNum, 0);
    
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startOfYear, $lte: endOfMonth },
      status: { $in: ['Absent', 'Leave'] }
    });
    
    const totalLeaveDays = attendanceRecords.length;
    
    // Calculate excess leave days
    const excessDays = Math.max(0, totalLeaveDays - leaveLimit);
    
    // Calculate deduction (e.g., deduct proportional salary per excess day)
    // Assuming 30 days per month for calculation
    const user = await User.findById(userId).select('basic_salary');
    const dailySalary = (user.basic_salary || 0) / 30;
    const leave_deduction = dailySalary * excessDays;
    
    return Math.round(leave_deduction * 100) / 100; // Round to 2 decimal places
  } catch (e) {
    console.error('Error calculating leave deduction:', e);
    return 0;
  }
}

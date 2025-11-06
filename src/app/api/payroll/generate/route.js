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
      
      const basic_salary = emp.basic_salary || 0;
      const allowance = emp.allowance || 0;
      const bonusAmount = bonus || 0;
      const deductionsAmount = deductions || 0;
      
      // Calculate total salary manually
      const total_salary = basic_salary + allowance + bonusAmount - deductionsAmount - leave_deduction;
      
      const payload = {
        user: emp._id,
        month,
        basic_salary,
        allowance,
        bonus: bonusAmount,
        deductions: deductionsAmount,
        leave_deduction,
        total_salary, // Set it explicitly
        status: 'Pending',
      };

      const slip = await Payroll.findOneAndUpdate(
        { user: emp._id, month },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      results.push({ 
        user: String(emp._id), 
        name: emp.name,
        ok: true, 
        basic_salary,
        allowance,
        leave_deduction,
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

// Helper function to calculate leave deduction based on working days (excluding weekends)
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
    
    // Get attendance records for the ENTIRE YEAR up to this month
    const startOfYear = new Date(year, 0, 1);
    const endOfMonth = new Date(year, monthNum, 0); // Last day of current month
    
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startOfYear, $lte: endOfMonth },
      status: 'Absent'
    });
    
    // Count total absent days in the year so far
    const totalAbsentDays = attendanceRecords.length;
    
    // Calculate how much leave allowance the employee has used up to this month
    // (Proportional to the number of months elapsed)
    const leaveAllowanceUsed = (leaveLimit / 12) * monthNum;
    
    // Calculate excess leave days beyond annual allowance
    const excessDays = Math.max(0, totalAbsentDays - leaveAllowanceUsed);
    
    // If no excess days, no deduction
    if (excessDays === 0) {
      return 0;
    }
    
    // Count working days in the current month (excluding Saturdays and Sundays)
    const startOfMonth = new Date(year, monthNum - 1, 1);
    let workingDays = 0;
    const currentDate = new Date(startOfMonth);
    
    while (currentDate <= endOfMonth) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate deduction based on working days (not calendar days)
    const user = await User.findById(userId).select('basic_salary allowance');
    const monthlySalary = (user.basic_salary || 0) + (user.allowance || 0);
    const dailySalary = workingDays > 0 ? monthlySalary / workingDays : 0;
    const leave_deduction = dailySalary * excessDays;
    
    console.log(`Leave calculation for user ${userId}:`, {
      month,
      year,
      monthNum,
      totalAbsentDays,
      leaveAllowanceUsed: leaveAllowanceUsed.toFixed(2),
      excessDays: excessDays.toFixed(2),
      workingDays,
      monthlySalary,
      dailySalary: dailySalary.toFixed(2),
      leave_deduction: leave_deduction.toFixed(2)
    });
    
    return Math.round(leave_deduction * 100) / 100; // Round to 2 decimal places
  } catch (e) {
    console.error('Error calculating leave deduction:', e);
    return 0;
  }
}

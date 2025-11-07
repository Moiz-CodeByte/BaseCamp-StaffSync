import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Payroll } from '@/models/Payroll';

// GET specific payroll record
export async function GET(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const { id } = await params;
  
  try {
    const payroll = await Payroll.findById(id).populate('user', 'name email department');
    
    if (!payroll) {
      return NextResponse.json({ message: 'Payroll record not found' }, { status: 404 });
    }
    
    // Employees can only view their own payroll
    if (user.role === 'Employee' && String(payroll.user._id) !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ payroll });
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

// UPDATE payroll record (HR/Admin only)
export async function PATCH(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin' && user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();

  const { id } = await params;
  const updates = await req.json();
  
  try {
    // Allowed fields to update
    const allowedFields = [
      'basic_salary', 'allowance', 'bonus', 'deductions', 
      'leave_deduction', 'status', 'payment_date', 'payslip_url'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    // Mark payment_date if status changed to 'Paid'
    if (updates.status === 'Paid' && !updates.payment_date) {
      updateData.payment_date = new Date();
    }
    
    console.log('Payroll PATCH - Update Data:', updateData);
    
    const payroll = await Payroll.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('user', 'name email department');
    
    if (!payroll) {
      return NextResponse.json({ message: 'Payroll record not found' }, { status: 404 });
    }
    
    console.log('Payroll PATCH - Result:', {
      total_salary: payroll.total_salary,
      basic_salary: payroll.basic_salary,
      allowance: payroll.allowance,
      bonus: payroll.bonus,
      deductions: payroll.deductions,
      leave_deduction: payroll.leave_deduction
    });
    
    return NextResponse.json({ payroll, message: 'Payroll updated successfully' });
  } catch (e) {
    console.error('Payroll update error:', e);
    return NextResponse.json({ message: e.message || 'Failed to update payroll' }, { status: 400 });
  }
}

// DELETE payroll record (Admin only)
export async function DELETE(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 });
  }
  await connectDB();

  const { id } = await params;
  
  try {
    const payroll = await Payroll.findByIdAndDelete(id);
    
    if (!payroll) {
      return NextResponse.json({ message: 'Payroll record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Payroll record deleted successfully' });
  } catch (e) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

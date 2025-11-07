"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Download, Trash2 } from 'lucide-react';

export default function PayrollTableRow({ 
  payroll, 
  isEditing, 
  editForm,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditChange,
  onDelete,
  isAdmin 
}) {
  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'default',
      'Processing': 'outline',
      'Paid': 'secondary'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (!payroll.user) {
    return null; // Skip if user data is missing
  }

  if (isEditing) {
    return (
      <tr className="border-b hover:bg-muted/50">
        <td className="p-2">
          <div className="font-medium">{payroll.user.name}</div>
          <div className="text-xs text-muted-foreground">{payroll.user.email}</div>
        </td>
        <td className="p-2 text-sm">{payroll.month}</td>
        <td className="p-2">
          <Input 
            type="number"
            value={editForm.basic_salary}
            onChange={(e) => onEditChange('basic_salary', parseFloat(e.target.value) || 0)}
            className="w-28"
          />
        </td>
        <td className="p-2">
          <Input 
            type="number"
            value={editForm.allowance}
            onChange={(e) => onEditChange('allowance', parseFloat(e.target.value) || 0)}
            className="w-28"
          />
        </td>
        <td className="p-2">
          <Input 
            type="number"
            value={editForm.bonus}
            onChange={(e) => onEditChange('bonus', parseFloat(e.target.value) || 0)}
            className="w-24"
          />
        </td>
        <td className="p-2">
          <Input 
            type="number"
            value={editForm.deductions}
            onChange={(e) => onEditChange('deductions', parseFloat(e.target.value) || 0)}
            className="w-24"
          />
        </td>
        <td className="p-2">
          <Input 
            type="number"
            value={editForm.leave_deduction}
            onChange={(e) => onEditChange('leave_deduction', parseFloat(e.target.value) || 0)}
            className="w-24"
          />
        </td>
        <td className="p-2 font-semibold">
          ${((editForm.basic_salary || 0) + (editForm.allowance || 0) + (editForm.bonus || 0) - 
             (editForm.deductions || 0) - (editForm.leave_deduction || 0)).toLocaleString()}
        </td>
        <td className="p-2">
          <Select value={editForm.status} onValueChange={(val) => onEditChange('status', val)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="outline" onClick={onEditCancel}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => onEditSave(payroll._id)}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-2">
        <div className="font-medium">{payroll.user.name}</div>
        <div className="text-xs text-muted-foreground">{payroll.user.email}</div>
      </td>
      <td className="p-2 text-sm">{payroll.month}</td>
      <td className="p-2 text-right">${(payroll.basic_salary || 0).toLocaleString()}</td>
      <td className="p-2 text-right text-green-600">+Rs. {(payroll.allowance || 0).toLocaleString()}</td>
      <td className="p-2 text-right">{payroll.bonus > 0 ? `+Rs. ${payroll.bonus.toLocaleString()}` : '-'}</td>
      <td className="p-2 text-right">{payroll.deductions > 0 ? `-Rs. ${payroll.deductions.toLocaleString()}` : '-'}</td>
      <td className="p-2 text-right text-red-600">{payroll.leave_deduction > 0 ? `-Rs. ${payroll.leave_deduction.toLocaleString()}` : '-'}</td>
      <td className="p-2 text-right font-semibold text-blue-600">Rs. {(payroll.total_salary || 0).toLocaleString()}</td>
      <td className="p-2">{getStatusBadge(payroll.status)}</td>
      <td className="p-2">
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="outline" onClick={() => onEditStart(payroll)}>
            <Edit className="w-4 h-4" />
          </Button>
          {payroll.payslip_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={payroll.payslip_url} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(payroll._id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

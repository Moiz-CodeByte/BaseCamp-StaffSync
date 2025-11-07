"use client";

import PayrollTableRow from './PayrollTableRow';

export default function PayrollTable({ 
  payrolls, 
  editingId,
  editForm,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditChange,
  onDelete,
  isAdmin 
}) {
  if (payrolls.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No payroll records found.</p>
        <p className="text-sm mt-2">Generate payroll to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-semibold">Employee</th>
            <th className="text-left p-2 font-semibold">Month</th>
            <th className="text-right p-2 font-semibold">Basic</th>
            <th className="text-right p-2 font-semibold">Allowance</th>
            <th className="text-right p-2 font-semibold">Bonus</th>
            <th className="text-right p-2 font-semibold">Deductions</th>
            <th className="text-right p-2 font-semibold">Leave Ded.</th>
            <th className="text-right p-2 font-semibold">Total</th>
            <th className="text-left p-2 font-semibold">Status</th>
            <th className="text-right p-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map(payroll => (
            <PayrollTableRow
              key={payroll._id}
              payroll={payroll}
              isEditing={editingId === payroll._id}
              editForm={editForm}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditSave={onEditSave}
              onEditChange={onEditChange}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

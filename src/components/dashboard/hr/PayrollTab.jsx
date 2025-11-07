"use client";

import PayrollManagementOptimized from '@/components/dashboard/PayrollManagementOptimized';

export default function PayrollTab() {
  return (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold">Payroll Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and manage employee payroll
        </p>
      </div> */}

      <PayrollManagementOptimized />
    </div>
  );
}

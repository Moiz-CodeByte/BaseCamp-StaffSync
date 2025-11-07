"use client";

import UserManagementTable from '@/components/dashboard/UserManagementTable';

export default function EmployeesTab({ users, onUpdate }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage employee information and settings
        </p>
      </div>

      <UserManagementTable 
        users={users} 
        onUpdate={onUpdate}
      />
    </div>
  );
}

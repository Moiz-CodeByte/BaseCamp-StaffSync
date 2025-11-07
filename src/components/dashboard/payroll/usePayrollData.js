"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function usePayrollData(isAdmin) {
  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [payrollRes, usersRes] = await Promise.all([
        api.get('/api/payroll/list'),
        api.get('/api/users/list')
      ]);
      const allPayrolls = payrollRes.data.payrolls || [];
      const allUsers = usersRes.data.users || [];
      
      // Filter based on role
      if (isAdmin) {
        // Admin can see all users and payrolls
        setPayrolls(allPayrolls);
        setUsers(allUsers);
      } else {
        // HR can only see Employee payrolls and users
        const employeeUsers = allUsers.filter(u => u.role === 'Employee');
        const employeeIds = employeeUsers.map(u => u._id);
        const employeePayrolls = allPayrolls.filter(p => p.user && employeeIds.includes(p.user._id));
        setPayrolls(employeePayrolls);
        setUsers(employeeUsers);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { payrolls, users, loading, loadData };
}

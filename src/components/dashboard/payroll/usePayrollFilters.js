"use client";

import { useState, useMemo } from 'react';

export function usePayrollFilters(payrolls) {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  // Get unique months from payrolls
  const availableMonths = useMemo(() => {
    const months = [...new Set(payrolls.map(p => p.month))];
    return months.sort().reverse();
  }, [payrolls]);

  // Apply filters using useMemo
  const filteredPayrolls = useMemo(() => {
    let filtered = [...payrolls];
    
    if (filterMonth && filterMonth !== 'all') {
      filtered = filtered.filter(p => p.month === filterMonth);
    }
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    if (filterUser && filterUser !== 'all') {
      filtered = filtered.filter(p => p.user && String(p.user._id) === filterUser);
    }
    
    return filtered;
  }, [payrolls, filterMonth, filterStatus, filterUser]);

  return {
    filterMonth,
    setFilterMonth,
    filterStatus,
    setFilterStatus,
    filterUser,
    setFilterUser,
    filteredPayrolls,
    availableMonths
  };
}

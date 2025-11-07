"use client";

import { useState, useMemo } from 'react';

export function usePayrollFilters(payrolls) {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.user?.name?.toLowerCase().includes(query) ||
        p.user?.email?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [payrolls, filterMonth, filterStatus, searchQuery]);

  return {
    filterMonth,
    setFilterMonth,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredPayrolls,
    availableMonths
  };
}

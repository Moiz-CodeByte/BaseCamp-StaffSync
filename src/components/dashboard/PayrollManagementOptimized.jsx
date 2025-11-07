"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { usePayrollData } from './payroll/usePayrollData';
import { usePayrollFilters } from './payroll/usePayrollFilters';
import PayrollFilters from './payroll/PayrollFilters';
import PayrollGenerateForm from './payroll/PayrollGenerateForm';
import PayrollTable from './payroll/PayrollTable';

export default function PayrollManagement({ isAdmin = false }) {
  // Data management
  const { payrolls, users, loading, loadData } = usePayrollData(isAdmin);
  
  // Filter management
  const {
    filterMonth,
    setFilterMonth,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredPayrolls,
    availableMonths
  } = usePayrollFilters(payrolls);

  // UI state
  const [showGenerate, setShowGenerate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Edit handlers
  const startEdit = (payroll) => {
    setEditingId(payroll._id);
    setEditForm({
      basic_salary: payroll.basic_salary || 0,
      allowance: payroll.allowance || 0,
      bonus: payroll.bonus || 0,
      deductions: payroll.deductions || 0,
      leave_deduction: payroll.leave_deduction || 0,
      status: payroll.status || 'Pending',
      payslip_url: payroll.payslip_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id) => {
    try {
      await api.patch(`/api/payroll/${id}`, editForm);
      toast.success('Payroll updated successfully');
      setEditingId(null);
      setEditForm({});
      await loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update payroll');
    }
  };

  const deletePayroll = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    
    try {
      await api.delete(`/api/payroll/${id}`);
      toast.success('Payroll deleted successfully');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete payroll');
    }
  };

  const handleGenerateSuccess = () => {
    setShowGenerate(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Payroll Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee salaries and payslips • {filteredPayrolls.length} records
          </p>
        </div>
        <Button onClick={() => setShowGenerate(!showGenerate)}>
          {showGenerate ? 'Cancel' : '+ Generate Payroll'}
        </Button>
      </div>

      {/* Generate Payroll Form */}
      {showGenerate && (
        <PayrollGenerateForm 
          onSuccess={handleGenerateSuccess}
          onCancel={() => setShowGenerate(false)}
        />
      )}

      {/* Filters */}
      <Card className="p-4">
        <PayrollFilters
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableMonths={availableMonths}
        />
      </Card>

      {/* Payroll Table */}
      <Card className="p-4">
        <PayrollTable
          payrolls={filteredPayrolls}
          editingId={editingId}
          editForm={editForm}
          onEditStart={startEdit}
          onEditCancel={cancelEdit}
          onEditSave={saveEdit}
          onEditChange={handleEditChange}
          onDelete={deletePayroll}
          isAdmin={isAdmin}
        />
      </Card>
    </div>
  );
}

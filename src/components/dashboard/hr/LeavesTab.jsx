"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import HRLeaveRequestForm from './HRLeaveRequestForm';

// Calculate business days (excluding weekends)
const calculateBusinessDays = (startDate, endDate) => {
  let start, end;
  if (typeof startDate === 'string') {
    start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
  } else {
    start = new Date(startDate);
  }
  if (typeof endDate === 'string') {
    end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00');
  } else {
    end = new Date(endDate);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < start) return 0;
  let businessDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
    current.setDate(current.getDate() + 1);
  }
  return businessDays;
};
import { Mail, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function LeavesTab({ leaves, allRecentLeaves, onAction, me }) {
  const [myLeaves, setMyLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [pastLeaves, setPastLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedStats, setExpandedStats] = useState({});

  const toggleStats = (leaveId) => {
    setExpandedStats(prev => ({
      ...prev,
      [leaveId]: !prev[leaveId]
    }));
  };

  const loadMyLeaves = async () => {
    try {
      const { data } = await api.get('/api/leaves/my');
      setMyLeaves(data.leaves || []);
    } catch (error) {
      console.error('Failed to load my leaves:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [myLeavesData, pastLeavesData] = await Promise.all([
          api.get('/api/leaves/my'),
          api.get('/api/leaves/all-recent')
        ]);
        if (!cancelled) {
          setMyLeaves(myLeavesData.data.leaves || []);
          // Filter out HR's own leaves from past leaves
          const filteredPastLeaves = (pastLeavesData.data.leaves || []).filter(
            leave => leave.status !== 'Pending' && leave.user?.role !== 'HR'
          );
          setPastLeaves(filteredPastLeaves);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load leaves:', error);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    loadMyLeaves();
  };

  const handleSendEmail = async (leaveId) => {
    setSendingEmail(leaveId);
    try {
      await api.post(`/api/leaves/${leaveId}/send-approval`);
      toast.success('Approval emails sent to additional recipients');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSendingEmail(null);
    }
  };

  const hasPendingApprovals = (leave) => {
    const hasPendingRecipients = leave.additionalRecipients && leave.additionalRecipients.some(r => r.status === 'Pending');
    return hasPendingRecipients;
  };

  return (
    <div className="space-y-6">
      <div>
        {/* <h2 className="text-2xl font-bold">Leave Management</h2> */}
        <p className="text-sm text-muted-foreground mt-1">
          Manage employee leave requests
        </p>
      </div>

      {/* Employee Leave Requests Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <h3 className="text-lg font-bold">Employee Leave Requests ({leaves.length})</h3>
          <p className="text-sm text-muted-foreground mt-1">Pending requests from your team</p>
        </div>
        
        <div className="p-6">
          {leaves.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium">No pending leave requests</p>
              <p className="text-sm mt-2">All leave requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map(leave => {
                const startDate = new Date(leave.startDate);
                const endDate = new Date(leave.endDate);
                const days = calculateBusinessDays(leave.startDate, leave.endDate);
                const stats = leave.leaveStats || {};
                
                return (
                  <div key={leave._id} className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-card">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {leave.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-base">{leave.user?.name}</h4>
                            <p className="text-xs text-muted-foreground">{leave.user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {hasPendingApprovals(leave) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-[#f58327] text-[#f58327] hover:bg-[#f58327] hover:text-white"
                            onClick={() => handleSendEmail(leave._id)}
                            disabled={sendingEmail === leave._id}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            {sendingEmail === leave._id ? 'Sending...' : 'Send Email'}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-destructive hover:text-white hover:border-destructive"
                          onClick={() => onAction(leave._id, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 text-white hover:bg-green-700" 
                          onClick={() => onAction(leave._id, 'approve')}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Type & Duration */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Type</p>
                          <Badge variant="outline" className="text-sm">{leave.type}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Duration</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary">{days}</span>
                            <span className="text-sm text-muted-foreground">day{days !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Dates</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">From:</span>
                            <span className="font-medium">
                              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">To:</span>
                            <span className="font-medium">
                              {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Recipients */}
                      {leave.additionalRecipients && leave.additionalRecipients.length > 0 ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Additional Recipients</p>
                          <div className="space-y-2">
                            {leave.additionalRecipients.map((recipient, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate" title={recipient.name}>
                                    {recipient.name}
                                  </p>
                                  {recipient.emailSent && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate" title={recipient.email}>
                                      <Mail className="w-3 h-3" />
                                      {recipient.email}
                                    </p>
                                  )}
                                </div>
                                <Badge 
                                  variant={
                                    recipient.status === 'Approved' ? 'default' : 
                                    recipient.status === 'Rejected' ? 'destructive' : 
                                    'secondary'
                                  }
                                  className="text-xs shrink-0"
                                >
                                  {recipient.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Additional Recipients</p>
                          <p className="text-xs text-muted-foreground">None</p>
                        </div>
                      )}
                    </div>

                    {/* Leave Stats - New Row */}
                    <div className="mt-4">
                      {/* Leave Stats */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground">📊 Employee Leave Balance</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => toggleStats(leave._id)}
                          >
                            {expandedStats[leave._id] ? (
                              <><ChevronUp className="w-3 h-3 mr-1" /> Show Less</>
                            ) : (
                              <><ChevronDown className="w-3 h-3 mr-1" /> Show More</>
                            )}
                          </Button>
                        </div>
                        
                        {expandedStats[leave._id] && (
                          <>
                        {/* Annual Leave Stats */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800">
                          <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">🌴 Annual Leave</p>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Limit</p>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.leaveLimit || 10}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Used</p>
                              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.thisYear || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Available</p>
                              <p className={`text-sm font-bold ${
                                (stats.remainingLeaves !== undefined ? stats.remainingLeaves : 10) <= 2 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {stats.remainingLeaves !== undefined ? stats.remainingLeaves : 10}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">This Month</p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.thisMonth || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Last Month</p>
                              <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{stats.lastMonth || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Sick Leave Stats */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border border-red-200 dark:border-red-800">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">🤒 Sick Leave</p>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Limit</p>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.sickLeaveLimit || 3}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Used</p>
                              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.sickThisYear || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Available</p>
                              <p className={`text-sm font-bold ${
                                (stats.remainingSickLeaves !== undefined ? stats.remainingSickLeaves : 3) <= 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {stats.remainingSickLeaves !== undefined ? stats.remainingSickLeaves : 3}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">This Month</p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.sickThisMonth || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Last Month</p>
                              <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{stats.sickLastMonth || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Maternity Leave Stats */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border border-pink-200 dark:border-pink-800">
                          <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 mb-2">🤰 Maternity Leave</p>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Limit</p>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.maternityLeaveLimit || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Used</p>
                              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.maternityThisYear || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Available</p>
                              <p className={`text-sm font-bold ${
                                (stats.remainingMaternityLeaves !== undefined ? stats.remainingMaternityLeaves : 0) <= 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {stats.remainingMaternityLeaves !== undefined ? stats.remainingMaternityLeaves : 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">This Month</p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.maternityThisMonth || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Last Month</p>
                              <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{stats.maternityLastMonth || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Paternity Leave Stats */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">👨‍👦 Paternity Leave</p>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Limit</p>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.paternityLeaveLimit || 2}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Used</p>
                              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.paternityThisYear || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Available</p>
                              <p className={`text-sm font-bold ${
                                (stats.remainingPaternityLeaves !== undefined ? stats.remainingPaternityLeaves : 2) <= 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {stats.remainingPaternityLeaves !== undefined ? stats.remainingPaternityLeaves : 2}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">This Month</p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.paternityThisMonth || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1">Last Month</p>
                              <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{stats.paternityLastMonth || 0}</p>
                            </div>
                          </div>
                        </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Reason - New Row */}
                    {leave.reason && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">Reason for Leave</p>
                        <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-lg">{leave.reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Past Leave Requests Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Past Leave Requests ({pastLeaves?.length || 0})</h3>
              <p className="text-sm text-muted-foreground mt-1">All processed employee leave requests (Approved/Rejected)</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === 'All' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('All')}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'Approved' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('Approved')}
              >
                Approved
              </Button>
              <Button 
                variant={statusFilter === 'Rejected' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('Rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {(!pastLeaves || pastLeaves.length === 0) ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">No past leave requests</p>
              <p className="text-sm mt-2">Processed leave requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastLeaves
                .filter(leave => statusFilter === 'All' || leave.status === statusFilter)
                .map(leave => {
                  const startDate = new Date(leave.startDate);
                  const endDate = new Date(leave.endDate);
                  const days = calculateBusinessDays(leave.startDate, leave.endDate);
                  const processedDate = leave.updatedAt ? new Date(leave.updatedAt) : null;
                  
                  return (
                    <div key={leave._id} className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-card">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                              {leave.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base">{leave.user?.name}</h4>
                                <Badge variant={leave.status === 'Approved' ? 'default' : 'destructive'}>
                                  {leave.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{leave.user?.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Type & Duration */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Type</p>
                            <Badge variant="outline" className="text-sm">{leave.type}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Duration</p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">{days}</span>
                              <span className="text-sm text-muted-foreground">day{days !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Dates</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">From:</span>
                              <span className="font-medium">
                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">To:</span>
                              <span className="font-medium">
                                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Recipients */}
                        {leave.additionalRecipients && leave.additionalRecipients.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Additional Recipients</p>
                            <div className="space-y-2">
                              {leave.additionalRecipients.map((recipient, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate" title={recipient.name}>
                                      {recipient.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate" title={recipient.email}>
                                      {recipient.email}
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={
                                      recipient.status === 'Approved' ? 'default' : 
                                      recipient.status === 'Rejected' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className="text-xs shrink-0"
                                  >
                                    {recipient.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Processing Info */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Processing Info</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Processed:</span>
                              <span className="font-medium">
                                {processedDate ? processedDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {leave.reason && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Reason</p>
                          <p className="text-sm">{leave.reason}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

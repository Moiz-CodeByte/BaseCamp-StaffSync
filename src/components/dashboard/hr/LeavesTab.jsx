"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import HRLeaveRequestForm from './HRLeaveRequestForm';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function LeavesTab({ leaves, allRecentLeaves, onAction, me }) {
  const [myLeaves, setMyLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);

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
        const { data } = await api.get('/api/leaves/my');
        if (!cancelled) {
          setMyLeaves(data.leaves || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load my leaves:', error);
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
      toast.success('Approval emails sent to reporting managers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSendingEmail(null);
    }
  };

  const hasPendingApprovals = (leave) => {
    return leave.managerApprovals && leave.managerApprovals.some(a => a.status === 'Pending');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leave Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage employee leave requests and submit your own
        </p>
      </div>

      {/* My Leave Requests Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">My Leave Requests</h3>
            <p className="text-xs text-muted-foreground mt-1">Your personal leave requests</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            size="sm"
          >
            {showForm ? 'Cancel' : 'Request Leave'}
          </Button>
        </div>
        
        <div className="p-4">
          {showForm && (
            <div className="mb-6">
              <HRLeaveRequestForm 
                me={me} 
                onSuccess={handleFormSuccess}
              />
            </div>
          )}

          {myLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No leave requests yet</p>
              <p className="text-sm mt-2">Click &ldquo;Request Leave&rdquo; to submit a new request</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Duration</th>
                    <th className="text-left p-3 font-semibold">Dates</th>
                    <th className="text-left p-3 font-semibold">Reason</th>
                    <th className="text-left p-3 font-semibold">Manager Approvals</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.map(leave => {
                    const startDate = new Date(leave.startDate);
                    const endDate = new Date(leave.endDate);
                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <tr key={leave._id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Badge variant="outline">{leave.type}</Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div className="text-xs">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs">to</div>
                          <div className="text-xs">
                            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {leave.reason || '-'}
                        </td>
                        <td className="p-3">
                          {leave.managerApprovals && leave.managerApprovals.length > 0 ? (
                            <div className="space-y-1 text-xs">
                              {leave.managerApprovals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="font-medium truncate max-w-[100px]" title={approval.managerName}>
                                    {approval.managerName}
                                  </span>
                                  <Badge 
                                    variant={
                                      approval.status === 'Approved' ? 'default' : 
                                      approval.status === 'Rejected' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {approval.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={
                              leave.status === 'Approved' ? 'default' : 
                              leave.status === 'Rejected' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {leave.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Employee Leave Requests Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Employee Leave Requests ({leaves.length})</h3>
          <p className="text-xs text-muted-foreground mt-1">Pending requests from your team</p>
        </div>
        
        <div className="p-4">
          {leaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pending leave requests</p>
              <p className="text-sm mt-2">All leave requests have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Duration</th>
                    <th className="text-left p-3 font-semibold">Dates</th>
                    <th className="text-left p-3 font-semibold">Leave Stats</th>
                    <th className="text-left p-3 font-semibold">Manager Approvals</th>
                    <th className="text-left p-3 font-semibold">Reason</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(leave => {
                    const startDate = new Date(leave.startDate);
                    const endDate = new Date(leave.endDate);
                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    const stats = leave.leaveStats || {};
                    
                    return (
                      <tr key={leave._id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{leave.user?.name}</div>
                          <div className="text-xs text-muted-foreground">{leave.user?.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{leave.type}</Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div className="text-xs">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs">to</div>
                          <div className="text-xs">
                            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Limit:</span>
                              <span className="font-medium">{stats.leaveLimit || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Remaining:</span>
                              <span className={`font-medium ${stats.remaining <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                                {stats.remaining !== undefined ? stats.remaining : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Yearly:</span>
                              <span className="font-medium">{stats.yearlyTaken !== undefined ? stats.yearlyTaken : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">This Month:</span>
                              <span className="font-medium">{stats.currentMonth !== undefined ? stats.currentMonth : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Last Month:</span>
                              <span className="font-medium">{stats.previousMonth !== undefined ? stats.previousMonth : 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {leave.managerApprovals && leave.managerApprovals.length > 0 ? (
                            <div className="space-y-1 text-xs">
                              {leave.managerApprovals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="font-medium truncate max-w-[120px]" title={approval.managerName}>
                                    {approval.managerName}
                                  </span>
                                  <Badge 
                                    variant={
                                      approval.status === 'Approved' ? 'default' : 
                                      approval.status === 'Rejected' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {approval.status}
                                  </Badge>
                                  {approval.emailSent && (
                                    <span className="text-muted-foreground" title="Email sent">
                                      ✉
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No managers assigned</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {leave.reason || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recently Submitted Leaves Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Recently Submitted Leave Requests</h3>
          <p className="text-xs text-muted-foreground mt-1">Last 15 leave requests from all employees (all statuses)</p>
        </div>
        
        <div className="p-4">
          {!allRecentLeaves || allRecentLeaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No recent leave requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Duration</th>
                    <th className="text-left p-3 font-semibold">Dates</th>
                    <th className="text-left p-3 font-semibold">Reason</th>
                    <th className="text-left p-3 font-semibold">Manager Approvals</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecentLeaves.map(leave => {
                    const startDate = new Date(leave.startDate);
                    const endDate = new Date(leave.endDate);
                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    const submittedDate = new Date(leave.createdAt);
                    
                    return (
                      <tr key={leave._id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{leave.user?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {leave.user?.department || 'N/A'} • {leave.user?.role || 'Employee'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{leave.type}</Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div className="text-xs">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs">to</div>
                          <div className="text-xs">
                            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {leave.reason || '-'}
                        </td>
                        <td className="p-3">
                          {leave.managerApprovals && leave.managerApprovals.length > 0 ? (
                            <div className="space-y-1 text-xs">
                              {leave.managerApprovals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="font-medium truncate max-w-[100px]" title={approval.managerName}>
                                    {approval.managerName}
                                  </span>
                                  <Badge 
                                    variant={
                                      approval.status === 'Approved' ? 'default' : 
                                      approval.status === 'Rejected' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {approval.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={
                              leave.status === 'Approved' ? 'default' : 
                              leave.status === 'Rejected' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {submittedDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

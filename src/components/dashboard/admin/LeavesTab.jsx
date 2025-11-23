"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function AdminLeavesTab({ leaves, pastLeaves, onAction }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [sendingEmail, setSendingEmail] = useState(null);

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
      {/* <div>
        <h2 className="text-2xl font-bold">Leave Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage all leave requests (Employee + HR)
        </p>
      </div> */}

      {/* Leave Requests Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Leave Requests ({leaves.length})</h3>
          <p className="text-xs text-muted-foreground mt-1">Pending requests from all staff members</p>
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
                    <th className="text-left p-3 font-semibold">Role</th>
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
                          <Badge variant={
                            leave.user?.role === 'Admin' ? 'destructive' :
                            leave.user?.role === 'HR' ? 'default' :
                            'secondary'
                          }>
                            {leave.user?.role}
                          </Badge>
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

      {/* Past Leave Requests Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Past Leave Requests ({pastLeaves?.length || 0})</h3>
              <p className="text-xs text-muted-foreground mt-1">All processed leave requests (Approved/Rejected)</p>
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
        
        <div className="p-4">
          {(!pastLeaves || pastLeaves.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No past leave requests</p>
              <p className="text-sm mt-2">Processed leave requests will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Duration</th>
                    <th className="text-left p-3 font-semibold">Dates</th>
                    <th className="text-left p-3 font-semibold">Manager Approvals</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Reason</th>
                    <th className="text-left p-3 font-semibold">Processed</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pastLeaves
                    .filter(leave => statusFilter === 'All' || leave.status === statusFilter)
                    .map(leave => {
                      const startDate = new Date(leave.startDate);
                      const endDate = new Date(leave.endDate);
                      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                      const processedDate = leave.updatedAt ? new Date(leave.updatedAt) : null;
                      
                      return (
                        <tr key={leave._id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="font-medium">{leave.user?.name}</div>
                            <div className="text-xs text-muted-foreground">{leave.user?.email}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant={
                              leave.user?.role === 'Admin' ? 'destructive' :
                              leave.user?.role === 'HR' ? 'default' :
                              'secondary'
                            }>
                              {leave.user?.role}
                            </Badge>
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
                            <Badge variant={leave.status === 'Approved' ? 'default' : 'destructive'}>
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs truncate">
                            {leave.reason || '-'}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {processedDate ? processedDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            }) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-2 justify-end">
                              {/* {leave.status === 'Approved' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onAction(leave._id, 'reject')}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  Revoke
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => onAction(leave._id, 'approve')}
                                  className="bg-green-600 text-white hover:bg-green-700"
                                >
                                  Re-approve
                                </Button>
                              )} */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onAction(leave._id, leave.status === 'Approved' ? 'reject' : 'approve')}
                              >
                                {leave.status === 'Approved' ? 'Mark Rejected' : 'Mark Approved'}
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
    </div>
  );
}

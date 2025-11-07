"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LeavesTab({ leaves, onAction }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leave Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage employee leave requests
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Pending Leave Requests ({leaves.length})</h3>
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
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {leave.reason || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
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
    </div>
  );
}

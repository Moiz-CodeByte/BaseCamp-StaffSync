import { Trash2, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

export default function LeavesTab({ leaveForm, setLeaveForm, requestLeave, leaves, deleteLeaveRequest, me }) {
  const [showForm, setShowForm] = useState(false);

  // Calculate approved leave days
  const approvedLeaveDays = useMemo(() => {
    return leaves
      .filter(l => l.status === 'Approved')
      .reduce((total, leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
      }, 0);
  }, [leaves]);

  // Calculate duration when dates are selected
  const duration = useMemo(() => {
    if (leaveForm.startDate && leaveForm.endDate) {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  }, [leaveForm.startDate, leaveForm.endDate]);

  // Calculate remaining leave balance
  const remainingLeaves = useMemo(() => {
    return (me?.leave_limit || 0) - approvedLeaveDays;
  }, [me?.leave_limit, approvedLeaveDays]);

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (leaveForm.startDate) {
      const start = new Date(leaveForm.startDate);
      
      // Check if start date is before today
      if (start < today) {
        errors.push('Start date cannot be in the past');
      }
    }
    
    if (leaveForm.startDate && leaveForm.endDate) {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      
      // Check if end date is less than start date
      if (end < start) {
        errors.push('End date cannot be earlier than start date');
      }
    }
    
    // Check if duration exceeds leave limit
    if (duration > 0 && me?.leave_limit) {
      if (duration > me.leave_limit) {
        errors.push(`Duration (${duration} days) exceeds your leave limit (${me.leave_limit} days)`);
      }
      
      // Check if approved leaves + new request exceeds leave limit
      if (approvedLeaveDays + duration > me.leave_limit) {
        errors.push(`Total leave days would exceed your limit. You have ${remainingLeaves} days remaining`);
      }
    }
    
    return errors;
  }, [leaveForm.startDate, leaveForm.endDate, duration, me, approvedLeaveDays, remainingLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submission
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    await requestLeave(e);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit and manage your leave requests
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="default"
        >
          {showForm ? 'Cancel' : 'Request Leave'}
        </Button>
      </div>
      
      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Request New Leave
            </CardTitle>
            <CardDescription>Fill in the details below to submit a leave request</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-base font-semibold">Leave Type *</Label>
                  <Select value={leaveForm.type} onValueChange={(val) => setLeaveForm({...leaveForm, type: val})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual">Annual Leave</SelectItem>
                      <SelectItem value="Sick">Sick Leave</SelectItem>
                      <SelectItem value="Casual">Casual Leave</SelectItem>
                      <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Leave Limit</Label>
                  <div className="h-11 px-3 py-2 rounded-md border bg-muted flex items-center">
                    <span className="text-sm font-medium">
                      {me?.leave_limit ? `${me.leave_limit} days per year` : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Remaining Balance</Label>
                  <div className={`h-11 px-3 py-2 rounded-md border flex items-center ${
                    remainingLeaves < 0 ? 'bg-destructive/10 border-destructive/50' : 
                    remainingLeaves === 0 ? 'bg-orange-50 border-orange-200' : 
                    'bg-green-50 border-green-200'
                  }`}>
                    <span className={`text-sm font-medium ${
                      remainingLeaves < 0 ? 'text-destructive' : 
                      remainingLeaves === 0 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {remainingLeaves} day{remainingLeaves !== 1 ? 's' : ''} available
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-base font-semibold">Start Date *</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={leaveForm.startDate} 
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                    className="h-11"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-base font-semibold">End Date *</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={leaveForm.endDate} 
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} 
                    className="h-11"
                    required 
                  />
                </div>

                {duration > 0 && (
                  <div className="md:col-span-2">
                    <div className={`p-4 rounded-lg border ${
                      validationErrors.length > 0 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : 'bg-primary/10 border-primary/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${
                          validationErrors.length > 0 ? 'text-destructive' : 'text-primary'
                        }`} />
                        <span className={`font-semibold ${
                          validationErrors.length > 0 ? 'text-destructive' : 'text-primary'
                        }`}>Duration:</span>
                        <span className={`text-lg font-bold ${
                          validationErrors.length > 0 ? 'text-destructive' : 'text-primary'
                        }`}>
                          {duration} day{duration !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-destructive mb-2">Cannot Submit Leave Request:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index} className="text-sm text-destructive">{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reason" className="text-base font-semibold">Reason</Label>
                  <Textarea 
                    id="reason" 
                    value={leaveForm.reason} 
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} 
                    placeholder="Please provide a reason for your leave request..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '' });
                  }}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={validationErrors.length > 0}
                >
                  Submit Leave Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 to-sky-100 dark:from-cyan-950 dark:to-sky-950 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-200 dark:bg-cyan-800 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-cyan-700 dark:text-cyan-200" />
            </div>
            <div>
              <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 text-lg">My Leave Requests</h3>
              <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1">View and manage all your leave requests ({leaves.length})</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {leaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-cyan-600" />
              </div>
              <p className="font-medium">No leave requests yet</p>
              <p className="text-sm mt-2">Click &ldquo;Request Leave&rdquo; to submit your first request</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {leaves.map((leave) => {
                const startDate = new Date(leave.startDate);
                const endDate = new Date(leave.endDate);
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <div 
                    key={leave._id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white font-semibold">
                          {me?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ME'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-medium">
                              {leave.type}
                            </Badge>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {days} day{days !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Badge variant={
                            leave.status === 'Approved' ? 'default' :
                            leave.status === 'Rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {leave.status}
                          </Badge>
                        </div>
                      </div>

                      {leave.status === 'Pending' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => deleteLeaveRequest(leave._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dates</p>
                        <div className="text-sm">
                          <div className="font-medium">
                            From: {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="font-medium">
                            To: {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {leave.reason && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reason</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {leave.reason}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Manager Approvals</p>
                        {leave.managerApprovals && leave.managerApprovals.length > 0 ? (
                          <div className="space-y-2">
                            {leave.managerApprovals.map((approval, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                              >
                                <span className="text-sm font-medium">{approval.managerName}</span>
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
                          <p className="text-sm text-muted-foreground">No managers assigned</p>
                        )}
                      </div>
                    </div>
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

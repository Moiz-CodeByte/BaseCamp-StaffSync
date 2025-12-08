import { Trash2, Calendar as CalendarIcon, Clock, AlertCircle, UserPlus, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

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
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
};

export default function LeavesTab({ leaveForm, setLeaveForm, requestLeave, leaves, deleteLeaveRequest, me }) {
  const [showForm, setShowForm] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '' });

  // Calculate earned leaves based on current month (dynamic based on leave_limit)
  const earnedLeaves = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (Jan-Dec)
    const currentYear = now.getFullYear();
    
    const leaveLimit = me?.leave_limit || 12; // Use leave_limit from user model
    const monthlyAccrual = leaveLimit / 12; // Leaves earned per month
    const maxPerHalf = leaveLimit / 2; // Maximum leaves per half-year
    
    // Determine which half of the year we're in
    // First half: Jan-Jun (months 0-5)
    // Second half: Jul-Dec (months 6-11)
    const isSecondHalf = currentMonth >= 6;
    
    if (isSecondHalf) {
      // Second half: July to December
      // Calculate months elapsed in second half (July=1, Aug=2, ..., Dec=6)
      const monthsInHalf = (currentMonth - 6) + 1;
      return Math.min(Math.floor(monthsInHalf * monthlyAccrual), maxPerHalf);
    } else {
      // First half: January to June
      // Calculate months elapsed in first half (Jan=1, Feb=2, ..., Jun=6)
      const monthsInHalf = currentMonth + 1;
      return Math.min(Math.floor(monthsInHalf * monthlyAccrual), maxPerHalf);
    }
  }, [me?.leave_limit]);

  // Calculate approved leave days for current half only
  const approvedLeaveDaysCurrentHalf = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const isSecondHalf = currentMonth >= 6;
    
    // Define date range for current half
    let halfStartDate, halfEndDate;
    if (isSecondHalf) {
      // July 1 to Dec 31
      halfStartDate = new Date(currentYear, 6, 1);
      halfEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
    } else {
      // Jan 1 to June 30
      halfStartDate = new Date(currentYear, 0, 1);
      halfEndDate = new Date(currentYear, 5, 30, 23, 59, 59);
    }
    
    return leaves
      .filter(l => {
        if (l.status !== 'Approved') return false;
        const leaveStart = new Date(l.startDate);
        // Only count leaves that started in current half
        return leaveStart >= halfStartDate && leaveStart <= halfEndDate;
      })
      .reduce((total, leave) => {
        const days = calculateBusinessDays(leave.startDate, leave.endDate);
        return total + days;
      }, 0);
  }, [leaves]);

  // Calculate duration when dates are selected (business days only, excluding weekends)
  const duration = useMemo(() => {
    if (!leaveForm.startDate || !leaveForm.endDate) return 0;
    return calculateBusinessDays(leaveForm.startDate, leaveForm.endDate);
  }, [leaveForm.startDate, leaveForm.endDate]);

  // Calculate available leave balance (earned - used in current half)
  const remainingLeaves = useMemo(() => {
    return earnedLeaves - approvedLeaveDaysCurrentHalf;
  }, [earnedLeaves, approvedLeaveDaysCurrentHalf]);

  // Check for pending leaves
  const hasPendingLeaves = useMemo(() => {
    return leaves.some(leave => leave.status === 'Pending');
  }, [leaves]);

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for pending leaves
    if (hasPendingLeaves) {
      errors.push('You already have a pending leave request. Please wait for approval before submitting another.');
    }
    
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
    
    // Check if duration exceeds earned leaves for current half
    if (duration > 0) {
      const maxPerHalf = Math.floor((me?.leave_limit || 12) / 2);
      
      // Check if duration exceeds max per half
      if (duration > maxPerHalf) {
        errors.push(`⚠️ Duration (${duration} days) exceeds maximum ${maxPerHalf} days per half-year`);
      }
      
      // Check if approved leaves + new request exceeds earned leaves
      if (approvedLeaveDaysCurrentHalf + duration > earnedLeaves) {
        errors.push(`⚠️ ALERT: Total leave days (${approvedLeaveDaysCurrentHalf + duration}) would exceed your earned leaves (${earnedLeaves}). You have only ${remainingLeaves} days available.`);
      }
    }
    
    return errors;
  }, [leaveForm.startDate, leaveForm.endDate, duration, earnedLeaves, approvedLeaveDaysCurrentHalf, remainingLeaves, hasPendingLeaves, me?.leave_limit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submission
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    await requestLeave(e);
    setShowForm(false);
    setNewRecipient({ name: '', email: '' });
  };

  const addRecipient = () => {
    if (!newRecipient.name.trim() || !newRecipient.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newRecipient.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    const additionalRecipients = leaveForm.additionalRecipients || [];
    if (additionalRecipients.some(r => r.email === newRecipient.email)) {
      toast.error('This email is already added');
      return;
    }
    
    setLeaveForm({
      ...leaveForm,
      additionalRecipients: [...additionalRecipients, { ...newRecipient }]
    });
    setNewRecipient({ name: '', email: '' });
    toast.success('Recipient added');
  };

  const removeRecipient = (index) => {
    const additionalRecipients = leaveForm.additionalRecipients || [];
    setLeaveForm({
      ...leaveForm,
      additionalRecipients: additionalRecipients.filter((_, i) => i !== index)
    });
    toast.success('Recipient removed');
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
                  <Label className="text-base font-semibold">Earned This Period</Label>
                  <div className="h-11 px-3 py-2 rounded-md border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {earnedLeaves} day{earnedLeaves !== 1 ? 's' : ''} earned
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      ({((me?.leave_limit || 12) / 12).toFixed(1)} per month)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Used This Period</Label>
                  <div className="h-11 px-3 py-2 rounded-md border bg-muted flex items-center">
                    <span className="text-sm font-medium">
                      {approvedLeaveDaysCurrentHalf} day{approvedLeaveDaysCurrentHalf !== 1 ? 's' : ''} used
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-base font-semibold">Available Balance</Label>
                  <div className={`h-11 px-3 py-2 rounded-md border flex items-center justify-between ${
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
                    <span className="text-xs text-muted-foreground">
                      {new Date().getMonth() >= 6 ? 'Jul-Dec period' : 'Jan-Jun period'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 You earn {((me?.leave_limit || 12) / 12).toFixed(1)} leave{((me?.leave_limit || 12) / 12) !== 1 ? 's' : ''} per month. Maximum {Math.floor((me?.leave_limit || 12) / 2)} leaves per half-year. Unused leaves from previous period are not carried forward.
                  </p>
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

                <div className="space-y-3 md:col-span-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Additional Email Recipients (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add people who should receive email notifications about this leave request
                  </p>
                  
                  {/* List of added recipients */}
                  {leaveForm.additionalRecipients && leaveForm.additionalRecipients.length > 0 && (
                    <div className="space-y-2">
                      {leaveForm.additionalRecipients.map((recipient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-3 rounded-lg bg-muted"
                        >
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{recipient.name}</p>
                            <p className="text-xs text-muted-foreground">{recipient.email}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRecipient(index)}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add recipient form */}
                  <div className="grid gap-2 md:grid-cols-2 p-3 border rounded-lg bg-muted/30">
                    <Input
                      placeholder="Recipient name"
                      value={newRecipient.name}
                      onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                    />
                    <Input
                      type="email"
                      placeholder="Recipient email"
                      value={newRecipient.email}
                      onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                    />
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRecipient}
                        className="w-full"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Recipient
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '', additionalRecipients: [] });
                    setNewRecipient({ name: '', email: '' });
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
                const days = calculateBusinessDays(leave.startDate, leave.endDate);
                
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

                      {leave.additionalRecipients && leave.additionalRecipients.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Recipients</p>
                          <div className="space-y-2">
                            {leave.additionalRecipients.map((recipient, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                              >
                                <span className="text-sm font-medium">{recipient.name}</span>
                                <Badge 
                                  variant={
                                    recipient.status === 'Approved' ? 'default' :
                                    recipient.status === 'Rejected' ? 'destructive' :
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {recipient.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

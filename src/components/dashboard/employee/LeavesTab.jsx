import { Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';

export default function LeavesTab({ leaveForm, setLeaveForm, requestLeave, leaves, deleteLeaveRequest, me }) {
  const [showForm, setShowForm] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-primary">Duration:</span>
                        <span className="text-lg font-bold text-primary">
                          {duration} day{duration !== 1 ? 's' : ''}
                        </span>
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
                <Button type="submit" className="flex-1">
                  Submit Leave Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests ({leaves.length})</CardTitle>
          <CardDescription>View and manage all your leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No leave requests yet</p>
              <p className="text-sm mt-2">Click &ldquo;Request Leave&rdquo; to submit your first request</p>
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
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
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
                          <Badge variant={
                            leave.status === 'Approved' ? 'default' :
                            leave.status === 'Rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

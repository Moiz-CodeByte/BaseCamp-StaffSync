import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from './StatusBadge';

export default function LeavesTab({ leaveForm, setLeaveForm, requestLeave, leaves, deleteLeaveRequest }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leave Requests</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Request New Leave</CardTitle>
          <CardDescription>Submit a new leave request</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={requestLeave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <Select value={leaveForm.type} onValueChange={(val) => setLeaveForm({...leaveForm, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Sick">Sick</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Reason for leave request" />
              </div>
            </div>
            <Button type="submit" className="w-full">Submit Leave Request</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaves.map((leave) => (
              <div key={leave._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{leave.type} Leave</h3>
                      <StatusBadge status={leave.status} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    {leave.reason && <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>}
                  </div>
                  {leave.status === 'Pending' && (
                    <Button variant="destructive" size="sm" onClick={() => deleteLeaveRequest(leave._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {leaves.length === 0 && <p className="text-center text-gray-500 py-8">No leave requests found</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

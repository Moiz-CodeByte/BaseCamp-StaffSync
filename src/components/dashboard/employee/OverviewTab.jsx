import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from './StatCard';
import StatusBadge from './StatusBadge';

export default function OverviewTab({ dateFilter, setDateFilter, stats, attendance }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">View your attendance and leave statistics</p>
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="60">Last 60 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Days" value={stats.totalDays} description="Days recorded" />
        <StatCard title="Present Days" value={stats.presentDays} description="Days present" valueColor="text-green-600" />
        <StatCard title="Absent Days" value={stats.absentDays} description="Days absent" valueColor="text-red-600" />
        <StatCard title="Half Days" value={stats.halfDays} description="Half-day attendance" valueColor="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pending Leaves" value={stats.pendingLeaves} description="Awaiting approval" valueColor="text-yellow-600" />
        <StatCard title="Leave Days Taken" value={stats.totalLeaveDays} description="Days on approved leave" valueColor="text-blue-600" />
        <StatCard title="Rejected Leaves" value={stats.rejectedLeaves} description="Requests denied" valueColor="text-red-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance.slice(0, 5).map((att, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{new Date(att.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">
                    {att.checkInAt && `In: ${new Date(att.checkInAt).toLocaleTimeString()}`}
                    {att.checkOutAt && ` | Out: ${new Date(att.checkOutAt).toLocaleTimeString()}`}
                  </p>
                </div>
                <StatusBadge status={att.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ProfileTab({ me, profileForm, setProfileForm, updateProfile }) {
  if (!me) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={profileForm.currentPassword} onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})} placeholder="Required to change password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={profileForm.password} onChange={(e) => setProfileForm({...profileForm, password: e.target.value})} placeholder="Leave blank to keep current" />
              </div>
            </div>
            <Button type="submit" className="w-full">Update Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>Your department and HR information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-500">Department</Label>
            <p className="text-lg font-medium mt-1">{me.department?.name || 'Not assigned'}</p>
            <p className="text-xs text-gray-500 mt-1">Contact HR to update</p>
          </div>
          <div>
            <Label className="text-gray-500">Designation</Label>
            <p className="text-lg font-medium mt-1">{me.designation || 'Not assigned'}</p>
            <p className="text-xs text-gray-500 mt-1">Contact HR to update</p>
          </div>
          <div>
            <Label className="text-gray-500">Reporting Managers</Label>
            {me.reportingManagers && me.reportingManagers.length > 0 ? (
              <div className="mt-2 space-y-3">
                {me.reportingManagers.map((manager, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-lg font-medium">{manager.name}</p>
                    <p className="text-sm text-gray-500">{manager.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg font-medium mt-1">Not assigned</p>
            )}
          </div>
          <div>
            <Label className="text-gray-500">Assigned HR</Label>
            {me.assignedHR ? (
              <div className="mt-1">
                <p className="text-lg font-medium">{me.assignedHR.name}</p>
                <p className="text-sm text-gray-500">{me.assignedHR.email}</p>
              </div>
            ) : (
              <p className="text-lg font-medium mt-1">Not assigned</p>
            )}
          </div>
          {/* <div>
            <Label className="text-gray-500">Role</Label>
            <p className="text-lg font-medium mt-1">{me.role}</p>
          </div> */}
          <div>
            <Label className="text-gray-500">Leave Limit</Label>
            <p className="text-lg font-medium mt-1">{me.leave_limit || 10} days per year</p>
          </div>
          {me.previousLeavesAvailed > 0 && (
            <div>
              <Label className="text-gray-500">Previous Leaves Used (Pre-System)</Label>
              <p className="text-lg font-medium mt-1">{me.previousLeavesAvailed} days</p>
              <p className="text-xs text-gray-500 mt-1">Historical data before system migration</p>
            </div>
          )}
           <div>
            <Label className="text-gray-500">Account Created</Label>
            <p className="text-lg font-medium mt-1">
              {new Date(me.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

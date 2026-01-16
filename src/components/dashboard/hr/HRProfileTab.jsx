"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function HRProfileTab({ me, profileForm, setProfileForm, updateProfile }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  if (!me) return null;

  return (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </div> */}
      
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
                <Input 
                  id="name" 
                  value={profileForm.name} 
                  disabled 
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Contact Admin to update</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileForm.email} 
                  disabled 
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Contact Admin to update</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="currentPassword" 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={profileForm.currentPassword} 
                    onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})} 
                    placeholder="Required to change password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={profileForm.password} 
                    onChange={(e) => setProfileForm({...profileForm, password: e.target.value})} 
                    placeholder="Leave blank to keep current" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full">Update Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Your role and department information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-500">Role</Label>
            <p className="text-lg font-medium mt-1">{me.role}</p>
          </div>
          <div>
            <Label className="text-gray-500">Department</Label>
            <p className="text-lg font-medium mt-1">{me.department?.name || 'Not assigned'}</p>
            <p className="text-xs text-gray-500 mt-1">Contact Admin to update</p>
          </div>
          <div>
            <Label className="text-gray-500">Designation</Label>
            <p className="text-lg font-medium mt-1">{me.designation || 'Not assigned'}</p>
            <p className="text-xs text-gray-500 mt-1">Contact Admin to update</p>
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
            <Label className="text-gray-500">Leave Limit</Label>
            <p className="text-lg font-medium mt-1">{me.leave_limit || 10} days per year</p>
          </div>
          {/* <div>
            <Label className="text-gray-500">Leave Entitlement Date</Label>
            <p className="text-lg font-medium mt-1">
              {me.leaveEntitlementDate 
                ? new Date(me.leaveEntitlementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'January 1'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Date when your leave entitlement started</p>
          </div> */}
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

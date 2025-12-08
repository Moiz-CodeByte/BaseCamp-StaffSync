"use client";

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { FileText, User, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import EmployeeSidebar from '@/components/dashboard/employee/EmployeeSidebar';
import EmployeeHeader from '@/components/dashboard/employee/EmployeeHeader';
import OverviewTab from '@/components/dashboard/employee/OverviewTab';
import LeavesTab from '@/components/dashboard/employee/LeavesTab';
import ProfileTab from '@/components/dashboard/employee/ProfileTab';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [me, setMe] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '', additionalRecipients: [] });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', password: '' });
  const [stats, setStats] = useState({ totalLeaveDays: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0 });

  const fetchData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    try {
      const [{ data: meData }, { data: leaveData }] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/leaves/my'),
      ]);
      
      if (meData?.user) {
        setMe(meData.user);
        setProfileForm({
          name: meData.user.name || '',
          email: meData.user.email || '',
          currentPassword: '',
          password: ''
        });
      }
      
      const leaveList = Array.isArray(leaveData?.leaves) ? leaveData.leaves : [];
      setLeaves(leaveList);
      
      // Calculate total leave days (approved leaves)
      const totalLeaveDays = leaveList
        .filter(l => l.status === 'Approved')
        .reduce((total, leave) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0);
      
      setStats({
        totalLeaveDays,
        pendingLeaves: leaveList.filter(l => l.status === 'Pending').length,
        approvedLeaves: leaveList.filter(l => l.status === 'Approved').length,
        rejectedLeaves: leaveList.filter(l => l.status === 'Rejected').length,
      });
      setIsLoadingStats(false);
    } catch (e) {
      console.error('Employee dashboard data fetch error:', e);
      if (retryCount < maxRetries) {
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        toast.error('Failed to load dashboard data. Please refresh the page.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Defer fetchData so state updates do not run synchronously inside the effect
    Promise.resolve().then(() => {
      if (!cancelled) fetchData();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const requestLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/leaves/request', leaveForm);
      setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '', additionalRecipients: [] });
      await fetchData();
      toast.success('Leave request submitted successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const deleteLeaveRequest = async (id) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api.delete(`/api/leaves/${id}`);
      await fetchData();
      toast.success('Leave request deleted successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/api/users/me', profileForm);
      setProfileForm(prev => ({ ...prev, currentPassword: '', password: '' }));
      await fetchData();
      toast.success('Profile updated successfully!');
    } catch (e) { 
      toast.error(e?.response?.data?.message || e.message); 
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'leaves', label: 'Leave Requests', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black/50">
      <EmployeeSidebar 
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        me={me}
        menuItems={menuItems}
      />

      <main className="flex-1 overflow-y-auto">
        <EmployeeHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          menuItems={menuItems}
        />

        <div className="p-8 [@media(max-width:396px)]:p-0">
          {activeTab === 'overview' && (
            <OverviewTab 
              stats={stats}
              leaves={leaves}
              isLoading={isLoadingStats}
            />
          )}

          {activeTab === 'leaves' && (
            <LeavesTab 
              leaveForm={leaveForm}
              setLeaveForm={setLeaveForm}
              requestLeave={requestLeave}
              leaves={leaves}
              deleteLeaveRequest={deleteLeaveRequest}
              me={me}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              me={me}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              updateProfile={updateProfile}
            />
          )}
        </div>
      </main>
    </div>
  );
}

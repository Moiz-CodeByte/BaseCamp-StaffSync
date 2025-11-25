"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import HRSidebar from '@/components/dashboard/hr/HRSidebar';
import HRHeader from '@/components/dashboard/hr/HRHeader';
import OverviewTab from '@/components/dashboard/hr/OverviewTab';
import LeavesTab from '@/components/dashboard/hr/LeavesTab';
import UsersTab from '@/components/dashboard/hr/UsersTab';
import HRProfileTab from '@/components/dashboard/hr/HRProfileTab';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pending, setPending] = useState([]);
  const [recentlyApproved, setRecentlyApproved] = useState([]);
  const [allRecentLeaves, setAllRecentLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ 
    pendingLeaves: 0,
    totalEmployees: 0,
    leavesThisMonth: 0,
    approvedToday: 0
  });
  const [me, setMe] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', password: '' });

  useEffect(() => {
    let ignore = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchData = async () => {
      try {
        const [{ data: leaves }, { data: recentData }, { data: allRecentData }, { data: usersData }, { data: departmentsData }, { data: meData }] = await Promise.all([
          api.get('/api/leaves/manage'),
          api.get('/api/leaves/recent'),
          api.get('/api/leaves/all-recent'),
          api.get('/api/users/list'),
          api.get('/api/departments'),
          api.get('/api/users/me'),
        ]);
        if (!ignore) {
          const pendingList = Array.isArray(leaves?.leaves) ? leaves.leaves : [];
          const recentList = Array.isArray(recentData?.leaves) ? recentData.leaves : [];
          const allRecentList = Array.isArray(allRecentData?.leaves) ? allRecentData.leaves : [];
          const usersList = Array.isArray(usersData?.users) ? usersData.users : [];
          const deptList = Array.isArray(departmentsData?.departments) ? departmentsData.departments : [];
          const userData = meData?.user;
          
          setPending(pendingList);
          setRecentlyApproved(recentList);
          setAllRecentLeaves(allRecentList);
          setUsers(usersList);
          setDepartments(deptList);
          setMe(userData);
          setProfileForm({ name: userData.name, email: userData.email, currentPassword: '', password: '' });
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const today = new Date().setHours(0, 0, 0, 0);
          
          setStats({
            pendingLeaves: pendingList.length,
            totalEmployees: 0,
            leavesThisMonth: allRecentList.filter(l => {
              const date = new Date(l.createdAt);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).length,
            approvedToday: recentList.filter(l => {
              const date = new Date(l.updatedAt);
              return date.setHours(0, 0, 0, 0) === today;
            }).length,
          });
        }
      } catch (error) {
        if (!ignore) {
          console.error('HR dashboard data fetch error:', error);
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(() => {
              if (!ignore) fetchData();
            }, 1000 * retryCount);
          } else {
            setPending([]); 
            setRecentlyApproved([]); 
            setAllRecentLeaves([]); 
            setUsers([]); 
            setDepartments([]);
            toast.error('Failed to load dashboard data. Please refresh the page.');
          }
        }
      }
    };
    
    fetchData();
    return () => { ignore = true; };
  }, []);

  const handleLeaveAction = async (leaveId, action) => {
    await api.post('/api/leaves/manage', { leaveId, action });
    // Reload leaves
    try {
      const { data } = await api.get('/api/leaves/manage');
      const pendingList = data.leaves || [];
      setPending(pendingList);
      setStats(prev => ({ ...prev, pendingLeaves: pendingList.length }));
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users/list');
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/me', profileForm);
      toast.success('Profile updated successfully');
      const { data } = await api.get('/api/users/me');
      setMe(data.user);
      setProfileForm({ ...profileForm, currentPassword: '', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <HRSidebar sidebarOpen={sidebarOpen} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <HRHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto [@media(max-width:396px)]:p-0">
            {activeTab === 'overview' && <OverviewTab stats={stats} recentlyApproved={recentlyApproved} />}
            {activeTab === 'users' && <UsersTab users={users} departments={departments} onUpdate={loadUsers} />}
            {activeTab === 'leaves' && <LeavesTab 
              leaves={pending}
              allRecentLeaves={allRecentLeaves}
              onAction={handleLeaveAction} 
              me={me}
            />}
            {activeTab === 'profile' && (
              <HRProfileTab 
                me={me} 
                profileForm={profileForm} 
                setProfileForm={setProfileForm} 
                updateProfile={updateProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

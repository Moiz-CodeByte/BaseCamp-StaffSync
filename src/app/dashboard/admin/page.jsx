"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import AdminSidebar from '@/components/dashboard/admin/AdminSidebar';
import AdminHeader from '@/components/dashboard/admin/AdminHeader';
import OverviewTab from '@/components/dashboard/admin/OverviewTab';
import UsersTab from '@/components/dashboard/admin/UsersTab';
import DepartmentsTab from '@/components/dashboard/admin/DepartmentsTab';
import LeavesTab from '@/components/dashboard/admin/LeavesTab';
import FeedbackTab from '@/components/dashboard/admin/FeedbackTab';
import ProfileTab from '@/components/dashboard/admin/ProfileTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pastLeaves, setPastLeaves] = useState([]);
  const [me, setMe] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', password: '' });
  const [stats, setStats] = useState({
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    totalRequests: 0,
    approvedThisMonth: 0,
  });

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users/list');
      const userList = data.users || [];
      setUsers(userList);
      setStats(prev => ({
        ...prev,
        totalUsers: userList.length,
        admins: userList.filter(u => u.role === 'Admin').length,
        hrStaff: userList.filter(u => u.role === 'HR').length,
        employees: userList.filter(u => u.role === 'Employee').length,
      }));
    } catch {
      setUsers([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const { data } = await api.get('/api/departments');
      setDepartments(data.departments || []);
    } catch {
      setDepartments([]);
    }
  };

  const loadLeaves = async () => {
    try {
      const [{ data: pendingData }, { data: pastData }] = await Promise.all([
        api.get('/api/leaves/manage'),
        api.get('/api/leaves/manage?status=past'),
      ]);
      const leavesList = pendingData.leaves || [];
      const pastLeavesList = pastData.leaves || [];
      setLeaves(leavesList);
      setPastLeaves(pastLeavesList);
      setStats(prev => ({ ...prev, pendingLeaves: leavesList.length }));
    } catch {
      setLeaves([]);
      setPastLeaves([]);
    }
  };

  useEffect(() => {
    let ignore = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchData = async () => {
      try {
        const [
          { data: usersData }, 
          { data: departmentsData },
          { data: leavesData }, 
          { data: pastLeavesData }, 
          { data: meData }
        ] = await Promise.all([
          api.get('/api/users/list'),
          api.get('/api/departments'),
          api.get('/api/leaves/manage'),
          api.get('/api/leaves/manage?status=past'),
          api.get('/api/users/me')
        ]);

        if (!ignore) {
          const userList = Array.isArray(usersData?.users) ? usersData.users : [];
          const deptList = Array.isArray(departmentsData?.departments) ? departmentsData.departments : [];
          const leavesList = Array.isArray(leavesData?.leaves) ? leavesData.leaves : [];
          const pastLeavesList = Array.isArray(pastLeavesData?.leaves) ? pastLeavesData.leaves : [];
          const userData = meData?.user;

          // Filter HR users for department assignment
          const hrList = userList.filter(u => u.role === 'HR');

          setUsers(userList);
          setDepartments(deptList);
          setHrUsers(hrList);
          setLeaves(leavesList);
          setPastLeaves(pastLeavesList);
          setMe(userData);
          setProfileForm({ name: userData.name, email: userData.email, currentPassword: '', password: '' });

          const allLeaves = [...leavesList, ...pastLeavesList];
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          setStats({
            totalUsers: userList.length,
            admins: userList.filter(u => u.role === 'Admin').length,
            hrStaff: userList.filter(u => u.role === 'HR').length,
            employees: userList.filter(u => u.role === 'Employee').length,
            pendingLeaves: leavesList.length,
            approvedLeaves: pastLeavesList.filter(l => l.status === 'Approved').length,
            rejectedLeaves: pastLeavesList.filter(l => l.status === 'Rejected').length,
            totalRequests: allLeaves.length,
            approvedThisMonth: allLeaves.filter(l => {
              const date = new Date(l.createdAt);
              return l.status === 'Approved' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).length,
          });
          setIsLoadingStats(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Admin dashboard data fetch error:', error);
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(() => {
              if (!ignore) fetchData();
            }, 1000 * retryCount);
          } else {
            setUsers([]);
            setLeaves([]);
            setPastLeaves([]);
            toast.error('Failed to load dashboard data. Please refresh the page.');
          }
        }
      }
    };
    
    fetchData();
    return () => { ignore = true; };
  }, []);

  const handleLeaveAction = async (leaveId, action) => {
    try {
      await api.put(`/api/leaves/${leaveId}`, { status: action === 'approve' ? 'Approved' : 'Rejected' });
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update leave');
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
      <AdminSidebar sidebarOpen={sidebarOpen} activeTab={activeTab} onTabChange={setActiveTab} me={me} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewTab stats={stats} isLoading={isLoadingStats} />}
            {activeTab === 'users' && <UsersTab users={users} departments={departments} onUpdate={loadUsers} />}
            {activeTab === 'departments' && <DepartmentsTab departments={departments} hrUsers={hrUsers} onUpdate={loadDepartments} />}
            {activeTab === 'leaves' && <LeavesTab leaves={leaves} pastLeaves={pastLeaves} onAction={handleLeaveAction} />}
            {activeTab === 'feedback' && <FeedbackTab />}
            {activeTab === 'profile' && (
              <ProfileTab 
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

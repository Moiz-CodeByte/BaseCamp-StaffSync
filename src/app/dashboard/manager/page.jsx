"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ManagerSidebar from '@/components/dashboard/manager/ManagerSidebar';
import ManagerHeader from '@/components/dashboard/manager/ManagerHeader';
import OverviewTab from '@/components/dashboard/admin/OverviewTab';
import UsersTab from '@/components/dashboard/admin/UsersTab';
import DepartmentsTab from '@/components/dashboard/admin/DepartmentsTab';
import LeavesTab from '@/components/dashboard/admin/LeavesTab';
import ProfileTab from '@/components/dashboard/admin/ProfileTab';

export default function ManagerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
        // Use combined endpoint for better performance
        const { data } = await api.get('/api/dashboard/manager');

        if (!ignore) {
          const userList = Array.isArray(data?.users) ? data.users : [];
          const deptList = Array.isArray(data?.departments) ? data.departments : [];
          const hrList = Array.isArray(data?.hrUsers) ? data.hrUsers : [];
          const pendingList = Array.isArray(data?.pending) ? data.pending : [];
          const recentList = Array.isArray(data?.recentlyApproved) ? data.recentlyApproved : [];
          const allRecentList = Array.isArray(data?.allRecentLeaves) ? data.allRecentLeaves : [];
          const userData = data?.me;

          setUsers(userList);
          setDepartments(deptList);
          setHrUsers(hrList);
          setLeaves(pendingList);
          
          // Combine all non-pending leaves for pastLeaves (approved + rejected)
          const allNonPendingLeaves = [...recentList, ...allRecentList];
          // Remove duplicates based on leave _id
          const uniquePastLeaves = Array.from(
            new Map(allNonPendingLeaves.map(leave => [leave._id, leave])).values()
          );
          setPastLeaves(uniquePastLeaves);
          
          setMe(userData);
          setProfileForm({ name: userData?.name || '', email: userData?.email || '', currentPassword: '', password: '' });

          // Combine all leaves properly for stats
          const allLeaves = [...pendingList, ...recentList, ...allRecentList];
          
          // Remove duplicates (in case a leave appears in multiple lists)
          const uniqueLeaves = Array.from(
            new Map(allLeaves.map(leave => [leave._id, leave])).values()
          );
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          setStats({
            totalUsers: userList.length,
            employees: userList.filter(u => u.role === 'Employee').length,
            totalDepartments: deptList.length,
            pendingLeaves: uniqueLeaves.filter(l => l.status === 'Pending').length,
            approvedLeaves: uniqueLeaves.filter(l => l.status === 'Approved').length,
            rejectedLeaves: uniqueLeaves.filter(l => l.status === 'Rejected').length,
            totalRequests: uniqueLeaves.length,
            approvedThisMonth: uniqueLeaves.filter(l => {
              const date = new Date(l.createdAt);
              return l.status === 'Approved' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).length,
          });
          setIsLoadingStats(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Manager dashboard data fetch error:', error);
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'Reporting Manager') {
        if (user.role === 'Admin') router.push('/dashboard/admin');
        else if (user.role === 'HR') router.push('/dashboard/hr');
        else if (user.role === 'Employee') router.push('/dashboard/employee');
        else router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Loading Manager Dashboard</h2>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ManagerSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        me={me}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader 
          user={user}
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewTab 
                stats={stats}
                users={users}
                departments={departments}
                leaves={leaves}
                pastLeaves={pastLeaves}
                isLoadingStats={isLoadingStats}
                isManager={true}
              />
            )}
            {activeTab === 'leaves' && (
              <LeavesTab 
                leaves={leaves}
                pastLeaves={pastLeaves}
                onAction={handleLeaveAction}
                isManager={true}
              />
            )}
            {activeTab === 'departments' && (
              <DepartmentsTab 
                departments={departments}
                hrUsers={hrUsers}
                onUpdate={loadDepartments}
                isAdmin={false}
                isManager={true}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab 
                me={me}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                onUpdate={() => {
                  api.get('/api/users/me').then(({ data }) => {
                    setMe(data.user);
                    setProfileForm({ 
                      name: data.user?.name || '', 
                      email: data.user?.email || '', 
                      currentPassword: '', 
                      password: '' 
                    });
                  });
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

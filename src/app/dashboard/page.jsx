"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function go() {
      try {
        const { data } = await api.get('/api/users/me');
        const role = data?.user?.role;
        if (!mounted) return;
        if (role === 'Admin') router.replace('/dashboard/admin');
        else if (role === 'HR') router.replace('/dashboard/hr');
        else if (role === 'Employee') router.replace('/dashboard/employee');
        else router.replace('/login');
      } catch {
        if (mounted) router.replace('/login');
      }
    }
    go();
    return () => { mounted = false };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Loading Dashboard</h2>
          <p className="text-sm text-muted-foreground">Please wait while we load your data...</p>
        </div>
      </div>
    </div>
  );
}

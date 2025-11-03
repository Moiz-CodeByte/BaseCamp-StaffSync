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

  return <p className="p-6 text-sm text-muted-foreground">Loading dashboard…</p>;
}

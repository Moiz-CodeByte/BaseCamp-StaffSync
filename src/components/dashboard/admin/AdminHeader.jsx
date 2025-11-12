"use client";

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminHeader({ sidebarOpen, setSidebarOpen, activeTab }) {
  const tabLabels = {
    overview: 'Overview',
    users: 'User Management',
    leaves: 'Leave Management',
    attendance: 'Attendance Management',
    calendar: 'Calendar & Events',
    payroll: 'Payroll Management',
    profile: 'Profile Settings',
  };

  return (
    <header className="bg-card border-b p-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{tabLabels[activeTab]}</h1>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </header>
  );
}

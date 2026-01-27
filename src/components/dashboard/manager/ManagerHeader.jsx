"use client";

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ManagerHeader({ sidebarOpen, setSidebarOpen, activeTab }) {
  const tabLabels = {
    overview: 'Overview',
    departments: 'Department Management',
    leaves: 'Leave Management',
    profile: 'Profile Settings',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="text-gray-700 dark:text-gray-300"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        {tabLabels[activeTab] || 'Dashboard'}
      </h1>
    </div>
  );
}

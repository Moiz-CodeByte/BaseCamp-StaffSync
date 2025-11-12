"use client";

import { LayoutDashboard, Users, UserCheck, Calendar, FileText, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar({ sidebarOpen, activeTab, onTabChange }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'leaves', label: 'Leave Management', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    // { id: 'payroll', label: 'Payroll', icon: UserCheck },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside
      className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-0 md:w-20"
      )}
    >
      <div className="p-6 border-b">
        <h2 className={cn(
          "font-bold text-xl transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 md:opacity-0"
        )}>
          Admin Panel
        </h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                !sidebarOpen && "md:justify-center"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "transition-opacity duration-300",
                sidebarOpen ? "opacity-100" : "opacity-0 md:opacity-0 md:hidden"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

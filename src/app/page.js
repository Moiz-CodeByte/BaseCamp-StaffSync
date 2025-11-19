import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">BaseCamp StaffSync</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          A streamlined Leave Management System designed for BaseCamp. Manage employee leave requests, approvals, and profiles—all in one place.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-primary text-primary-foreground">Get Started</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold text-center">Core Features</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Leave Management</h3>
            <p className="text-sm text-muted-foreground">Submit, track, and approve leave requests with multi-level approval workflows. Real-time leave balance tracking and statistics for all employees.</p>
          </div>
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Profile Management</h3>
            <p className="text-sm text-muted-foreground">Manage your personal profile, update information, and change passwords securely. Each user has complete control over their account settings.</p>
          </div>
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Approval Workflow</h3>
            <p className="text-sm text-muted-foreground">Streamlined approval process for HR and Admin roles. Review, approve, or reject leave requests with detailed history tracking.</p>
          </div>
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Leave Statistics</h3>
            <p className="text-sm text-muted-foreground">Comprehensive reports and analytics on leave patterns, balances, and usage. Make informed decisions with real-time data insights.</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold text-center">Why Choose BaseCamp StaffSync?</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Built specifically for BaseCamp with features that matter most to your organization
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">Optimized performance for instant access to all features</p>
          </div>
          <div className="rounded-lg border p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">Enterprise-grade security with JWT authentication</p>
          </div>
          <div className="rounded-lg border p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold">Mobile Friendly</h3>
            <p className="text-sm text-muted-foreground">Responsive design works perfectly on any device</p>
          </div>
          <div className="rounded-lg border p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold">Smart Automation</h3>
            <p className="text-sm text-muted-foreground">Auto-marking and intelligent workflows save time</p>
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section className="rounded-xl border bg-card p-8 space-y-6">
        <h2 className="text-3xl font-semibold text-center">Role-Based Dashboards</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Three specialized dashboards tailored to your role—focused on leave management and profile control.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border">
            <h3 className="text-lg font-semibold mb-2">Admin</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Manage all leave requests</li>
              <li>• Approve/reject leaves</li>
              <li>• View leave history</li>
              <li>• Profile management</li>
            </ul>
          </div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border">
            <h3 className="text-lg font-semibold mb-2">HR</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Approve/reject leaves</li>
              <li>• View recent approvals</li>
              <li>• Leave statistics</li>
              <li>• Profile management</li>
            </ul>
          </div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border">
            <h3 className="text-lg font-semibold mb-2">Employee</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Request leaves</li>
              <li>• Track leave status</li>
              <li>• View leave history</li>
              <li>• Update personal profile</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="rounded-xl border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-12">
        <h2 className="text-3xl font-semibold text-center mb-8">Streamline Your Leave Management</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold text-primary">Simple</div>
            <div className="text-sm text-muted-foreground">Leave Requests</div>
            <p className="text-xs text-muted-foreground">Easy-to-use interface for submitting leaves</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold text-primary">Fast</div>
            <div className="text-sm text-muted-foreground">Leave Approvals</div>
            <p className="text-xs text-muted-foreground">Instant notifications and status updates</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">System Access</div>
            <p className="text-xs text-muted-foreground">Request leaves from anywhere, anytime</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-xl border bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 p-12 text-center">
        <h2 className="text-3xl font-semibold">Ready to Get Started?</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Join BaseCamp StaffSync today and simplify your leave management with our streamlined system.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button size="lg" className="bg-primary text-primary-foreground">
              Sign In Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">BaseCamp StaffSync</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          A comprehensive Human Resource Management System designed for BaseCamp. Streamline attendance, leave management, payroll, and corporate events—all in one place.
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
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Attendance Tracking</h3>
            <p className="text-sm text-muted-foreground">Real-time check-in and check-out system with comprehensive attendance history for all employees.</p>
          </div>
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Leave Management</h3>
            <p className="text-sm text-muted-foreground">Submit, track, and approve leave requests with multi-level approval workflows.</p>
          </div>
          <div className="rounded-lg border p-6 space-y-3 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Payroll Automation</h3>
            <p className="text-sm text-muted-foreground">Automated salary calculations, payslip generation, and secure payroll management.</p>
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section className="rounded-xl border bg-card p-8 space-y-6">
        <h2 className="text-3xl font-semibold text-center">Role-Based Dashboards</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Three specialized dashboards tailored to your role—ensuring everyone has the tools they need.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border">
            <h3 className="text-lg font-semibold mb-2">Admin</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Manage all users</li>
              <li>• Generate payroll</li>
              <li>• System-wide reports</li>
              <li>• Full access control</li>
            </ul>
          </div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border">
            <h3 className="text-lg font-semibold mb-2">HR</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Approve/reject leaves</li>
              <li>• Manage attendance</li>
              <li>• Corporate calendar</li>
              <li>• Employee database</li>
            </ul>
          </div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border">
            <h3 className="text-lg font-semibold mb-2">Employee</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Check-in/check-out</li>
              <li>• Request leaves</li>
              <li>• View payslips</li>
              <li>• Personal profile</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold text-center">Built with Modern Technology</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4 text-center">
            <h3 className="font-semibold">Next.js 16</h3>
            <p className="text-xs text-muted-foreground mt-1">Server & client components</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <h3 className="font-semibold">MongoDB</h3>
            <p className="text-xs text-muted-foreground mt-1">Scalable database</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <h3 className="font-semibold">JWT Auth</h3>
            <p className="text-xs text-muted-foreground mt-1">Secure authentication</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <h3 className="font-semibold">Tailwind CSS</h3>
            <p className="text-xs text-muted-foreground mt-1">Beautiful UI</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-xl border bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 p-12 text-center">
        <h2 className="text-3xl font-semibold">Ready to Get Started?</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Join BaseCamp StaffSync today and transform your HR operations with our comprehensive management system.
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

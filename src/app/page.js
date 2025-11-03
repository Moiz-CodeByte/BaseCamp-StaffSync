import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-8">
        <h1 className="text-3xl font-bold tracking-tight">QMCC StaffSync</h1>
        <p className="mt-2 text-muted-foreground max-w-prose">
          A modern HRMS for QMCC built with Next.js, MongoDB, and a clean component library.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login">
            <Button className="bg-primary text-primary-foreground">Login</Button>
          </Link>
          <Link href="/test">
            <Button variant="outline">Test API</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Attendance</h3>
          <p className="text-sm text-muted-foreground">Track daily attendance and shifts.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Leave</h3>
          <p className="text-sm text-muted-foreground">Manage leave applications and approvals.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Payroll</h3>
          <p className="text-sm text-muted-foreground">Automate payroll with role-based controls.</p>
        </div>
      </section>
    </div>
  );
}

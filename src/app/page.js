"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/api/users/me");
        if (mounted) setUser(data.user || null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMe();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = () => {
    try {
      localStorage.removeItem("token");
    } catch (_) {}
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-8">
        <h1 className="text-3xl font-bold tracking-tight">QMCC StaffSync</h1>
        <p className="mt-2 text-muted-foreground max-w-prose">
          A modern HRMS for QMCC built with Next.js, MongoDB, and a clean component library.
        </p>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking your session…</p>
          ) : user ? (
            <div className="space-y-3">
              <p className="text-sm">Welcome back, <span className="font-medium">{user.name}</span>.</p>
              <div className="rounded-md border p-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
                  <div><span className="text-muted-foreground">Role:</span> {user.role}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={signOut} variant="outline">Sign out</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground">Login</Button>
              </Link>
            </div>
          )}
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

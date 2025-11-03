"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get("/api/users/me");
        if (!ignore) setUser(data.user || null);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const signOut = () => {
    try {
      localStorage.removeItem("token");
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (_) {}
  };

  return (
    <header className="w-full border-b bg-white/70 dark:bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30">
      <nav className="mx-auto max-w-5xl flex items-center justify-between py-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block size-2.5 rounded-full bg-primary" />
          <span>QMCC StaffSync</span>
        </Link>
        <div className="flex items-center gap-3">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="text-sm hover:underline">Dashboard</Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Logout</Button>
            </>
          )}
          {!loading && !user && (
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

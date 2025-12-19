"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const signOut = () => {
    try {
      logout();
      router.push("/");
      router.refresh();
    } catch (_) {}
  };

  return (
    <header className="w-full border-b bg-white/70 dark:bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30">
      <nav className="mx-auto max-w-7xl flex items-center justify-between py-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block size-2.5 rounded-full bg-primary" />
          <span>BaseCamp StaffSync</span>
        </Link>
        <div className="flex items-center gap-3">
          {!loading && user && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/feedback">
                <Button variant="ghost" size="sm">Feedback</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Logout</Button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/feedback">
                <Button variant="ghost" size="sm">Feedback</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

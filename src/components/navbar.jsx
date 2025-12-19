"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <span className="text-sm sm:text-base">BaseCamp StaffSync</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && user && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/feedback">
                <Button variant="ghost" size="sm">Feedback</Button>
              </Link>
              <Link href="/help">
                <Button variant="ghost" size="sm">Help</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Logout</Button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/feedback">
                <Button variant="ghost" size="sm">Feedback</Button>
              </Link>
              <Link href="/help">
                <Button variant="ghost" size="sm">Help</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="flex flex-col space-y-2 p-4">
            {!loading && user && (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Dashboard</Button>
                </Link>
                <Link href="/feedback" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Feedback</Button>
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Help</Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  Logout
                </Button>
              </>
            )}
            {!loading && !user && (
              <>
                <Link href="/feedback" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Feedback</Button>
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Help</Button>
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Login</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

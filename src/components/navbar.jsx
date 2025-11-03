"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white/70 dark:bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30">
      <nav className="mx-auto max-w-5xl flex items-center justify-between py-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block size-2.5 rounded-full bg-primary" />
          <span>QMCC StaffSync</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/test" className="text-sm hover:underline">Test API</Link>
          <Link href="/login" className="text-sm hover:underline">Login</Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 min-h-screen">
      <h2 className="text-xl font-semibold text-teal-400 mb-8">
        Risk Intelligence
      </h2>

      <nav className="space-y-4 text-sm">
        <Link href="/dashboard" className="block hover:text-teal-400">
          Dashboard
        </Link>
        <Link href="#" className="block hover:text-teal-400">
          New Application
        </Link>
        <Link href="#" className="block hover:text-teal-400">
          Portfolio Analytics
        </Link>
        <Link href="#" className="block hover:text-teal-400">
          Fairness Monitor
        </Link>
      </nav>
    </aside>
  );
}
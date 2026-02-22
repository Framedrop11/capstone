"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "#", label: "New Application" },
  { href: "#", label: "Portfolio Analytics" },
  { href: "#", label: "Fairness Monitor" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-semibold text-teal-400">
          Risk Intelligence
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Credit Scoring Platform
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/5"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 hover:shadow-sm hover:shadow-teal-400/5 border border-transparent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

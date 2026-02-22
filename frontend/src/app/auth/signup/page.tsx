"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

const STORAGE_KEY = "credit_risk_user";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"borrower" | "analyst" | "admin">("borrower");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const user = { name, email, role };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="bg-slate-900/80 backdrop-blur-lg p-10 rounded-xl border border-slate-800 w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-semibold text-center text-teal-400 mb-6">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all duration-200"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "borrower" | "analyst" | "admin")
              }
              className="w-full px-4 py-2.5 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all duration-200"
            >
              <option value="borrower">Borrower</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 py-3 rounded-xl font-medium text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/20"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-teal-400 hover:text-teal-300 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

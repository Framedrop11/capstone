"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

const STORAGE_KEY = "credit_risk_user";

interface StoredUser {
  name: string;
  email: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setError("No account found. Please sign up first.");
      return;
    }

    let user: StoredUser;
    try {
      user = JSON.parse(stored);
    } catch {
      setError("Invalid session. Please sign up again.");
      return;
    }

    if (user.email.toLowerCase() !== email.toLowerCase()) {
      setError("No account found with this email.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="bg-slate-900/80 backdrop-blur-lg p-10 rounded-xl border border-slate-800 w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-semibold text-center text-teal-400 mb-6">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

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

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 py-3 rounded-xl font-medium text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/20"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

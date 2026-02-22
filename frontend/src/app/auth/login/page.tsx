export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="bg-slate-900/70 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-96 border border-slate-800">
        <h1 className="text-2xl font-semibold text-center text-teal-400 mb-6">
          AI Credit Risk Intelligence
        </h1>

        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <button className="w-full bg-teal-500 hover:bg-teal-600 transition duration-200 py-2 rounded-lg font-medium">
            Login
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-slate-400">
          Don’t have an account?{" "}
          <a href="/auth/signup" className="text-teal-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="bg-slate-900/70 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-96 border border-slate-800">
        <h1 className="text-2xl font-semibold text-center text-teal-400 mb-6">
          Create Account
        </h1>

        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:ring-2 focus:ring-teal-400" />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:ring-2 focus:ring-teal-400" />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:ring-2 focus:ring-teal-400" />
          </div>

          <button className="w-full bg-teal-500 hover:bg-teal-600 py-2 rounded-lg font-medium">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
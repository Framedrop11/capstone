export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-sm text-slate-400">Probability of Default</h2>
          <p className="text-2xl font-bold text-teal-400">12%</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-sm text-slate-400">Risk Grade</h2>
          <p className="text-2xl font-bold text-amber-400">B</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-sm text-slate-400">Expected Loss</h2>
          <p className="text-2xl font-bold text-red-400">₹24,000</p>
        </div>
      </div>
    </div>
  );
}
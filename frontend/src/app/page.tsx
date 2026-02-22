import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold text-teal-400 mb-6">
          AI Credit Risk Intelligence
        </h1>
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          A Responsible AI-powered credit scoring platform designed for
          transparency, explainability, and fairness-aware lending.
        </p>

        <div className="flex justify-center gap-6 mb-20">
          <Link
            href="/auth/login"
            className="bg-teal-500 hover:bg-teal-400 px-6 py-3 rounded-xl font-medium text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/20"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="border border-slate-700 hover:border-teal-400 px-6 py-3 rounded-xl font-medium transition-all duration-200 text-slate-100 hover:text-teal-400"
          >
            Sign Up
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200">
            <h3 className="text-teal-400 font-semibold mb-2">Explainable AI</h3>
            <p className="text-sm text-slate-400">
              SHAP-based feature attribution and DiCE counterfactual recourse.
            </p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200">
            <h3 className="text-teal-400 font-semibold mb-2">Fairness Monitoring</h3>
            <p className="text-sm text-slate-400">
              Demographic Parity & Equal Opportunity tracking.
            </p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200">
            <h3 className="text-teal-400 font-semibold mb-2">Risk Intelligence</h3>
            <p className="text-sm text-slate-400">
              PD prediction, Expected Loss computation & model drift detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            InsightIntellect
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-950/50 border border-indigo-800/40 px-4 py-1.5 text-xs font-semibold text-indigo-300 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          NLP-Powered Research Ecosystem
        </span>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Intelligence Platform for{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Modern Researchers
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Manage literature, design structured experiment pipelines, extract concepts, and visualize insights within a secure, collaborative environment.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={() => navigate("/register")}
            className="w-full sm:w-auto rounded-xl bg-white text-slate-950 text-base font-semibold px-8 py-4 hover:bg-slate-100 active:bg-slate-200 shadow-lg transition-all"
          >
            Start Research Free
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur text-slate-300 text-base font-semibold px-8 py-4 hover:bg-slate-900 hover:text-white transition-all"
          >
            Sign in to Workspace
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-24">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              📚
            </div>
            <h3 className="font-semibold text-white mb-2">Literature Hub</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload papers and automatically extract metadata, authors, and AI-powered summaries.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
              📋
            </div>
            <h3 className="font-semibold text-white mb-2">Workflow Kanban</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plan and track stages from Literature Review to Hypothesis and Result Analysis.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center mb-4">
              🕸
            </div>
            <h3 className="font-semibold text-white mb-2">Concept Mapping</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Construct interactive graph nodes to link papers, hypotheses, and insights.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              👥
            </div>
            <h3 className="font-semibold text-white mb-2">Role Permissions</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Collaborate securely with per-project roles: Owner, Editor, or Viewer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-600 relative z-10">
        &copy; {new Date().getFullYear()} InsightIntellect. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../../services/project.service.js';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Extract User ID from JWT Token
  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload).id;
    } catch (e) {
      return null;
    }
  };

  const loadProjects = async () => {
    try {
      const result = await getProjects();
      setProjects(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    setCurrentUserId(getUserIdFromToken());
    loadProjects();
  }, [token, navigate]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createProject({ title, description, goal });
      setTitle('');
      setDescription('');
      setGoal('');
      setShowModal(false);
      await loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    setError(null);

    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute stats
  const totalProjects = projects.length;
  const ownedProjects = projects.filter((p) => p.ownerId === currentUserId).length;
  const sharedProjects = totalProjects - ownedProjects;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 selection:bg-indigo-500 selection:text-white">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">InsightIntellect</span>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          Sign Out
        </button>
      </nav>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-6 mt-12 relative z-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Research Projects</h1>
            <p className="text-sm text-slate-400 mt-1">Manage, collaborate, and map your research ecosystem.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Stats widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Projects</p>
            <p className="text-3xl font-bold text-white mt-2">{totalProjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owned Projects</p>
            <p className="text-3xl font-bold text-indigo-400 mt-2">{ownedProjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shared With Me</p>
            <p className="text-3xl font-bold text-violet-400 mt-2">{sharedProjects}</p>
          </div>
        </div>

        {/* Search / Filter */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search project title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/20 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-800 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center text-slate-500">
            <span className="text-3xl block mb-3">📁</span>
            {search ? 'No projects match your search query.' : 'No projects found. Click "+ New Project" to get started.'}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => {
              // Identify logged-in user's role on this project
              const myCollab = project.collaborators?.find((c) => c.userId === currentUserId);
              const myRole = myCollab?.role || 'VIEWER';

              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 flex flex-col justify-between hover:border-slate-800 transition-colors shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      {/* Role Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          myRole === 'OWNER'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                            : myRole === 'EDITOR'
                            ? 'bg-violet-950 text-violet-300 border border-violet-800/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {myRole}
                      </span>
                      <span className="text-xs text-slate-600">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mt-3.5 hover:text-indigo-400 transition-colors">
                      <Link to={`/projects/${project.id}`}>{project.title}</Link>
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>

                    {project.goal && (
                      <div className="mt-4 rounded-xl bg-slate-950/40 border border-slate-900/60 p-3 text-xs text-slate-400 flex items-start gap-2.5">
                        <span className="text-indigo-400">🎯</span>
                        <span>
                          <strong className="text-slate-300 font-medium">Goal:</strong> {project.goal}
                        </span>
                      </div>
                    )}

                    {/* Collaborators tiny list */}
                    {project.collaborators && project.collaborators.length > 0 && (
                      <div className="mt-4 flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 mr-1">Collaborators:</span>
                        <div className="flex -space-x-2">
                          {project.collaborators.map((c) => {
                            const initial = c.user?.name
                              ? c.user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'U';
                            return (
                              <div
                                key={c.id}
                                title={`${c.user?.name || 'User'} (${c.role})`}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-slate-950 cursor-default ${
                                  c.role === 'OWNER'
                                    ? 'bg-indigo-600'
                                    : c.role === 'EDITOR'
                                    ? 'bg-violet-600'
                                    : 'bg-slate-700'
                                }`}
                              >
                                {initial}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between gap-4">
                    <Link
                      to={`/projects/${project.id}`}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10 transition-colors"
                    >
                      Enter Workspace
                    </Link>
                    {myRole === 'OWNER' && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="rounded-lg border border-red-950 hover:bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-900 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-6 top-6 text-slate-500 hover:text-slate-300 text-lg focus:outline-none"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Project Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="e.g. Quantum Neural Interfaces"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Provide a summary of the project scope..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Research Goal
                </label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="e.g. Achieve under 0.05% translator error rate."
                />
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-850 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

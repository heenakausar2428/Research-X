import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { getProject, updateProject, getCollaborators, addCollaborator, removeCollaborator } from '../../services/project.service.js';

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [myRole, setMyRole] = useState('VIEWER');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [updating, setUpdating] = useState(false);

  // Invite fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const token = localStorage.getItem('accessToken');

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)).id;
    } catch (e) {
      return null;
    }
  };

  const loadProjectData = async () => {
    setLoading(true);
    setError('');
    try {
      const uid = getUserIdFromToken();
      setCurrentUserId(uid);

      const pResult = await getProject(projectId);
      const proj = pResult.data;
      setProject(proj);
      setTitle(proj.title || '');
      setDescription(proj.description || '');
      setGoal(proj.goal || '');
      setStatus(proj.status || 'DRAFT');

      // Identify my role
      const self = proj.collaborators?.find((c) => c.userId === uid);
      setMyRole(self?.role || 'VIEWER');

      // Fetch collaborators list
      const cResult = await getCollaborators(projectId);
      setCollaborators(cResult.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load project workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadProjectData();
  }, [projectId, token]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (myRole === 'VIEWER') return;
    setUpdating(true);
    setError('');
    try {
      await updateProject(projectId, { title, description, goal, status });
      // Reload project details
      const pResult = await getProject(projectId);
      setProject(pResult.data);
      alert('Project details updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update project.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (myRole !== 'OWNER') return;
    setInviting(true);
    setInviteError('');
    try {
      await addCollaborator(projectId, { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteRole('VIEWER');
      // Reload collaborators
      const cResult = await getCollaborators(projectId);
      setCollaborators(cResult.data || []);
      alert('Collaborator added successfully.');
    } catch (err) {
      setInviteError(err.message || 'Failed to add collaborator.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (myRole !== 'OWNER') return;
    if (!window.confirm('Remove this collaborator from the project?')) return;
    setError('');
    try {
      await removeCollaborator(projectId, userId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    } catch (err) {
      setError(err.message || 'Failed to remove collaborator.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading project workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-900 bg-red-950/20 p-8 text-center">
          <p className="text-red-400 font-semibold mb-4">Error loading workspace</p>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <Link to="/projects" className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs text-white hover:bg-slate-850">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Determine current active sub-tab from path
  const isOverview = location.pathname === `/projects/${projectId}`;
  const activeTab = isOverview
    ? 'overview'
    : location.pathname.split('/').pop();

  const tabClass = (tab) =>
    `px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-indigo-500 text-indigo-400'
        : 'border-transparent text-slate-400 hover:text-slate-200'
    }`;

  // Progress metrics calculation
  const totalCards = project.workflow?.length || 0;
  const analysisCards = project.workflow?.filter((c) => c.stage === 'RESULT_ANALYSIS').length || 0;
  const progressPct = totalCards > 0 ? Math.round((analysisCards / totalCards) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Workspace Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 sm:px-12 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/projects" className="text-slate-500 hover:text-slate-300 text-sm">
              &larr; Projects
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900/40">
              {myRole}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1.5">{project.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              status === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                : status === 'ARCHIVED'
                ? 'bg-slate-900 text-slate-500 border border-slate-800'
                : 'bg-indigo-950 text-indigo-400 border border-indigo-900/40'
            }`}
          >
            {status}
          </span>
        </div>
      </header>

      {/* Tabs Sub-Nav */}
      <div className="relative z-10 border-b border-slate-900 bg-slate-950/40 px-6 sm:px-12 flex gap-4">
        <Link to={`/projects/${projectId}`} className={tabClass('overview')}>
          Overview
        </Link>
        <Link to={`/projects/${projectId}/literature`} className={tabClass('literature')}>
          Literature
        </Link>
        <Link to={`/projects/${projectId}/workflow`} className={tabClass('workflow')}>
          Workflow
        </Link>
        <Link to={`/projects/${projectId}/concepts`} className={tabClass('concepts')}>
          Concepts
        </Link>
        <Link to={`/projects/${projectId}/experiments`} className={tabClass('experiments')}>
          Experiments
        </Link>
        <Link to={`/projects/${projectId}/visualize`} className={tabClass('visualize')}>
          Visualize
        </Link>
      </div>

      {/* Tab Panel */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {isOverview ? (
          /* OVERVIEW TAB CONTENT */
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left Column: Form & Goal */}
            <div className="space-y-6">
              {/* Project Goals / Details Form */}
              <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Project Parameters</h2>
                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Project Title
                    </label>
                    <input
                      disabled={myRole === 'VIEWER'}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Research Goal / Objective
                    </label>
                    <textarea
                      disabled={myRole === 'VIEWER'}
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      placeholder="Define the primary objective..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Description
                    </label>
                    <textarea
                      disabled={myRole === 'VIEWER'}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      placeholder="Add detailed project description..."
                    />
                  </div>
                  {myRole !== 'VIEWER' && (
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Status:
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={updating}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </section>

              {/* Progress and Pipeline metrics */}
              <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Workflow Pipeline Metrics</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      <span>Pipeline Completion (Analysis stage cards)</span>
                      <span className="text-indigo-400">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {['LITERATURE_REVIEW', 'HYPOTHESIS_DEVELOPMENT', 'EXPERIMENT_DESIGN', 'RESULT_ANALYSIS'].map(
                      (stg) => {
                        const count = project.workflow?.filter((c) => c.stage === stg).length || 0;
                        const label = stg
                          .split('_')
                          .map((w) => w[0] + w.slice(1).toLowerCase())
                          .join(' ');
                        return (
                          <div key={stg} className="rounded-xl bg-slate-950/40 p-3 border border-slate-900/50">
                            <span className="text-xs text-slate-500 block leading-tight">{label}</span>
                            <span className="text-xl font-bold text-white block mt-1.5">{count}</span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Collaborators */}
            <div className="space-y-6">
              {/* Collaborators List */}
              <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Team Collaborators</h2>
                <div className="space-y-3.5">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-900/40"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{c.user?.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{c.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            c.role === 'OWNER'
                              ? 'bg-indigo-950 text-indigo-300'
                              : c.role === 'EDITOR'
                              ? 'bg-violet-950 text-violet-300'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {c.role}
                        </span>
                        {myRole === 'OWNER' && c.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveCollaborator(c.userId)}
                            className="text-slate-500 hover:text-red-400 text-xs font-semibold ml-1.5 focus:outline-none"
                            title="Remove collaborator"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Invite Form (OWNER only) */}
              {myRole === 'OWNER' && (
                <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Invite Collaborator</h2>
                  {inviteError && (
                    <div className="mb-3.5 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400">
                      {inviteError}
                    </div>
                  )}
                  <form onSubmit={handleAddCollaborator} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-650 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Workspace Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="EDITOR">EDITOR (Read & Write)</option>
                        <option value="VIEWER">VIEWER (Read Only)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                      {inviting ? 'Inviting...' : 'Add Collaborator'}
                    </button>
                  </form>
                </section>
              )}
            </div>
          </div>
        ) : (
          /* CHILD TABS: Literature, Kanban, Concepts */
          <Outlet context={{ project, myRole, loadProject: loadProjectData }} />
        )}
      </main>
    </div>
  );
}

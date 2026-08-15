import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as experimentService from '../../services/experiment.service.js';

const statusLabels = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const defaultExperiment = {
  title: '',
  objective: '',
  methodology: '',
  status: 'PLANNED',
};

export default function ExperimentsPage() {
  const { project, myRole, loadProject } = useOutletContext();

  const [form, setForm] = useState(defaultExperiment);
  const [selectedId, setSelectedId] = useState(null);
  const [iterationNotes, setIterationNotes] = useState('');
  const [iterationResult, setIterationResult] = useState('');
  const [iterationAttempt, setIterationAttempt] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const experiments = project?.experiments || [];
  const selectedExperiment = useMemo(
    () => experiments.find((exp) => exp.id === selectedId) || null,
    [experiments, selectedId],
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    if (myRole === 'VIEWER') return;
    if (!form.title.trim()) {
      setError('Experiment title is required.');
      return;
    }

    try {
      setSaving(true);
      await experimentService.createExperiment(project.id, form);
      setForm(defaultExperiment);
      if (loadProject) await loadProject();
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to create experiment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (experimentId) => {
    if (myRole === 'VIEWER') return;
    if (!window.confirm('Delete this experiment?')) return;

    try {
      await experimentService.deleteExperiment(project.id, experimentId);
      if (loadProject) await loadProject();
      if (selectedId === experimentId) setSelectedId(null);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to delete experiment.');
    }
  };

  const handleStatusUpdate = async (experiment, nextStatus) => {
    if (myRole === 'VIEWER') return;
    try {
      await experimentService.updateExperiment(project.id, experiment.id, { status: nextStatus });
      if (loadProject) await loadProject();
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to update experiment status.');
    }
  };

  const handleAddIteration = async (event) => {
    event.preventDefault();
    if (!selectedExperiment) return;
    if (myRole === 'VIEWER') return;
    if (!iterationAttempt) {
      setError('Iteration attempt number is required.');
      return;
    }

    try {
      setSaving(true);
      await experimentService.addExperimentIteration(project.id, selectedExperiment.id, {
        attemptNumber: iterationAttempt,
        notes: iterationNotes,
        result: iterationResult,
      });
      if (loadProject) await loadProject();
      setIterationNotes('');
      setIterationResult('');
      setIterationAttempt((prev) => prev + 1);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to add iteration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_380px]">
        <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Experiment Tracker</h2>
              <p className="text-sm text-slate-400 mt-1">Create experiments, track iterations, and monitor progress.</p>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400">
              {experiments.length} experiments
            </span>
          </div>

          <div className="space-y-4">
            {experiments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/10 p-6 text-slate-500">
                No experiments yet. Use the form to add your first experiment.
              </div>
            ) : (
              experiments.map((experiment) => (
                <div key={experiment.id} className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{experiment.title}</h3>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mt-1">
                        {statusLabels[experiment.status]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(experiment.id)}
                        className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-indigo-500"
                      >
                        Details
                      </button>
                      {myRole !== 'VIEWER' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(experiment.id)}
                          className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:bg-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {experiment.objective || 'No objective provided.'}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-200">Methodology:</span>{' '}
                      {experiment.methodology || 'Not set.'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">Iterations:</span>{' '}
                      {experiment.iterations?.length || 0}
                    </div>
                  </div>
                  {myRole !== 'VIEWER' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleStatusUpdate(experiment, key)}
                          disabled={experiment.status === key}
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            experiment.status === key
                              ? 'bg-slate-900 text-slate-500 cursor-default'
                              : 'bg-slate-950 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
            <h2 className="text-lg font-bold text-white mb-4">New Experiment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  placeholder="Experiment title"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Objective
                </label>
                <textarea
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  placeholder="What are you trying to prove or discover?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Methodology
                </label>
                <textarea
                  value={form.methodology}
                  onChange={(e) => setForm({ ...form, methodology: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  placeholder="How will the experiment be executed?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving || myRole === 'VIEWER'}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Experiment'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Selected Experiment</h2>
            {selectedExperiment ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-900">
                  <p className="text-sm font-semibold text-white">{selectedExperiment.title}</p>
                  <p className="text-xs text-slate-400 mt-2">{selectedExperiment.objective || 'No objective set.'}</p>
                  <p className="text-xs text-slate-500 mt-3">Status: {statusLabels[selectedExperiment.status]}</p>
                </div>
                {selectedExperiment.iterations?.length > 0 ? (
                  <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-900">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">Iteration History</p>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        {selectedExperiment.iterations.length} entries
                      </span>
                    </div>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950">
                      {selectedExperiment.iterations.map((iteration) => (
                        <div key={iteration.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500 mb-2">
                            <span>Attempt #{iteration.attemptNumber}</span>
                            <span>{new Date(iteration.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-semibold">Notes</p>
                          <p className="text-xs text-slate-400 mb-2 whitespace-pre-wrap">
                            {iteration.notes || 'No notes recorded.'}
                          </p>
                          <p className="text-xs text-slate-300 font-semibold">Result</p>
                          <p className="text-xs text-slate-400 whitespace-pre-wrap">
                            {iteration.result || 'No result recorded.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-900 text-xs text-slate-400">
                    No iterations recorded yet. Add one below to start tracking progress.
                  </div>
                )}
                <form onSubmit={handleAddIteration} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Attempt #
                    </label>
                    <input
                      type="number"
                      value={iterationAttempt}
                      onChange={(e) => setIterationAttempt(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={iterationNotes}
                      onChange={(e) => setIterationNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                      placeholder="Record observations, changes, or blockers."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Result
                    </label>
                    <textarea
                      value={iterationResult}
                      onChange={(e) => setIterationResult(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                      placeholder="Summarize the experiment outcome."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add Iteration'}
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select an experiment to add iteration notes.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

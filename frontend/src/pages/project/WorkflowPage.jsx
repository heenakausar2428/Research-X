import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import * as workflowService from '../../services/workflow.service.js';

const stages = ['LITERATURE_REVIEW', 'HYPOTHESIS_DEVELOPMENT', 'EXPERIMENT_DESIGN', 'RESULT_ANALYSIS'];
const stageLabels = {
  LITERATURE_REVIEW: 'Literature Review',
  HYPOTHESIS_DEVELOPMENT: 'Hypothesis Development',
  EXPERIMENT_DESIGN: 'Experiment Design',
  RESULT_ANALYSIS: 'Result Analysis',
};

const defaultCard = { title: '', description: '', stage: 'LITERATURE_REVIEW' };

export default function WorkflowPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { myRole, loadProject } = useOutletContext();

  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState(defaultCard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const loadCards = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await workflowService.getWorkflowCards(projectId);
      setCards(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load workflow cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadCards();
  }, [projectId, token]);

  const cardsByStage = useMemo(
    () => stages.reduce((acc, stage) => ({ ...acc, [stage]: cards.filter((card) => card.stage === stage) }), {}),
    [cards],
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    if (myRole === 'VIEWER') return;
    if (!newCard.title.trim()) {
      setError('Card title is required.');
      return;
    }

    try {
      setLoading(true);
      await workflowService.createWorkflowCard(projectId, newCard);
      setNewCard(defaultCard);
      await loadCards();
      if (loadProject) loadProject(); // Update progress bar in workspace header
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to create workflow card.');
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (card, nextStage) => {
    if (myRole === 'VIEWER') return;
    try {
      await workflowService.updateWorkflowCard(projectId, card.id, { stage: nextStage });
      await loadCards();
      if (loadProject) loadProject(); // Update progress bar in workspace header
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to move card.');
    }
  };

  const handleDelete = async (cardId) => {
    if (myRole === 'VIEWER') return;
    if (!window.confirm('Delete this workflow card?')) return;
    try {
      await workflowService.deleteWorkflowCard(projectId, cardId);
      setCards((current) => current.filter((card) => card.id !== cardId));
      if (loadProject) loadProject(); // Update progress bar in workspace header
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to delete card.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Errors */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        {/* Kanban Board */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
          {stages.map((stage) => (
            <div key={stage} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {stageLabels[stage]}
                </h3>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-2xs font-semibold text-slate-500">
                  {cardsByStage[stage]?.length || 0}
                </span>
              </div>
              <div className="space-y-3 min-h-[300px]">
                {cardsByStage[stage]?.length ? (
                  cardsByStage[stage].map((card) => (
                    <div
                      key={card.id}
                      className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 shadow hover:border-slate-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-sm font-bold text-slate-200 leading-snug">
                          {card.title}
                        </h4>
                        {myRole !== 'VIEWER' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(card.id)}
                            className="text-slate-600 hover:text-red-400 text-xs focus:outline-none"
                            title="Delete card"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed whitespace-pre-wrap">
                        {card.description || 'No description provided.'}
                      </p>
                      
                      {myRole !== 'VIEWER' && (
                        <div className="pt-2 border-t border-slate-900/60 flex flex-wrap gap-1">
                          {stages.map((nextStage) => (
                            <button
                              type="button"
                              key={nextStage}
                              disabled={nextStage === card.stage}
                              onClick={() => handleStageChange(card, nextStage)}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                                nextStage === card.stage
                                  ? 'bg-slate-900 text-slate-500 cursor-default'
                                  : 'bg-indigo-950 text-indigo-400 hover:bg-indigo-900 hover:text-indigo-300'
                              }`}
                            >
                              {nextStage === card.stage ? 'Current' : `Move To ${nextStage.split('_')[0]}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-2xs text-slate-600 text-center py-8 italic">No cards</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Creation Panel / Info */}
        <div className="space-y-6">
          {myRole !== 'VIEWER' ? (
            <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Add Task Card</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Card Title
                  </label>
                  <input
                    required
                    value={newCard.title}
                    onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. Draft Neural Interface Hypothesis"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCard.description}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Optional details or instructions..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newCard.stage}
                    onChange={(e) => setNewCard({ ...newCard, stage: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-350 focus:outline-none"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stageLabels[stage]}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Card'}
                </button>
              </form>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 text-center">
              <span className="text-2xl block mb-2">🔒</span>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Read-Only View
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Your role is <strong>Viewer</strong>. You do not have permissions to create cards or advance workflow stages.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

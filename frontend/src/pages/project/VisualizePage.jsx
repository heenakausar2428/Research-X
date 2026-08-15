import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as conceptService from '../../services/concept.service.js';

const stageLabels = {
  LITERATURE_REVIEW: 'Literature Review',
  HYPOTHESIS_DEVELOPMENT: 'Hypothesis Development',
  EXPERIMENT_DESIGN: 'Experiment Design',
  RESULT_ANALYSIS: 'Result Analysis',
};

const statusLabels = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export default function VisualizePage() {
  const { project } = useOutletContext();
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const workflow = project?.workflow || [];
  const experiments = project?.experiments || [];
  const insightNodes = concepts.filter((node) => node.type === 'INSIGHT');

  const workflowCounts = useMemo(() => {
    const counts = {};
    Object.keys(stageLabels).forEach((stage) => { counts[stage] = 0; });
    workflow.forEach((card) => {
      counts[card.stage] = (counts[card.stage] || 0) + 1;
    });
    return counts;
  }, [workflow]);

  const experimentStatusCounts = useMemo(() => {
    const counts = {};
    Object.keys(statusLabels).forEach((status) => { counts[status] = 0; });
    experiments.forEach((experiment) => {
      counts[experiment.status] = (counts[experiment.status] || 0) + 1;
    });
    return counts;
  }, [experiments]);

  const timelineItems = useMemo(() => {
    const items = [];
    workflow.forEach((card) => {
      if (card.updatedAt) {
        items.push({
          type: 'Workflow',
          label: card.title,
          date: new Date(card.updatedAt),
          detail: stageLabels[card.stage] || card.stage,
        });
      }
    });
    experiments.forEach((experiment) => {
      if (experiment.updatedAt) {
        items.push({
          type: 'Experiment',
          label: experiment.title,
          date: new Date(experiment.updatedAt),
          detail: statusLabels[experiment.status] || experiment.status,
        });
      }
    });
    concepts.forEach((concept) => {
      if (concept.updatedAt) {
        items.push({
          type: concept.type,
          label: concept.label,
          date: new Date(concept.updatedAt),
          detail: concept.description || '',
        });
      }
    });
    return items.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [workflow, experiments, concepts]);

  const totalCards = workflow.length;
  const totalExperiments = experiments.length;
  const totalConcepts = concepts.length;
  const totalInsights = insightNodes.length;
  const progress = totalCards ? Math.round((workflowCounts.RESULT_ANALYSIS / totalCards) * 100) : 0;

  useEffect(() => {
    const fetchConcepts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await conceptService.getConceptGraph(project.id);
        setConcepts(response.data.nodes || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to load concept data.');
      } finally {
        setLoading(false);
      }
    };

    if (project?.id) {
      fetchConcepts();
    }
  }, [project]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Visualization Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">
              A project summary with timeline, workflow stage counts, and experiment insights.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-950/80 border border-slate-900 p-4 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Workflow Cards</p>
              <p className="mt-3 text-3xl font-bold text-white">{totalCards}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border border-slate-900 p-4 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Experiments</p>
              <p className="mt-3 text-3xl font-bold text-white">{totalExperiments}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border border-slate-900 p-4 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Concepts</p>
              <p className="mt-3 text-3xl font-bold text-white">{totalConcepts}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border border-slate-900 p-4 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Insights</p>
              <p className="mt-3 text-3xl font-bold text-white">{totalInsights}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Workflow Stage Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(stageLabels).map(([stage, label]) => (
                <div key={stage} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-300">{label}</p>
                    <p className="text-xs text-slate-500">{workflowCounts[stage] || 0} cards</p>
                  </div>
                  <div className="h-3 flex-1 rounded-full bg-slate-950/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, ((workflowCounts[stage] || 0) / Math.max(1, totalCards)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Experiment Status</h3>
            <div className="space-y-3">
              {Object.entries(statusLabels).map(([status, label]) => (
                <div key={status} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-300">{label}</p>
                    <p className="text-xs text-slate-500">{experimentStatusCounts[status] || 0} experiments</p>
                  </div>
                  <div className="h-3 flex-1 rounded-full bg-slate-950/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, ((experimentStatusCounts[status] || 0) / Math.max(1, totalExperiments)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Timeline</h3>
              <p className="text-sm text-slate-400">Recent project activity across workflow, experiments, and concepts.</p>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400">
              {timelineItems.length} items
            </span>
          </div>

          <div className="space-y-4">
            {timelineItems.map((item, index) => (
              <div key={`${item.type}-${item.label}-${index}`} className="rounded-2xl border border-slate-900 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.type}</p>
                    <h4 className="text-sm font-semibold text-white mt-1">{item.label}</h4>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    {item.date.toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">{item.detail}</p>
              </div>
            ))}
            {timelineItems.length === 0 && (
              <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 text-slate-500 text-sm text-center">
                No recent activity available yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

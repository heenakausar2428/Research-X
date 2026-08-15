import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as conceptService from '../../services/concept.service.js';

const relationLabels = {
  SUPPORTS: 'Supports',
  CONTRADICTS: 'Contradicts',
  DERIVED_FROM: 'Derived from',
  LEADS_TO: 'Leads to',
};

export default function LineagePage() {
  const navigate = useNavigate();
  const { projectId, insightId } = useParams();
  const [lineage, setLineage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const nodePositions = useMemo(() => {
    if (!lineage) return {};
    const columns = 2;
    return lineage.nodes.reduce((acc, node, index) => {
      const x = (index % columns) * 260 + 160;
      const y = Math.floor(index / columns) * 180 + 110;
      acc[node.id] = { x, y };
      return acc;
    }, {});
  }, [lineage]);

  const getEdgeCoordinates = (source, target) => {
    const width = 224;
    const height = 120;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx === 0 && absDy === 0) {
      return { x1: source.x, y1: source.y, x2: target.x, y2: target.y };
    }

    if (absDx > absDy) {
      const sign = Math.sign(dx) || 1;
      const yOffset = absDx === 0 ? 0 : Math.min((height / 2) * (absDy / absDx), height / 2);
      return {
        x1: source.x + sign * width / 2,
        y1: source.y + yOffset * Math.sign(dy),
        x2: target.x - sign * width / 2,
        y2: target.y - yOffset * Math.sign(dy),
      };
    }

    const sign = Math.sign(dy) || 1;
    const xOffset = absDy === 0 ? width / 2 : Math.min((width / 2) * (absDx / absDy), width / 2);
    return {
      x1: source.x + xOffset * Math.sign(dx),
      y1: source.y + sign * height / 2,
      x2: target.x - xOffset * Math.sign(dx),
      y2: target.y - sign * height / 2,
    };
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadLineage = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await conceptService.getLineageGraph(projectId, insightId);
        setLineage(data.data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to load lineage graph.');
      } finally {
        setLoading(false);
      }
    };

    loadLineage();
  }, [projectId, insightId, token, navigate]);

  const selectedNode = lineage?.nodes.find((node) => node.id === insightId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Insight Lineage</h2>
            <p className="text-sm text-slate-400 mt-1">
              Explore the selected insight's ancestors and descendants within the project concept graph.
            </p>
          </div>
          <div className="min-w-[240px] rounded-2xl bg-slate-950/50 border border-slate-900 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Selected Insight</p>
            <p className="mt-2 text-sm font-semibold text-white">{selectedNode?.label || insightId}</p>
            <p className="mt-1 text-xs text-slate-400">{selectedNode?.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="relative mt-6 h-[620px] overflow-auto rounded-3xl border border-slate-900 bg-slate-950/60 p-4">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-slate-400">Loading lineage graph...</div>
            </div>
          ) : lineage && lineage.nodes.length > 0 ? (
            <div className="relative min-h-[560px] min-w-[700px]">
              <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ minHeight: '560px', minWidth: '700px' }}>
                <defs>
                  <marker id="lineage-arrow" markerWidth="7" markerHeight="6" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L7,3 L0,6" fill="#5b21b6" />
                  </marker>
                </defs>
                {lineage.edges.map((edge) => {
                  const source = nodePositions[edge.sourceId];
                  const target = nodePositions[edge.targetId];
                  if (!source || !target) return null;
                  const { x1, y1, x2, y2 } = getEdgeCoordinates(source, target);
                  return (
                    <g key={edge.id}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#4338ca"
                        strokeWidth="2"
                        markerEnd="url(#lineage-arrow)"
                      />
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 - 8}
                        fill="#c7d2fe"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {relationLabels[edge.relation] || edge.relation}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {lineage.nodes.map((node) => {
                const position = nodePositions[node.id] || { x: 100, y: 100 };
                const isSelected = node.id === insightId;
                return (
                  <div
                    key={node.id}
                    className={`absolute w-56 rounded-2xl border p-4 shadow-xl ${
                      isSelected ? 'border-emerald-400 bg-emerald-950/80' : 'border-slate-900 bg-slate-950/90'
                    }`}
                    style={{ left: position.x - 112, top: position.y - 50 }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900">
                        {node.type}
                      </span>
                      <span className="text-[10px] text-slate-500">{node.id === insightId ? 'ROOT' : ''}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug truncate">{node.label}</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400 line-clamp-3">
                      {node.description || 'No description.'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center text-slate-400">
              No lineage nodes found for this insight.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

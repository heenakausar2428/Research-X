import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import * as conceptService from '../../services/concept.service.js';

const types = ['CONCEPT', 'HYPOTHESIS', 'PAPER', 'EXPERIMENT', 'INSIGHT'];
const relationLabels = {
  SUPPORTS: 'Supports',
  CONTRADICTS: 'Contradicts',
  DERIVED_FROM: 'Derived from',
  LEADS_TO: 'Leads to',
};

export default function ConceptsPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { myRole } = useOutletContext();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [newNode, setNewNode] = useState({ label: '', type: 'CONCEPT', description: '' });
  const [newEdge, setNewEdge] = useState({ sourceId: '', targetId: '', relation: 'SUPPORTS' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const loadGraph = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await conceptService.getConceptGraph(projectId);
      setNodes(data.data.nodes || []);
      setEdges(data.data.edges || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load concept graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadGraph();
  }, [projectId, token]);

  const nodePositions = useMemo(() => {
    const columns = 2;
    return nodes.reduce((acc, node, index) => {
      const x = (index % columns) * 260 + 150;
      const y = Math.floor(index / columns) * 160 + 90;
      acc[node.id] = { x, y };
      return acc;
    }, {});
  }, [nodes]);

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

  const handleCreateNode = async (event) => {
    event.preventDefault();
    if (myRole === 'VIEWER') return;
    if (!newNode.label.trim()) {
      setError('Node label is required.');
      return;
    }
    try {
      setLoading(true);
      await conceptService.createConceptNode(projectId, newNode);
      setNewNode({ label: '', type: 'CONCEPT', description: '' });
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to create node.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEdge = async (event) => {
    event.preventDefault();
    if (myRole === 'VIEWER') return;
    if (!newEdge.sourceId || !newEdge.targetId) {
      setError('Source and target nodes are required.');
      return;
    }
    if (newEdge.sourceId === newEdge.targetId) {
      setError('Cannot link a node to itself.');
      return;
    }
    try {
      setLoading(true);
      await conceptService.createEdge(projectId, newEdge);
      setNewEdge({ sourceId: '', targetId: '', relation: 'SUPPORTS' });
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to create edge.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (myRole === 'VIEWER') return;
    if (!window.confirm('Delete this concept node? This will also remove any connected edges.')) return;
    try {
      await conceptService.deleteConceptNode(projectId, nodeId);
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to delete node.');
    }
  };

  const handleDeleteEdge = async (edgeId) => {
    if (myRole === 'VIEWER') return;
    if (!window.confirm('Remove this relationship?')) return;
    try {
      await conceptService.deleteEdge(projectId, edgeId);
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to delete edge.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Side: Graph Canvas & List */}
        <div className="space-y-6">
          {/* SVG Canvas Workspace */}
          <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Graph view</h2>
            <div className="relative h-[560px] overflow-auto rounded-xl border border-slate-900/80 bg-slate-950/60 p-4">
              
              {/* SVG drawing layer for relationship lines */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ minHeight: '520px', minWidth: '700px' }}>
                <defs>
                  <marker id="arrow" markerWidth="7" markerHeight="6" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L7,3 L0,6" fill="#4f46e5" />
                  </marker>
                </defs>
                {edges.map((edge) => {
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
                        stroke="#312e81"
                        strokeWidth="2"
                        markerEnd="url(#arrow)"
                      />
                      <rect
                        x={(source.x + target.x) / 2 - 40}
                        y={(source.y + target.y) / 2 - 10}
                        width="80"
                        height="20"
                        rx="4"
                        fill="#0b0f19"
                        stroke="#1e1b4b"
                        strokeWidth="1"
                      />
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 + 3}
                        fill="#818cf8"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {relationLabels[edge.relation] || edge.relation}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Absolute Positioned nodes */}
              {nodes.map((node) => {
                const position = nodePositions[node.id] || { x: 100, y: 100 };
                return (
                  <div
                    key={node.id}
                    className="absolute w-56 rounded-2xl border border-slate-900 bg-slate-900 p-4 shadow-xl hover:border-slate-800 transition-colors"
                    style={{ left: position.x - 112, top: position.y - 50 }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                          node.type === 'HYPOTHESIS'
                            ? 'bg-amber-950 text-amber-400 border border-amber-900/30'
                            : node.type === 'PAPER'
                            ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30'
                            : node.type === 'EXPERIMENT'
                            ? 'bg-violet-950 text-violet-400 border border-violet-900/30'
                            : node.type === 'INSIGHT'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {node.type}
                      </span>
                      <div className="flex items-center gap-2">
                      {node.type === 'INSIGHT' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${projectId}/lineage/${node.id}`)}
                          className="rounded-full bg-indigo-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 hover:bg-indigo-900"
                          title="View lineage"
                        >
                          View Lineage
                        </button>
                      )}
                      {myRole !== 'VIEWER' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNode(node.id)}
                          className="text-slate-650 hover:text-red-400 text-xs focus:outline-none"
                          title="Delete Node"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    </div>
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-1">{node.label}</h3>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {node.description || 'No description.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* List of Relationships */}
          <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Relationships</h2>
            {edges.length === 0 ? (
              <p className="text-xs text-slate-550 italic">No relationships created yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {edges.map((edge) => {
                  const srcNode = nodes.find((n) => n.id === edge.sourceId);
                  const tgtNode = nodes.find((n) => n.id === edge.targetId);
                  return (
                    <div
                      key={edge.id}
                      className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-350 truncate">
                          {srcNode?.label || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                          &rarr; {relationLabels[edge.relation] || edge.relation} &rarr;
                        </p>
                        <p className="text-xs font-bold text-slate-350 truncate mt-0.5">
                          {tgtNode?.label || 'Unknown'}
                        </p>
                      </div>
                      {myRole !== 'VIEWER' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEdge(edge.id)}
                          className="rounded-lg border border-red-950/40 bg-red-950/10 px-2 py-1 text-3xs font-bold uppercase text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Side Form Controls (Owners/Editors only) */}
        <div className="space-y-6">
          {myRole !== 'VIEWER' ? (
            <>
              {/* Add Node */}
              <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 shadow-lg">
                <h2 className="text-lg font-bold text-white mb-4">Add Node</h2>
                <form onSubmit={handleCreateNode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Label / Name
                    </label>
                    <input
                      required
                      value={newNode.label}
                      onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                      placeholder="e.g. Hypothesis X"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Type
                    </label>
                    <select
                      value={newNode.type}
                      onChange={(e) => setNewNode({ ...newNode, type: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newNode.description}
                      onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                      placeholder="Optional notes or context..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    Add Node
                  </button>
                </form>
              </section>

              {/* Add Edge */}
              <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 shadow-lg">
                <h2 className="text-lg font-bold text-white mb-4">Add Relationship</h2>
                <form onSubmit={handleCreateEdge} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Source Node
                    </label>
                    <select
                      value={newEdge.sourceId}
                      onChange={(e) => setNewEdge({ ...newEdge, sourceId: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Select source</option>
                      {nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.label} ({node.type.toLowerCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Target Node
                    </label>
                    <select
                      value={newEdge.targetId}
                      onChange={(e) => setNewEdge({ ...newEdge, targetId: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Select target</option>
                      {nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.label} ({node.type.toLowerCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Relation type
                    </label>
                    <select
                      value={newEdge.relation}
                      onChange={(e) => setNewEdge({ ...newEdge, relation: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      {Object.entries(relationLabels).map(([relation, label]) => (
                        <option key={relation} value={relation}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    Add Relationship
                  </button>
                </form>
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 text-center shadow-lg">
              <span className="text-2xl block mb-2">🔒</span>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Read-Only View
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Your role is <strong>Viewer</strong>. You do not have permissions to modify concept nodes or relationships.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

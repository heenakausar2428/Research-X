import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { getLiterature, uploadLiterature } from '../../services/literature.service.js';

export default function LiteraturePage() {
  const { projectId } = useParams();
  const { myRole } = useOutletContext();

  const [references, setReferences] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState(null);
  
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // AI Simulation states
  const [extracting, setExtracting] = useState(false);

  const loadReferences = async () => {
    try {
      const result = await getLiterature(projectId);
      setReferences(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (projectId) loadReferences();
  }, [projectId]);

  // Handle Mock AI Metadata Extraction when file is selected
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (!selectedFile) return;

    // Trigger AI extraction simulation
    setExtracting(true);
    setError(null);

    setTimeout(() => {
      // Parse file name to guess details
      const rawName = selectedFile.name;
      const cleanName = rawName
        .substring(0, rawName.lastIndexOf('.'))
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Fill in mock details based on file name
      setTitle(cleanName);
      
      const authorsList = ['Dr. Sarah Carter, et al.', 'A. Jenkins & K. Cole', 'Prof. Marcus Vance', 'C. Zhang, et al.'];
      setAuthors(authorsList[Math.floor(Math.random() * authorsList.length)]);
      
      setYear(String(2020 + Math.floor(Math.random() * 6))); // 2020 to 2025
      
      const tagsList = [];
      if (rawName.toLowerCase().includes('data') || rawName.toLowerCase().includes('csv')) {
        tagsList.push('dataset', 'quantitative-analysis');
      } else if (rawName.toLowerCase().includes('pdf')) {
        tagsList.push('literature-review', 'primary-source');
      } else {
        tagsList.push('research-paper', 'workspace-ref');
      }
      setTags(tagsList.join(', '));

      setSummary(
        `[AI-Generated Summary]: This document (${selectedFile.name}) was analyzed. It discusses methodology relating to "${cleanName}", outlining key objectives, theoretical boundaries, and experimental frameworks aligned with the project scope.`
      );

      setExtracting(false);
    }, 1500);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('authors', authors);
      formData.append('year', year);
      formData.append('tags', tags);
      formData.append('summary', summary);
      if (file) formData.append('file', file);

      await uploadLiterature(projectId, formData);
      setTitle('');
      setAuthors('');
      setYear('');
      setTags('');
      setSummary('');
      setFile(null);
      
      // Reset file input element visually
      const fileInput = document.getElementById('file-field');
      if (fileInput) fileInput.value = '';

      loadReferences();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Extract unique tags across all references for filtering
  const allTags = Array.from(new Set(references.flatMap((ref) => ref.tags || [])));

  // Filter list by text search and selected tag
  const filteredReferences = references.filter((ref) => {
    const matchesSearch =
      ref.title.toLowerCase().includes(search.toLowerCase()) ||
      (ref.authors && ref.authors.toLowerCase().includes(search.toLowerCase())) ||
      (ref.summary && ref.summary.toLowerCase().includes(search.toLowerCase()));

    const matchesTag = selectedTag ? ref.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
      {/* References List & Search */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Literature References</h2>
              <p className="text-xs text-slate-400 mt-0.5">Browse research documents and metadata.</p>
            </div>
            {/* Search */}
            <input
              type="text"
              placeholder="Search literature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-full sm:w-64"
            />
          </div>

          {/* Tags Filtering Pills */}
          {allTags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2.5 items-center">
              <span className="text-xs text-slate-500 font-medium">Filter tag:</span>
              <button
                onClick={() => setSelectedTag('')}
                className={`rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-wider transition-colors ${
                  !selectedTag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  className={`rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-wider transition-colors ${
                    tag === selectedTag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-850'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {filteredReferences.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No references found matching filters.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredReferences.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-xl border border-slate-900/60 bg-slate-950/40 p-5 hover:border-slate-850 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{ref.title}</h3>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {ref.authors || 'Unknown Authors'} · {ref.year || 'Year Not Provided'}
                      </p>
                      <p className="mt-3.5 text-xs text-slate-450 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-900/60">
                        {ref.summary || 'No summary available.'}
                      </p>
                    </div>
                    {ref.filePath && (
                      <a
                        href={`http://localhost:5000/uploads/${ref.filePath.split(/[\\/]/).pop()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 rounded-lg border border-slate-800 bg-slate-900/20 px-3 py-1.5 text-2xs font-bold uppercase text-indigo-400 hover:text-white hover:border-slate-700 transition-colors"
                      >
                        Open
                      </a>
                    )}
                  </div>
                  {ref.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {ref.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-850"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Upload Reference Panel (Owners/Editors only) */}
      <div className="space-y-6">
        {myRole !== 'VIEWER' ? (
          <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Add Reference</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Upload Document
                </label>
                <div className="relative">
                  <input
                    id="file-field"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-2xs file:font-semibold file:bg-slate-900 file:text-indigo-400 file:hover:bg-slate-850 cursor-pointer"
                  />
                  {extracting && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-lg">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-indigo-450 font-semibold uppercase tracking-wider">
                        AI Extracting...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Reference Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Attention Is All You Need"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Authors
                  </label>
                  <input
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    placeholder="Vaswani, et al."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Year
                  </label>
                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2017"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="deep-learning, transformers"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Summary / Notes
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Summary or custom annotations..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving || extracting}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {saving ? 'Uploading...' : 'Save Reference'}
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
              Your role is <strong>Viewer</strong>. You do not have permissions to upload references or modify project literature.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

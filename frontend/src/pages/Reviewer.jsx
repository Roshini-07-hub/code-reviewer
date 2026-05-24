import Editor from '@monaco-editor/react';
import { FileUp, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import FindingBadge from '../components/FindingBadge.jsx';
import ScoreCard from '../components/ScoreCard.jsx';
import { analyzeLocally } from '../utils/staticAnalyzer.js';

const starterCode = '';
const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' }
];

export default function Reviewer() {
  const navigate = useNavigate();
  const [code, setCode] = useState(starterCode);
  const [language, setLanguage] = useState('javascript');
  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const effectiveLanguage = useMemo(() => detectLanguage({ code, filename, language }), [code, filename, language]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (code.trim().length < 20) {
        setPreview(null);
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.post('/reviews/realtime', { code, language: effectiveLanguage, filename: filename || `editor-buffer.${extensionForLanguage(effectiveLanguage)}` });
        setPreview(data);
      } catch (_error) {
        setPreview(analyzeLocally(code));
      } finally {
        setLoading(false);
      }
    }, 900);

    return () => clearTimeout(handle);
  }, [code, effectiveLanguage, filename]);

  const markers = useMemo(() => preview?.findings || [], [preview]);

  function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name;
    setFilename(name);
    setLanguage(languageFromFilename(name) || 'javascript');
    file.text().then(setCode);
  }

  async function submit() {
    setSaving(true);
    try {
      const { data } = await api.post('/reviews', {
        title: title.trim() || 'New review',
        filename: filename.trim() || `untitled.${extensionForLanguage(effectiveLanguage)}`,
        language: effectiveLanguage,
        code
      });
      navigate(`/reviews/${data.review._id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="overflow-hidden rounded border border-line bg-panel">
        <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[1fr_180px_150px_140px]">
          <input
            value={title}
            placeholder="Review title"
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 rounded border border-line bg-ink px-3 outline-none focus:border-accent"
          />
          <input
            value={filename}
            placeholder="Filename (example.js)"
            onChange={(event) => setFilename(event.target.value)}
            className="h-10 rounded border border-line bg-ink px-3 outline-none focus:border-accent"
          />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-10 rounded border border-line bg-ink px-3 outline-none focus:border-accent"
          >
            {languages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-line bg-ink px-3 text-sm hover:border-accent hover:bg-white/5">
            <FileUp size={16} />
            Upload
            <input type="file" className="hidden" onChange={upload} />
          </label>
        </div>

        <Editor
          height="68vh"
          theme="vs-dark"
          language={effectiveLanguage}
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, wordWrap: 'on' }}
        />

        <div className="border-t border-line bg-panel p-4">
          <button onClick={submit} disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-accent font-semibold text-ink disabled:opacity-60">
            <Send size={17} />
            {saving ? 'Creating review...' : 'Review code'}
          </button>
        </div>
      </section>

      <aside className="space-y-4">
        <button onClick={submit} disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-accent font-semibold text-ink disabled:opacity-60">
          <Send size={17} />
          {saving ? 'Creating review...' : 'Create pull request review'}
        </button>

        {preview ? (
          <>
            <section className="rounded border border-line bg-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Real-time Analysis</h2>
                <span className="text-xs text-slate-400">{loading ? 'Analyzing...' : preview?.model === 'local-static' ? 'Local' : 'Live'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard label="Security" value={preview?.scores?.security} />
                <ScoreCard label="Overall" value={preview?.scores?.overall} />
              </div>
            </section>

            <section className="max-h-[56vh] overflow-auto rounded border border-line bg-panel scrollbar-thin">
              <div className="sticky top-0 border-b border-line bg-panel px-4 py-3">
                <h3 className="font-semibold">Findings</h3>
              </div>
              <div className="divide-y divide-line">
                {markers.map((finding) => (
                  <div key={finding.id} className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Line {finding.line}</p>
                      <FindingBadge severity={finding.severity} />
                    </div>
                    <p className="font-medium">{finding.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{finding.message}</p>
                  </div>
                ))}
                {!markers.length && <p className="p-4 text-sm text-slate-400">Issues will appear as you type.</p>}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded border border-line bg-panel p-4 text-slate-400">Type at least 20 characters to enable live analysis.</section>
        )}
        
      </aside>
    </div>
  );
}

function languageFromFilename(name) {
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension === 'py') return 'python';
  if (extension === 'ts' || extension === 'tsx') return 'typescript';
  if (extension === 'java') return 'java';
  if (extension === 'cs') return 'csharp';
  if (['c', 'cc', 'cpp', 'cxx', 'h', 'hpp'].includes(extension)) return 'cpp';
  if (['js', 'jsx', 'mjs', 'cjs'].includes(extension)) return 'javascript';
  return null;
}

function extensionForLanguage(language) {
  if (language === 'python') return 'py';
  if (language === 'typescript') return 'ts';
  if (language === 'java') return 'java';
  if (language === 'csharp') return 'cs';
  if (language === 'cpp') return 'cpp';
  return 'js';
}

function detectLanguage({ code, filename, language }) {
  if (filename.trim()) return languageFromFilename(filename) || language;

  const trimmed = code.trim();
  const pythonSignals = [
    /^\s*(def|class)\s+\w+.*:/m,
    /^\s*(import|from)\s+[\w.]+/m,
    /^\s*(if|elif|else|for|while|try|except|with)\b.*:\s*$/m,
    /\bprint\s*\(/,
    /\bself\./
  ];

  if (pythonSignals.some((pattern) => pattern.test(trimmed))) return 'python';
  return language;
}

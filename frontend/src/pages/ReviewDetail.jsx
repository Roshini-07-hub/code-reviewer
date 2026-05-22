import { CheckCircle2, Download, MessageSquarePlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import FindingBadge from '../components/FindingBadge.jsx';
import ScoreCard from '../components/ScoreCard.jsx';

export default function ReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    api.get(`/reviews/${id}`).then(({ data }) => {
      setReview(data.review);
      setComments(data.comments);
    });
  }, [id]);

  const commentsByLine = useMemo(() => {
    return comments.reduce((map, comment) => {
      map[comment.line] = [...(map[comment.line] || []), comment];
      return map;
    }, {});
  }, [comments]);

  if (!review) return <p className="text-slate-400">Loading review...</p>;

  const lines = review.code.split('\n');
  const findingsByLine = review.findings.reduce((map, finding) => {
    map[finding.line] = [...(map[finding.line] || []), finding];
    return map;
  }, {});

  async function addComment(line) {
    const body = drafts[line]?.trim();
    if (!body) return;
    const { data } = await api.post(`/reviews/${id}/comments`, { line, body });
    setComments([...comments, data.comment]);
    setDrafts({ ...drafts, [line]: '' });
  }

  async function resolveComment(comment) {
    const { data } = await api.patch(`/reviews/${id}/comments/${comment._id}`, { resolved: !comment.resolved });
    setComments(comments.map((item) => (item._id === comment._id ? data.comment : item)));
  }

  async function exportPdf() {
    const response = await api.get(`/reviews/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${review.filename}-review.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-semibold">{review.title}</h2>
          <p className="text-slate-400">{review.filename} reviewed by {review.model}</p>
        </div>
        <button onClick={exportPdf} className="inline-flex h-10 items-center justify-center gap-2 rounded border border-line px-3 hover:border-accent hover:text-accent">
          <Download size={16} />
          Export PDF
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <ScoreCard label="Security" value={review.scores.security} />
        <ScoreCard label="Readability" value={review.scores.readability} />
        <ScoreCard label="Performance" value={review.scores.performance} />
        <ScoreCard label="Maintainability" value={review.scores.maintainability} />
        <ScoreCard label="Overall" value={review.scores.overall} />
      </div>
      <section className="rounded border border-line bg-panel p-4">
        <h3 className="mb-2 font-semibold">AI Summary</h3>
        <p className="text-slate-300">{review.summary}</p>
      </section>
      <section className="overflow-hidden rounded border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h3 className="font-semibold">Pull Request Review</h3>
        </div>
        <div className="overflow-auto scrollbar-thin">
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            return (
              <div key={lineNumber} className="border-b border-line/70">
                <div className={`grid grid-cols-[64px_1fr] ${findingsByLine[lineNumber] ? 'bg-danger/5' : ''}`}>
                  <div className="select-none border-r border-line px-3 py-2 text-right text-sm text-slate-500">{lineNumber}</div>
                  <pre className="overflow-x-auto px-3 py-2 text-sm text-slate-200"><code>{line || ' '}</code></pre>
                </div>
                {findingsByLine[lineNumber]?.map((finding) => (
                  <div key={finding.id} className="ml-16 border-l-2 border-danger bg-ink/50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <FindingBadge severity={finding.severity} />
                      <span className="text-sm font-semibold">{finding.title}</span>
                    </div>
                    <p className="text-sm text-slate-300">{finding.message}</p>
                    {finding.suggestedFix && <p className="mt-2 text-sm text-accent">Suggested fix: {finding.suggestedFix}</p>}
                  </div>
                ))}
                {commentsByLine[lineNumber]?.map((comment) => (
                  <div key={comment._id} className="ml-16 flex items-start justify-between gap-3 border-l-2 border-accent bg-accent/5 p-3">
                    <div>
                      <p className="text-sm font-medium">{comment.author?.name || 'Reviewer'}</p>
                      <p className="text-sm text-slate-300">{comment.body}</p>
                    </div>
                    <button onClick={() => resolveComment(comment)} className="text-accent" title="Toggle resolved">
                      <CheckCircle2 size={18} className={comment.resolved ? 'fill-accent text-ink' : ''} />
                    </button>
                  </div>
                ))}
                <div className="ml-16 grid gap-2 border-l border-line bg-ink/30 p-3 md:grid-cols-[1fr_auto]">
                  <input
                    value={drafts[lineNumber] || ''}
                    onChange={(event) => setDrafts({ ...drafts, [lineNumber]: event.target.value })}
                    placeholder="Add line comment"
                    className="h-9 rounded border border-line bg-ink px-3 text-sm outline-none focus:border-accent"
                  />
                  <button onClick={() => addComment(lineNumber)} className="inline-flex h-9 items-center justify-center gap-2 rounded border border-line px-3 text-sm hover:border-accent">
                    <MessageSquarePlus size={15} />
                    Comment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function ScoreCard({ label, value }) {
  if (value == null) {
    return (
      <div className="rounded border border-line bg-panel p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-semibold text-slate-400">-</p>
        </div>
        <div className="mt-4 h-2 rounded bg-white/10">
          <div className="h-full rounded bg-current" style={{ width: `0%` }} />
        </div>
      </div>
    );
  }

  const score = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 0;
  const color = score >= 80 ? 'text-accent' : score >= 60 ? 'text-warning' : 'text-danger';

  return (
    <div className="rounded border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`text-2xl font-semibold ${color}`}>{score}</p>
      </div>
      <div className="mt-4 h-2 rounded bg-white/10">
        <div className="h-full rounded bg-current" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

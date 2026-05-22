import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';
import ScoreCard from '../components/ScoreCard.jsx';

const colors = ['#3dd6c6', '#f6c85f', '#ff6678', '#9ca3af', '#60a5fa', '#c084fc'];
const emptyAnalytics = {
  totals: { reviews: 0, findings: 0, averageOverall: 0, averageSecurity: 0 },
  severity: [
    { name: 'low', value: 0 },
    { name: 'medium', value: 0 },
    { name: 'high', value: 0 },
    { name: 'critical', value: 0 }
  ],
  categories: [],
  trend: []
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);

    api.get('/analytics/summary')
      .then((response) => setAnalytics(response.data))
      .catch((error) => {
        console.error('Dashboard analytics load failed', error);
        setAnalytics(emptyAnalytics);
      });

    api.get('/reviews')
      .then((response) => setReviews(response.data.reviews))
      .catch((error) => {
        console.error('Dashboard review list load failed', error);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!analytics) return <p className="text-slate-400">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Review Intelligence</h2>
          <p className="text-slate-400">Quality, risk, and trend signals from your code reviews.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded border border-line bg-panel px-4 font-semibold text-slate-100 hover:border-accent disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/reviewer" className="inline-flex h-11 items-center justify-center rounded bg-accent px-4 font-semibold text-ink">
            New review
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard label="Overall Average" value={analytics.totals.reviews ? analytics.totals.averageOverall : null} />
        <ScoreCard label="Security Average" value={analytics.totals.reviews ? analytics.totals.averageSecurity : null} />
        <Metric label="Reviews" value={analytics.totals.reviews} />
        <Metric label="Findings" value={analytics.totals.findings} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartShell title="Score Trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.trend}>
              <CartesianGrid stroke="#252b3a" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#10131d', border: '1px solid #252b3a' }} />
              <Line type="monotone" dataKey="overall" stroke="#3dd6c6" strokeWidth={2} />
              <Line type="monotone" dataKey="security" stroke="#ff6678" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>
        <ChartShell title="Finding Categories">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.categories}>
              <CartesianGrid stroke="#252b3a" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#10131d', border: '1px solid #252b3a' }} />
              <Bar dataKey="value" fill="#3dd6c6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="rounded border border-line bg-panel">
          <div className="border-b border-line px-4 py-3">
            <h3 className="font-semibold">Recent Reviews</h3>
          </div>
          <div className="divide-y divide-line">
            {reviews.map((review) => (
              <div key={review._id} className="grid gap-2 px-4 py-3 hover:bg-white/5 md:grid-cols-[1fr_120px_120px] items-center">
                <Link to={`/reviews/${review._id}`} className="contents">
                  <div>
                    <p className="font-medium">{review.title}</p>
                    <p className="text-sm text-slate-400">{review.filename}</p>
                  </div>
                  <p className="text-sm text-slate-400">{review.findings.length} findings</p>
                  <p className="font-semibold text-accent">{review.scores.overall}/100</p>
                </Link>
                <div className="flex items-center justify-end">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm('Delete this review? This cannot be undone.')) return;
                      try {
                        await api.delete(`/reviews/${review._id}`);
                        setReviews((r) => r.filter((x) => x._id !== review._id));
                        // refresh analytics
                        api.get('/analytics/summary').then((res) => setAnalytics(res.data)).catch(() => setAnalytics(emptyAnalytics));
                      } catch (err) {
                        console.error('Failed to delete review', err);
                        alert('Failed to delete review');
                      }
                    }}
                    className="ml-3 inline-flex h-8 items-center justify-center rounded border border-line px-3 text-sm text-red-400 hover:border-accent"
                    title="Delete review"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!reviews.length && <p className="px-4 py-8 text-slate-400">No reviews yet.</p>}
          </div>
        </section>
        <ChartShell title="Severity Mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analytics.severity} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {analytics.severity.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#10131d', border: '1px solid #252b3a' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-line bg-panel p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ChartShell({ title, children }) {
  return (
    <section className="rounded border border-line bg-panel p-4">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

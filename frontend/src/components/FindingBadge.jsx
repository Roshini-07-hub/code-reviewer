const styles = {
  critical: 'border-danger bg-danger/10 text-danger',
  high: 'border-danger bg-danger/10 text-danger',
  medium: 'border-warning bg-warning/10 text-warning',
  low: 'border-accent bg-accent/10 text-accent'
};

export default function FindingBadge({ severity }) {
  return <span className={`rounded border px-2 py-0.5 text-xs font-medium ${styles[severity] || styles.low}`}>{severity}</span>;
}

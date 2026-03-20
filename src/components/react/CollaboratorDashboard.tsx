import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineObject {
  name: string;
  status: string;
  research_films: number;
  outline: string;
  narration: string;
  edit: string;
  target_release: string;
  notes?: string;
}

interface Submission {
  id: string;
  type: 'object' | 'film' | 'clip';
  status: 'pending' | 'approved' | 'rejected';
  data: string;
  submitter_name: string | null;
  submitter_email: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface CollaboratorDashboardProps {
  pipelineObjects: PipelineObject[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function stageColor(val: string): string {
  if (val === 'complete') return 'border-green-300 text-green-700 bg-green-50';
  if (val === 'not-started') return 'border-divider text-secondary bg-data-bg opacity-50';
  return 'border-amber-300 text-amber-700 bg-amber-50';
}

function statusBadgeColor(status: string): string {
  if (status === 'published' || status === 'narration-complete') {
    return 'border-green-300 text-green-700 bg-green-50';
  }
  if (status === 'needs-recording') {
    return 'border-amber-300 text-amber-700 bg-amber-50';
  }
  return 'border-divider text-secondary bg-data-bg';
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 rounded border border-green-300 bg-green-50 text-green-800 px-4 py-3 text-sm font-sans shadow-md"
    >
      {message}
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/collaborator/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const json = await res.json() as { error?: string };
        setError(json.error ?? 'Authentication failed.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="font-serif text-2xl font-medium text-primary mb-2">
        Collaborator Access
      </h1>
      <p className="text-secondary text-sm font-sans mb-8">
        Enter your password to access the production dashboard.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm font-sans"
          >
            {error}
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="collab-password" className="block text-primary font-sans text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="collab-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full border border-divider bg-surface text-primary rounded px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-link focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-link text-white font-sans text-sm font-medium px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

// ── Section: Production Status ────────────────────────────────────────────────

function ProductionStatus({ objects }: { objects: PipelineObject[] }) {
  return (
    <section className="mb-14">
      <h2 className="text-sm font-sans font-semibold uppercase tracking-widest text-secondary mb-4">
        Production Status
      </h2>
      <div className="overflow-x-auto rounded border border-divider">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-divider bg-data-bg">
              {(['Object', 'Research Films', 'Outline', 'Narration', 'Edit', 'Target Release'] as const).map(col => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objects.map((obj, i) => (
              <tr
                key={obj.name}
                className={`border-b border-divider last:border-0 ${i % 2 !== 0 ? 'bg-data-bg/30' : ''}`}
              >
                <td className="px-4 py-3">
                  <span className="font-serif font-medium text-primary">{obj.name}</span>
                  <span
                    className={`ml-2 text-xs font-mono px-1.5 py-0.5 rounded border ${statusBadgeColor(obj.status)}`}
                  >
                    {obj.status.replace(/-/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-secondary font-mono text-xs">{obj.research_films}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${stageColor(obj.outline)}`}>
                    {obj.outline.replace(/-/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${stageColor(obj.narration)}`}>
                    {obj.narration.replace(/-/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${stageColor(obj.edit)}`}>
                    {obj.edit.replace(/-/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-secondary text-xs font-sans whitespace-nowrap">
                  {formatDate(obj.target_release)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Section: Content Calendar ─────────────────────────────────────────────────

function ContentCalendar({ objects }: { objects: PipelineObject[] }) {
  // Group by month from target_release
  const byMonth = new Map<string, PipelineObject[]>();
  for (const obj of objects) {
    const month = obj.target_release.slice(0, 7); // "YYYY-MM"
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(obj);
  }

  const sortedMonths = Array.from(byMonth.keys()).sort();

  return (
    <section className="mb-14">
      <h2 className="text-sm font-sans font-semibold uppercase tracking-widest text-secondary mb-4">
        Content Calendar
      </h2>
      <div className="space-y-6">
        {sortedMonths.map(month => (
          <div key={month}>
            <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-secondary mb-3 pb-1 border-b border-divider">
              {formatMonth(month + '-01')}
            </h3>
            <ul className="space-y-2 list-none p-0 m-0">
              {byMonth.get(month)!.map(obj => (
                <li
                  key={obj.name}
                  className="flex items-center gap-3 text-sm font-sans"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      obj.status === 'published'
                        ? 'bg-green-500'
                        : obj.status === 'narration-complete'
                          ? 'bg-amber-400'
                          : 'bg-gray-300'
                    }`}
                  />
                  <span className="font-serif font-medium text-primary">{obj.name}</span>
                  <span className="text-secondary text-xs">{formatDate(obj.target_release)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section: Pending Submissions ──────────────────────────────────────────────

function PendingSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/submissions?status=pending')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data: unknown) => setSubmissions(data as Submission[]))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    // Optimistically remove from list
    setSubmissions(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setToast(`Submission ${status}.`);
    } catch {
      setToast('Action failed — please try again.');
    }
  };

  return (
    <section className="mb-14">
      <h2 className="text-sm font-sans font-semibold uppercase tracking-widest text-secondary mb-4">
        Pending Submissions
      </h2>
      {loading ? (
        <p className="text-secondary text-sm font-sans">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="text-secondary text-sm font-sans">No pending submissions.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-divider">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider bg-data-bg">
                {(['Type', 'Summary', 'Submitter', 'Date', 'Actions'] as const).map(col => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, i) => {
                let summary = '';
                try {
                  const parsed = JSON.parse(sub.data);
                  const raw = JSON.stringify(parsed);
                  summary = raw.slice(0, 100) + (raw.length > 100 ? '…' : '');
                } catch {
                  summary = sub.data.slice(0, 100);
                }
                return (
                  <tr
                    key={sub.id}
                    className={`border-b border-divider last:border-0 ${i % 2 !== 0 ? 'bg-data-bg/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-divider text-secondary bg-data-bg">
                        {sub.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary font-sans text-xs max-w-xs truncate">
                      {summary}
                    </td>
                    <td className="px-4 py-3 text-secondary font-sans text-xs whitespace-nowrap">
                      {sub.submitter_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-secondary font-sans text-xs whitespace-nowrap">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(sub.id, 'approved')}
                          className="text-xs font-sans px-2.5 py-1 rounded border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(sub.id, 'rejected')}
                          className="text-xs font-sans px-2.5 py-1 rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </section>
  );
}

// ── Section: Narration Queue ──────────────────────────────────────────────────

function NarrationQueue({ objects }: { objects: PipelineObject[] }) {
  const queue = objects.filter(o => o.narration === 'needs-recording');

  return (
    <section className="mb-14">
      <h2 className="text-sm font-sans font-semibold uppercase tracking-widest text-secondary mb-4">
        Narration Queue
      </h2>
      {queue.length === 0 ? (
        <p className="text-secondary text-sm font-sans">No objects awaiting recording.</p>
      ) : (
        <ul className="space-y-2 list-none p-0 m-0">
          {queue.map(obj => (
            <li
              key={obj.name}
              className="flex items-center justify-between rounded border border-amber-200 bg-amber-50/40 px-4 py-3"
            >
              <span className="font-serif font-medium text-primary">{obj.name}</span>
              <span className="text-xs font-sans text-secondary">
                Target: {formatDate(obj.target_release)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ pipelineObjects }: CollaboratorDashboardProps) {
  return (
    <div>
      <div className="mb-10">
        <p className="text-xs font-sans uppercase tracking-widest text-secondary mb-2">
          Collaborator View
        </p>
        <h1 className="font-serif text-3xl font-medium text-primary mb-2">
          Production Dashboard
        </h1>
        <p className="text-secondary text-sm font-sans">
          Internal view — production status, content calendar, pending submissions, and narration queue.
        </p>
      </div>

      <ProductionStatus objects={pipelineObjects} />
      <ContentCalendar objects={pipelineObjects} />
      <PendingSubmissions />
      <NarrationQueue objects={pipelineObjects} />
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function CollaboratorDashboard({ pipelineObjects }: CollaboratorDashboardProps) {
  const [authState, setAuthState] = useState<'checking' | 'login' | 'dashboard'>('checking');

  // Determine auth state by probing the submissions API.
  // If we get a 401, show login. If we get 200 or 503 (DB unavailable but authed), show dashboard.
  useEffect(() => {
    fetch('/api/submissions?status=pending')
      .then(res => {
        if (res.status === 401) {
          setAuthState('login');
        } else {
          setAuthState('dashboard');
        }
      })
      .catch(() => {
        // Network error — default to login form
        setAuthState('login');
      });
  }, []);

  if (authState === 'checking') {
    return (
      <div className="mt-16 text-center">
        <p className="text-secondary text-sm font-sans">Loading…</p>
      </div>
    );
  }

  if (authState === 'login') {
    return <LoginForm onSuccess={() => setAuthState('dashboard')} />;
  }

  return <Dashboard pipelineObjects={pipelineObjects} />;
}

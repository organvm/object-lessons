import { useMemo } from 'react';

interface PipelineObject {
  name: string;
  status: string;
  research_films: number;
  outline: string;
  narration: string;
  edit: string;
  target_release: string;
  notes: string;
}

interface PipelineTimelineProps {
  objects: PipelineObject[];
}

function getStatusColor(status: string): { bg: string; border: string; dot: string; label: string } {
  switch (status) {
    case 'published':
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        dot: 'bg-green-500',
        label: 'Published',
      };
    case 'narration-complete':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
        label: 'Narration Complete',
      };
    case 'needs-recording':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        dot: 'bg-blue-400',
        label: 'Needs Recording',
      };
    case 'researching':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        dot: 'bg-purple-400',
        label: 'Researching',
      };
    default:
      return {
        bg: 'bg-data-bg',
        border: 'border-divider',
        dot: 'bg-secondary',
        label: status.replace(/-/g, ' '),
      };
  }
}

function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function completionPercent(obj: PipelineObject): number {
  const stages = [obj.outline, obj.narration, obj.edit];
  const done = stages.filter(s => s === 'complete').length;
  return Math.round((done / stages.length) * 100);
}

export default function PipelineTimeline({ objects }: PipelineTimelineProps) {
  const sorted = useMemo(
    () => [...objects].sort((a, b) => a.target_release.localeCompare(b.target_release)),
    [objects]
  );

  // Group by month
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: PipelineObject[] }>();
    for (const obj of sorted) {
      const key = getMonthKey(obj.target_release);
      if (!map.has(key)) {
        map.set(key, { label: formatMonthYear(obj.target_release), items: [] });
      }
      map.get(key)!.items.push(obj);
    }
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <div className="w-full">
      {/* Desktop: horizontal scroll with month groups */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {groups.map(([key, group]) => (
            <div key={key} className="flex flex-col gap-3">
              {/* Month label */}
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-divider" />
                <span className="text-xs font-sans font-semibold uppercase tracking-widest text-secondary whitespace-nowrap px-2">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-divider" />
              </div>

              {/* Cards in this month */}
              {group.items.map(obj => {
                const colors = getStatusColor(obj.status);
                const pct = completionPercent(obj);
                return (
                  <div
                    key={obj.name}
                    className={`w-52 rounded border ${colors.border} ${colors.bg} p-3 flex flex-col gap-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-serif font-medium text-primary text-sm leading-snug">
                        {obj.name}
                      </span>
                      <span
                        className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`}
                        aria-label={colors.label}
                        title={colors.label}
                      />
                    </div>

                    <div className="text-xs text-secondary font-sans space-y-0.5">
                      <div>{obj.research_films} films researched</div>
                      <div className="capitalize">{colors.label}</div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-1">
                      <div className="h-1 bg-divider rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors.dot}`}
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${obj.name} production progress: ${pct}%`}
                        />
                      </div>
                      <div className="text-xs text-secondary mt-0.5 font-mono">{pct}%</div>
                    </div>

                    {/* Stage indicators */}
                    <div className="flex gap-1 flex-wrap">
                      {(['outline', 'narration', 'edit'] as const).map(stage => (
                        <span
                          key={stage}
                          className={`text-xs font-mono px-1 py-0.5 rounded ${
                            obj[stage] === 'complete'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : obj[stage] === 'not-started'
                                ? 'bg-data-bg text-secondary border border-divider opacity-50'
                                : 'bg-amber-100 text-amber-700 border border-amber-300'
                          }`}
                        >
                          {stage.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden flex flex-col gap-4">
        {sorted.map(obj => {
          const colors = getStatusColor(obj.status);
          const pct = completionPercent(obj);
          return (
            <div
              key={obj.name}
              className={`rounded border ${colors.border} ${colors.bg} p-4`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-serif font-medium text-primary">{obj.name}</h3>
                  <p className="text-xs text-secondary font-sans mt-0.5">
                    {formatMonthYear(obj.target_release)} · {obj.research_films} films
                  </p>
                </div>
                <span
                  className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`}
                  aria-label={colors.label}
                />
              </div>

              <div className="flex gap-1.5 flex-wrap mb-2">
                {(['outline', 'narration', 'edit'] as const).map(stage => (
                  <span
                    key={stage}
                    className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                      obj[stage] === 'complete'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : obj[stage] === 'not-started'
                          ? 'bg-data-bg text-secondary border-divider opacity-50'
                          : 'bg-amber-100 text-amber-700 border-amber-300'
                    }`}
                  >
                    {stage}: {obj[stage].replace(/-/g, ' ')}
                  </span>
                ))}
              </div>

              <div className="h-1 bg-divider rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.dot}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${obj.name}: ${pct}% complete`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs font-sans text-secondary">
        {[
          { status: 'published', label: 'Published' },
          { status: 'narration-complete', label: 'Narration Complete' },
          { status: 'needs-recording', label: 'Needs Recording' },
          { status: 'researching', label: 'Researching' },
        ].map(({ status, label }) => {
          const colors = getStatusColor(status);
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} aria-hidden="true" />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

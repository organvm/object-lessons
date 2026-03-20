import { useMemo } from 'react';

interface DensityFilm {
  id: string;
  title: string;
  year: number;
  director: string;
  objects: string[];
  density_score: number;
}

interface ObjectDensityGraphProps {
  films: DensityFilm[];
  objects: string[];
}

function getIntensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-data-bg text-secondary';
  const ratio = count / max;
  if (ratio >= 0.8) return 'bg-accent text-white';
  if (ratio >= 0.6) return 'bg-accent/70 text-white';
  if (ratio >= 0.4) return 'bg-accent/50 text-primary';
  if (ratio >= 0.2) return 'bg-accent/30 text-primary';
  return 'bg-accent/15 text-primary';
}

export default function ObjectDensityGraph({ films, objects }: ObjectDensityGraphProps) {
  // Build co-occurrence matrix
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const obj of objects) {
      m[obj] = {};
      for (const obj2 of objects) {
        m[obj][obj2] = 0;
      }
    }
    for (const film of films) {
      const filmObjects = new Set(film.objects);
      for (const o1 of objects) {
        for (const o2 of objects) {
          if (o1 !== o2 && filmObjects.has(o1) && filmObjects.has(o2)) {
            m[o1][o2] += 1;
          }
        }
      }
    }
    return m;
  }, [films, objects]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const row of Object.values(matrix)) {
      for (const count of Object.values(row)) {
        if (count > max) max = count;
      }
    }
    return max || 1;
  }, [matrix]);

  // High-density films: 3+ objects tracked
  const highDensityFilms = useMemo(
    () =>
      films
        .filter(f => f.objects.filter(o => objects.includes(o)).length >= 3)
        .sort((a, b) => b.density_score - a.density_score),
    [films, objects]
  );

  return (
    <div className="w-full">
      {/* Co-occurrence matrix */}
      <div className="overflow-x-auto">
        <table
          className="border-collapse text-xs font-mono"
          aria-label="Object co-occurrence matrix — number of films where both objects appear"
        >
          <thead>
            <tr>
              {/* Empty corner */}
              <th scope="col" className="w-24 p-0" aria-label="Object pairs" />
              {objects.map(obj => (
                <th
                  key={obj}
                  scope="col"
                  className="pb-2 px-1 font-sans font-semibold text-secondary text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '80px' }}
                >
                  {obj}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objects.map(rowObj => (
              <tr key={rowObj}>
                <th
                  scope="row"
                  className="pr-3 text-right font-sans font-medium text-secondary text-xs uppercase tracking-wide whitespace-nowrap py-1 capitalize"
                >
                  {rowObj}
                </th>
                {objects.map(colObj => {
                  const count = rowObj === colObj ? null : matrix[rowObj][colObj];
                  const isDiag = rowObj === colObj;
                  return (
                    <td
                      key={colObj}
                      className={`w-10 h-10 text-center border border-white/50 transition-colors ${
                        isDiag
                          ? 'bg-divider'
                          : getIntensityClass(count ?? 0, maxCount)
                      }`}
                      aria-label={
                        isDiag
                          ? `${rowObj} (diagonal)`
                          : `${rowObj} and ${colObj}: ${count ?? 0} co-occurrence${count !== 1 ? 's' : ''}`
                      }
                      title={
                        isDiag
                          ? rowObj
                          : `${rowObj} + ${colObj}: ${count ?? 0} films`
                      }
                    >
                      {!isDiag && (count ?? 0) > 0 ? count : isDiag ? '—' : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color scale legend */}
      <div className="mt-3 flex items-center gap-2 text-xs text-secondary font-sans">
        <span>Fewer co-occurrences</span>
        {[0.1, 0.3, 0.5, 0.7, 1.0].map((ratio, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-sm ${getIntensityClass(Math.round(ratio * maxCount), maxCount)}`}
            aria-hidden="true"
          />
        ))}
        <span>More co-occurrences</span>
      </div>

      {/* High-density films */}
      {highDensityFilms.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-sans font-semibold uppercase tracking-widest text-secondary mb-4">
            High-Density Films (3+ tracked objects)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" aria-label="Films appearing in 3 or more tracked object catalogues">
              <thead>
                <tr className="border-b border-divider bg-data-bg">
                  <th scope="col" className="px-4 py-2 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary">
                    Film
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary">
                    Year
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary">
                    Director
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary">
                    Objects
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary">
                    Density
                  </th>
                </tr>
              </thead>
              <tbody>
                {highDensityFilms.map((film, i) => {
                  const trackedObjects = film.objects.filter(o => objects.includes(o));
                  return (
                    <tr
                      key={film.id}
                      className={`border-b border-divider last:border-0 ${i % 2 === 0 ? '' : 'bg-data-bg/30'}`}
                    >
                      <td className="px-4 py-3 font-medium text-primary">{film.title}</td>
                      <td className="px-4 py-3 text-secondary font-mono text-xs">{film.year}</td>
                      <td className="px-4 py-3 text-secondary text-xs">{film.director}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {trackedObjects.map(obj => (
                            <span
                              key={obj}
                              className="font-mono text-xs px-1.5 py-0.5 rounded border border-accent/40 text-accent capitalize"
                            >
                              {obj}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <span
                                key={j}
                                className={`w-2 h-2 rounded-full ${
                                  j < film.density_score ? 'bg-accent' : 'bg-divider'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-secondary font-mono">{film.density_score}/5</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

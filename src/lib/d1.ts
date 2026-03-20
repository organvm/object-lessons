export interface Submission {
  id: string;
  type: 'object' | 'film' | 'clip';
  status: 'pending' | 'approved' | 'rejected';
  data: string; // JSON stringified payload
  submitter_name: string | null;
  submitter_email: string | null;
  created_at: string; // ISO 8601
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export async function createSubmission(
  db: D1Database,
  submission: Omit<Submission, 'status' | 'reviewed_at' | 'reviewed_by'>
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO submissions (id, type, status, data, submitter_name, submitter_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      submission.id,
      submission.type,
      'pending',
      submission.data,
      submission.submitter_name,
      submission.submitter_email,
      submission.created_at
    )
    .run();
}

export async function getSubmissions(
  db: D1Database,
  status?: string
): Promise<Submission[]> {
  const query = status
    ? db
        .prepare('SELECT * FROM submissions WHERE status = ? ORDER BY created_at DESC')
        .bind(status)
    : db.prepare('SELECT * FROM submissions ORDER BY created_at DESC');
  const result = await query.all<Submission>();
  return result.results;
}

export async function updateSubmission(
  db: D1Database,
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string
): Promise<void> {
  await db
    .prepare(
      'UPDATE submissions SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?'
    )
    .bind(status, new Date().toISOString(), reviewedBy, id)
    .run();
}

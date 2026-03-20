import type { APIRoute } from 'astro';
import { checkSession } from '../../../lib/auth';
import { updateSubmission } from '../../../lib/d1';

export const prerender = false;

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const expectedPassword: string | undefined = env?.COLLABORATOR_PASSWORD;

    if (!expectedPassword) {
      return new Response(JSON.stringify({ error: 'Auth not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authenticated = await checkSession(
      request.headers.get('cookie'),
      expectedPassword
    );

    if (!authenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract id from URL path: /api/submissions/:id
    const id = new URL(request.url).pathname.split('/').pop();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Record<string, unknown>;
    const { status } = body ?? {};

    if (status !== 'approved' && status !== 'rejected') {
      return new Response(
        JSON.stringify({ error: 'Status must be "approved" or "rejected"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateSubmission(db, id, status, 'collaborator');

    return new Response(JSON.stringify({ id, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

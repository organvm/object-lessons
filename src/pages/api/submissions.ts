import type { APIRoute } from 'astro';
import { checkSession } from '../../lib/auth';
import { getSubmissions } from '../../lib/d1';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
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

    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;

    const submissions = await getSubmissions(db, status);

    return new Response(JSON.stringify(submissions), {
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

import type { APIRoute } from 'astro';
import { validatePassword, createSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const expectedPassword: string | undefined = env?.COLLABORATOR_PASSWORD;

    if (!expectedPassword) {
      return new Response(JSON.stringify({ error: 'Auth not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Record<string, unknown>;
    const { password } = body ?? {};

    if (typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!validatePassword(password, expectedPassword)) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cookie = await createSessionCookie(expectedPassword);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

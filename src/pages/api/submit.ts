import type { APIRoute } from 'astro';
import { createSubmission } from '../../lib/d1';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    if (!['object', 'film', 'clip'].includes(body.type)) {
      return new Response(JSON.stringify({ error: 'Invalid submission type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields per type
    if (body.type === 'object') {
      if (!body.data?.object_name || String(body.data.object_name).trim() === '') {
        return new Response(JSON.stringify({ error: 'Object name is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.data?.why_it_matters || String(body.data.why_it_matters).trim().length < 50) {
        return new Response(
          JSON.stringify({ error: 'Why it matters must be at least 50 characters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (body.type === 'film') {
      if (!body.data?.film_title || String(body.data.film_title).trim() === '') {
        return new Response(JSON.stringify({ error: 'Film title is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.data?.year) {
        return new Response(JSON.stringify({ error: 'Year is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.data?.scene_description || String(body.data.scene_description).trim() === '') {
        return new Response(JSON.stringify({ error: 'Scene description is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (body.type === 'clip') {
      if (!body.data?.film_title || String(body.data.film_title).trim() === '') {
        return new Response(JSON.stringify({ error: 'Film title is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.data?.object || String(body.data.object).trim() === '') {
        return new Response(JSON.stringify({ error: 'Object is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.data?.url || String(body.data.url).trim() === '') {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.data?.timestamp || String(body.data.timestamp).trim() === '') {
        return new Response(JSON.stringify({ error: 'Timestamp is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const id = crypto.randomUUID();
    await createSubmission(db, {
      id,
      type: body.type,
      data: JSON.stringify(body.data),
      submitter_name: body.submitter_name || null,
      submitter_email: body.submitter_email || null,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ id, status: 'pending' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

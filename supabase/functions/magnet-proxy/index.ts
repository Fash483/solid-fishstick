/**
 * magnet-proxy Edge Function
 *
 * Acts as a CORS-free proxy between the browser bookmarklet (running on
 * any external page) and the NeonDB HTTP SQL API.  The bookmarklet embeds
 * this function's URL + the Supabase anon-key; the NeonDB connection string
 * is passed in the request body so it never has to be hard-coded here.
 *
 * POST /functions/v1/magnet-proxy
 * Body: { connectionString: string, magnets: Array<{ title: string, magnet: string }> }
 * Returns: { saved: number, failed: number, errors: string[] }
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let body: { connectionString?: string; magnets?: Array<{ title: string; magnet: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { connectionString, magnets } = body;

  if (!connectionString || !Array.isArray(magnets) || magnets.length === 0) {
    return new Response(JSON.stringify({ error: 'connectionString and magnets[] are required' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Derive the Neon HTTP endpoint from the connection string
  // Format: postgresql://user:password@host[:port]/database
  const hostMatch = connectionString.match(
    /^(?:postgresql|postgres):\/\/[^@]+@([^/:?]+)/
  );
  if (!hostMatch) {
    return new Response(JSON.stringify({ error: 'Could not parse connection string host' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const neonEndpoint = `https://${hostMatch[1]}/sql`;
  const errors: string[] = [];
  let saved = 0;
  let failed = 0;

  // Insert each magnet link — sequential to avoid overwhelming the DB
  for (const { title, magnet } of magnets) {
    try {
      const res = await fetch(neonEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Neon-Connection-String': connectionString,
        },
        body: JSON.stringify({
          query: 'INSERT INTO magnet_links (title, magnet) VALUES ($1, $2)',
          params: [title ?? '(imported)', magnet],
        }),
      });

      if (res.ok) {
        saved++;
      } else {
        failed++;
        const text = await res.text().catch(() => res.statusText);
        errors.push(`[${res.status}] ${text.slice(0, 120)}`);
      }
    } catch (err) {
      failed++;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return new Response(
    JSON.stringify({ saved, failed, errors }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  );
});

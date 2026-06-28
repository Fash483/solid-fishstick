import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DATABASE_URL = process.env.NEON_DATABASE_URL!;

function sql() {
  if (!DATABASE_URL) throw new Error('NEON_DATABASE_URL environment variable is not set');
  return neon(DATABASE_URL);
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = sql();
    const { action, title, magnet, ids, items } = (req.body ?? {}) as {
      action?: string;
      title?: string;
      magnet?: string;
      ids?: string[];
      items?: Array<{ title: string; magnet: string }>;
    };

    // GET /api/db?action=fetch — fetch all links
    if (req.method === 'GET' || (req.method === 'POST' && action === 'fetch')) {
      await db`
        CREATE TABLE IF NOT EXISTS magnet_links (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL DEFAULT '',
          magnet TEXT NOT NULL,
          created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const rows = await db`
        SELECT id, title, magnet, created_date, updated_date
        FROM magnet_links
        ORDER BY created_date DESC
        LIMIT 10000
      `;
      return res.status(200).json({ links: rows });
    }

    if (req.method === 'POST') {
      // Insert one link
      if (action === 'insert' && title !== undefined && magnet !== undefined) {
        const [r] = await db`
          INSERT INTO magnet_links (title, magnet)
          VALUES (${title}, ${magnet})
          RETURNING id, title, magnet, created_date, updated_date
        `;
        return res.status(200).json({ link: r });
      }

      // Insert many links (bookmarklet / paste)
      if (action === 'insertMany' && Array.isArray(items) && items.length > 0) {
        const results = [];
        let failed = 0;
        for (const item of items) {
          try {
            const [r] = await db`
              INSERT INTO magnet_links (title, magnet)
              VALUES (${item.title}, ${item.magnet})
              RETURNING id, title, magnet, created_date, updated_date
            `;
            results.push(r);
          } catch {
            failed++;
          }
        }
        return res.status(200).json({ links: results, saved: results.length, failed });
      }

      // Delete specific IDs
      if (action === 'delete' && Array.isArray(ids) && ids.length > 0) {
        const numIds = ids.map(Number);
        await db`DELETE FROM magnet_links WHERE id = ANY(${numIds})`;
        return res.status(200).json({ deleted: ids.length });
      }

      // Delete all
      if (action === 'deleteAll') {
        await db`DELETE FROM magnet_links`;
        return res.status(200).json({ deleted: true });
      }
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}

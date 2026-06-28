import type { MagnetLink } from '@/types/magnet';

const API = '/api/db';

function toLink(r: Record<string, unknown>): MagnetLink {
  return {
    id: String(r.id),
    title: String(r.title),
    magnet: String(r.magnet),
    created_date: String(r.created_date),
    updated_date: String(r.updated_date),
  };
}

async function call(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'API error');
  }
  return res.json();
}

export async function fetchLinks(): Promise<MagnetLink[]> {
  const data = await fetch(API).then((r) => r.json()) as { links: Record<string, unknown>[] };
  return data.links.map(toLink);
}

export async function insertLink(title: string, magnet: string): Promise<MagnetLink> {
  const data = await call({ action: 'insert', title, magnet }) as { link: Record<string, unknown> };
  return toLink(data.link);
}

export async function insertManyLinks(
  items: Array<{ title: string; magnet: string }>,
): Promise<MagnetLink[]> {
  if (!items.length) return [];
  const data = await call({ action: 'insertMany', items }) as { links: Record<string, unknown>[] };
  return data.links.map(toLink);
}

export async function deleteLinks(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await call({ action: 'delete', ids });
}

export async function deleteAllLinks(): Promise<void> {
  await call({ action: 'deleteAll' });
}

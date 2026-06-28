// Connection string is now a server-side env var (NEON_DATABASE_URL).
// These stubs exist only so existing imports don't break during migration.

export function getConnectionString(): string {
  return 'connected'; // truthy sentinel — actual connection is server-side
}

export function saveConnectionString(_cs: string): void {}
export function clearConnectionString(): void {}

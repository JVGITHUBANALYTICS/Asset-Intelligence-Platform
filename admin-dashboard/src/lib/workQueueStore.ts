const STORAGE_KEY = 'work_queue_asset_ids';

export function getQueuedAssetIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToQueue(ids: string[]): void {
  const existing = new Set(getQueuedAssetIds());
  for (const id of ids) existing.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
}

export function removeFromQueue(id: string): void {
  const ids = getQueuedAssetIds().filter((i) => i !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

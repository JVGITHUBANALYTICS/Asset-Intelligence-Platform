import type { Asset } from '../types';
import { mockAssets } from '../data/mockAssets';
import { apiGet } from './api';

export async function getAssets(): Promise<Asset[]> {
  return apiGet(mockAssets);
}

export async function getAssetById(id: string): Promise<Asset | undefined> {
  const assets = await getAssets();
  return assets.find((a) => a.id === id);
}

export async function searchAssets(query: string): Promise<Asset[]> {
  const assets = await getAssets();
  const lower = query.toLowerCase();
  return assets.filter(
    (a) =>
      a.id.toLowerCase().includes(lower) ||
      a.type.toLowerCase().includes(lower) ||
      a.location.toLowerCase().includes(lower) ||
      a.manufacturer.toLowerCase().includes(lower)
  );
}

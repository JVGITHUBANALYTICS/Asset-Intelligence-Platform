import { supabase } from '../lib/supabase';
import { USE_SUPABASE } from '../lib/config';
import { mapDbAssetToAsset } from '../lib/mappers';
import type { DbAsset } from '../lib/mappers';
import type { Asset } from '../types';

// --- Mock fallback ---
import { mockAssets } from '../data/mockAssets';

/**
 * Fetch all assets, with optional filters.
 */
export async function getAssets(filters?: {
  type?: string;
  voltageClass?: string;
  riskLevel?: string;
  search?: string;
}): Promise<Asset[]> {
  if (!USE_SUPABASE) return applyFilters(mockAssets, filters);

  let query = supabase.from('assets').select('*');

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters?.voltageClass && filters.voltageClass !== 'all') {
    query = query.eq('voltage_class', filters.voltageClass);
  }
  if (filters?.riskLevel && filters.riskLevel !== 'all') {
    query = query.eq('risk_level', filters.riskLevel);
  }

  const { data, error } = await query.returns<DbAsset[]>();

  if (error) {
    console.error('Failed to fetch assets:', error.message);
    return mockAssets; // graceful fallback
  }

  let assets = (data ?? []).map(mapDbAssetToAsset);

  // Client-side text search (Supabase free tier doesn't have full-text search)
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    assets = assets.filter(
      (a) =>
        a.id.toLowerCase().includes(term) ||
        a.type.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        a.manufacturer.toLowerCase().includes(term),
    );
  }

  return assets;
}

/**
 * Fetch a single asset by ID.
 */
export async function getAssetById(id: string): Promise<Asset | null> {
  if (!USE_SUPABASE) {
    return mockAssets.find((a) => a.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single<DbAsset>();

  if (error || !data) return null;
  return mapDbAssetToAsset(data);
}

// --- Helpers ---
function applyFilters(assets: Asset[], filters?: {
  type?: string;
  voltageClass?: string;
  riskLevel?: string;
  search?: string;
}): Asset[] {
  if (!filters) return assets;
  return assets.filter((a) => {
    if (filters.type && filters.type !== 'all' && a.type !== filters.type) return false;
    if (filters.voltageClass && filters.voltageClass !== 'all' && a.voltageClass !== filters.voltageClass) return false;
    if (filters.riskLevel && filters.riskLevel !== 'all' && a.riskLevel !== filters.riskLevel) return false;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      if (
        !a.id.toLowerCase().includes(term) &&
        !a.type.toLowerCase().includes(term) &&
        !a.location.toLowerCase().includes(term) &&
        !a.manufacturer.toLowerCase().includes(term)
      ) return false;
    }
    return true;
  });
}

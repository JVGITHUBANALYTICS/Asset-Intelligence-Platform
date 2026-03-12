import { supabase, sessionReady } from '../lib/supabase';
import { mapDbDGATestToDGATest } from '../lib/mappers';
import type { DbDGATest } from '../lib/mappers';
import type { DGATestResult } from '../types';

export async function getDGATests(): Promise<DGATestResult[]> {
  await sessionReady;
  const { data, error } = await supabase
    .from('dga_tests')
    .select('*')
    .limit(2000)
    .returns<DbDGATest[]>();

  if (error) {
    console.error('Failed to fetch DGA tests:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbDGATestToDGATest);
}

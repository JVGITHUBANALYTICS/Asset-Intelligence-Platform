import { supabase } from '../lib/supabase';
import { USE_SUPABASE } from '../lib/config';
import { mapDbDGATestToDGATest } from '../lib/mappers';
import type { DbDGATest } from '../lib/mappers';
import type { DGATestResult } from '../types';

import { mockDGATests } from '../data/mockDGATests';

export async function getDGATests(): Promise<DGATestResult[]> {
  if (!USE_SUPABASE) return mockDGATests;

  const { data, error } = await supabase
    .from('dga_tests')
    .select('*')
    .limit(2000)
    .returns<DbDGATest[]>();

  if (error) {
    console.error('Failed to fetch DGA tests:', error.message);
    return mockDGATests;
  }

  return (data ?? []).map(mapDbDGATestToDGATest);
}

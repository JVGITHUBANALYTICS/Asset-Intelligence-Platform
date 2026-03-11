import { supabase } from '../lib/supabase';
import { USE_SUPABASE } from '../lib/config';
import { mapDbInspectionToInspection } from '../lib/mappers';
import type { DbInspection } from '../lib/mappers';
import type { InspectionResult } from '../types';

import { mockInspections } from '../data/mockInspections';

export async function getInspections(): Promise<InspectionResult[]> {
  if (!USE_SUPABASE) return mockInspections;

  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .limit(2000)
    .returns<DbInspection[]>();

  if (error) {
    console.error('Failed to fetch inspections:', error.message);
    return mockInspections;
  }

  return (data ?? []).map(mapDbInspectionToInspection);
}

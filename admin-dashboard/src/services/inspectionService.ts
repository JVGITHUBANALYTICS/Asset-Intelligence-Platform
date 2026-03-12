import { supabase, sessionReady } from '../lib/supabase';
import { mapDbInspectionToInspection } from '../lib/mappers';
import type { DbInspection } from '../lib/mappers';
import type { InspectionResult } from '../types';

export async function getInspections(): Promise<InspectionResult[]> {
  await sessionReady;
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .limit(2000)
    .returns<DbInspection[]>();

  if (error) {
    console.error('Failed to fetch inspections:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbInspectionToInspection);
}

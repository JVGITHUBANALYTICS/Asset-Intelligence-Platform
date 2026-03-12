import { supabase, sessionReady } from '../lib/supabase';
import { mapDbHealthModelToHealthModel } from '../lib/mappers';
import type { DbHealthModel } from '../lib/mappers';
import type { HealthModel } from '../types';

export async function getHealthModels(): Promise<HealthModel[]> {
  await sessionReady;
  const { data, error } = await supabase
    .from('health_models')
    .select('*')
    .returns<DbHealthModel[]>();

  if (error) {
    console.error('Failed to fetch health models:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbHealthModelToHealthModel);
}

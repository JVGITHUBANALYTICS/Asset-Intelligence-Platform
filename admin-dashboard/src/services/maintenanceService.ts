import { supabase, sessionReady } from '../lib/supabase';
import { mapDbMaintenanceToMaintenance } from '../lib/mappers';
import type { DbMaintenance } from '../lib/mappers';
import type { MaintenanceRecord } from '../types';

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  await sessionReady;
  const { data, error } = await supabase
    .from('maintenance')
    .select('*')
    .limit(2000)
    .returns<DbMaintenance[]>();

  if (error) {
    console.error('Failed to fetch maintenance:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbMaintenanceToMaintenance);
}

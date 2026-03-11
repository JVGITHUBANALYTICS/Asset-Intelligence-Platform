import { supabase } from '../lib/supabase';
import { USE_SUPABASE } from '../lib/config';
import { mapDbMaintenanceToMaintenance } from '../lib/mappers';
import type { DbMaintenance } from '../lib/mappers';
import type { MaintenanceRecord } from '../types';

import { mockMaintenance } from '../data/mockMaintenance';

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  if (!USE_SUPABASE) return mockMaintenance;

  const { data, error } = await supabase
    .from('maintenance')
    .select('*')
    .limit(2000)
    .returns<DbMaintenance[]>();

  if (error) {
    console.error('Failed to fetch maintenance:', error.message);
    return mockMaintenance;
  }

  return (data ?? []).map(mapDbMaintenanceToMaintenance);
}

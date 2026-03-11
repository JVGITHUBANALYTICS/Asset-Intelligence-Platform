import { supabase } from '../lib/supabase';
import type { ActivityAlert } from '../types';

interface DbAlert {
  id: string;
  asset_id: string;
  type: string;
  message: string;
  severity: string;
  timestamp: string;
  read: boolean;
}

function mapDbAlert(row: DbAlert): ActivityAlert {
  return {
    id: row.id,
    assetId: row.asset_id,
    type: row.type as ActivityAlert['type'],
    message: row.message,
    severity: row.severity as ActivityAlert['severity'],
    timestamp: row.timestamp,
  };
}

export async function getAlerts(limit = 20): Promise<ActivityAlert[]> {
  const { data, error } = await supabase
    .from('activity_alerts')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)
    .returns<DbAlert[]>();

  if (error) {
    console.error('Failed to fetch alerts:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbAlert);
}

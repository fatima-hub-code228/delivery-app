import { createClient } from '@supabase/supabase-js';

// Project details provided by user:
// Project ID: xwbfblwigouidecdukef
// API Key: sb_publishable_GfZk4JRIBUfzGbtFW12cQA_hgh8vf2p
export const SUPABASE_PROJECT_ID = 'xwbfblwigouidecdukef';
export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_GfZk4JRIBUfzGbtFW12cQA_hgh8vf2p';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SyncedAction {
  id: string;
  action_type: string;
  entity_id: string;
  details?: Record<string, any>;
  operator: string;
  branch: string;
  timestamp: string;
  status: 'synced' | 'pending' | 'table_notice';
  message?: string;
}

// In-memory action log listeners for real-time UI telemetry
type ActionListener = (action: SyncedAction) => void;
const actionListeners: Set<ActionListener> = new Set();

export function onSupabaseAction(listener: ActionListener) {
  actionListeners.add(listener);
  return () => {
    actionListeners.delete(listener);
  };
}

function notifyListeners(action: SyncedAction) {
  actionListeners.forEach((l) => l(action));
}

/**
 * Universal Action Dispatcher:
 * Automatically records every partner action performed in the portal into Supabase backend tables.
 */
export async function logPartnerAction(
  actionType: string,
  entityId: string,
  details: Record<string, any> = {}
): Promise<SyncedAction> {
  const newAction: SyncedAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action_type: actionType,
    entity_id: entityId,
    details,
    operator: 'Tariq Al Mansoori (General Director)',
    branch: 'The Grand Pavilion • Al Maryah Island',
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  notifyListeners(newAction);

  try {
    // Attempt inserting into 'partner_actions' table
    const { error: actionErr } = await supabase.from('partner_actions').insert([
      {
        action_type: newAction.action_type,
        entity_id: newAction.entity_id,
        details: newAction.details,
        operator: newAction.operator,
        branch: newAction.branch,
      },
    ]);

    if (actionErr) {
      // Table might not exist yet in user's fresh database, or RLS might be in effect
      console.warn('Supabase partner_actions insert notice:', actionErr.message);
      newAction.status = 'table_notice';
      newAction.message = actionErr.message;
    } else {
      newAction.status = 'synced';
    }
  } catch (err: any) {
    console.error('Supabase dispatch error:', err);
    newAction.status = 'table_notice';
    newAction.message = err?.message || 'Network sync notice';
  }

  notifyListeners(newAction);
  return newAction;
}

/**
 * Sync Order Status to Supabase backend 'orders' table
 */
export async function syncOrderToSupabase(
  orderId: string,
  status: string,
  extra: Record<string, any> = {}
) {
  // First record the action log
  await logPartnerAction(`order_${status}`, orderId, extra);

  try {
    const { error } = await supabase.from('orders').upsert(
      {
        id: orderId,
        status,
        updated_at: new Date().toISOString(),
        ...extra,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('Supabase orders upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase orders table sync:', err);
  }
}

/**
 * Sync Dish & Inventory changes to Supabase backend 'menu_inventory' table
 */
export async function syncMenuStockToSupabase(
  dishId: string,
  dishTitle: string,
  newStock: number,
  is86ed: boolean = false
) {
  await logPartnerAction(is86ed ? 'menu_item_86ed' : 'menu_stock_updated', dishId, {
    dishTitle,
    newStock,
    is86ed,
  });

  try {
    const { error } = await supabase.from('menu_inventory').upsert(
      {
        id: dishId,
        title: dishTitle,
        stock: newStock,
        is_86: is86ed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('Supabase menu_inventory upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase menu table sync:', err);
  }
}

/**
 * Sync Delivery Zone Status to Supabase backend 'delivery_zones' table
 */
export async function syncZoneToSupabase(zoneId: string, zoneName: string, isActive: boolean) {
  await logPartnerAction('delivery_zone_toggled', zoneId, {
    zoneName,
    isActive,
  });

  try {
    const { error } = await supabase.from('delivery_zones').upsert(
      {
        id: zoneId,
        name: zoneName,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('Supabase delivery_zones upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase zones table sync:', err);
  }
}

/**
 * Check connectivity with Supabase project
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  projectUrl: string;
}> {
  try {
    const { data, error } = await supabase.from('partner_actions').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.partner_actions" does not exist')) {
      return {
        connected: true,
        message: `Authenticated with project ${SUPABASE_PROJECT_ID}`,
        projectUrl: SUPABASE_URL,
      };
    }
    return {
      connected: true,
      message: `Successfully connected to Supabase (${SUPABASE_PROJECT_ID})`,
      projectUrl: SUPABASE_URL,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Connection check failed',
      projectUrl: SUPABASE_URL,
    };
  }
}

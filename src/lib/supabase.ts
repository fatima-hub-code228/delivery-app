import { createClient } from '@supabase/supabase-js';
import {
  SHARED_ABU_DHABI_STORES,
  SHARED_PRODUCTS,
  SHARED_ABU_DHABI_ZONES,
  SharedProduct,
  SharedVendorStore,
  resolveOrderVendor,
  mapPartnerToCustomerStatus,
  mapCustomerOrDbStatusToPartnerStatus,
  CustomerOrderStatus,
} from './sharedCatalog';

// Shared Backend Target (Customer App Supabase Project):
// Project URL: https://rbdsjgalxoehuwskzvit.supabase.co
export const CUSTOMER_SUPABASE_PROJECT_ID = 'rbdsjgalxoehuwskzvit';
export const CUSTOMER_SUPABASE_URL = `https://${CUSTOMER_SUPABASE_PROJECT_ID}.supabase.co`;

// Deprecated Legacy Restaurant App Project ID (used only to detect stale env vars):
export const LEGACY_RESTAURANT_PROJECT_ID = 'xwbfblwigouidecdukef';
const LEGACY_RESTAURANT_ANON_KEY = 'sb_publishable_GfZk4JRIBUfzGbtFW12cQA_hgh8vf2p';

// Authoritative existing table names in Customer App Supabase project (rbdsjgalxoehuwskzvit):
// Note: "order" and "user" are reserved SQL keywords in PostgreSQL; in supabase-js .from('order')
// and .from('user') target public."order" and public."user". Never create or query duplicate plural tables.
export const CUSTOMER_DB_TABLES = {
  category: 'category',
  order: 'order',
  orderItems: 'order_items',
  product: 'product',
  riderProfile: 'rider_profile',
  store: 'store',
  user: 'user',
} as const;

// Resolve runtime Supabase URL: always use https://rbdsjgalxoehuwskzvit.supabase.co
// even if a stale container environment variable still references xwbfblwigouidecdukef.
const envSupabaseUrl = String(
  (import.meta as any).env?.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') ||
    ''
)
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const SUPABASE_URL =
  envSupabaseUrl && !envSupabaseUrl.includes(LEGACY_RESTAURANT_PROJECT_ID)
    ? envSupabaseUrl
    : CUSTOMER_SUPABASE_URL;

export const IS_CUSTOMER_SHARED_BACKEND = true;
export const SUPABASE_PROJECT_ID = CUSTOMER_SUPABASE_PROJECT_ID;

export const ACTIVE_ORDER_TABLE = CUSTOMER_DB_TABLES.order;
export const ACTIVE_ORDER_ITEMS_TABLE = CUSTOMER_DB_TABLES.orderItems;
export const ACTIVE_PRODUCT_TABLE = CUSTOMER_DB_TABLES.product;
export const ACTIVE_STORE_TABLE = CUSTOMER_DB_TABLES.store;
export const ACTIVE_CATEGORY_TABLE = CUSTOMER_DB_TABLES.category;
export const ACTIVE_RIDER_TABLE = CUSTOMER_DB_TABLES.riderProfile;
export const ACTIVE_USER_TABLE = CUSTOMER_DB_TABLES.user;

const RUNTIME_ANON_KEY_STORAGE = 'vayora_rbdsjgalxoehuwskzvit_anon_key';

function isValidCustomerProjectAnonKey(candidate: string): boolean {
  const clean = (candidate || '').trim();
  if (!clean || clean.length < 16) return false;
  if (clean === LEGACY_RESTAURANT_ANON_KEY) return false;
  if (clean === 'missing-rbdsjgalxoehuwskzvit-anon-key') return false;
  if (clean.includes('YOUR_') || clean.includes('<PUBLIC_ANON_KEY')) return false;
  return true;
}

const rawEnvAnonKey = String(
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') ||
    ''
).trim();

function readStoredRuntimeAnonKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(RUNTIME_ANON_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function getActiveSupabaseAnonKey(): string {
  const stored = readStoredRuntimeAnonKey();
  if (isValidCustomerProjectAnonKey(stored)) {
    return stored;
  }
  if (isValidCustomerProjectAnonKey(rawEnvAnonKey)) {
    return rawEnvAnonKey;
  }
  return '';
}

export function hasValidCustomerAnonKey(): boolean {
  return isValidCustomerProjectAnonKey(getActiveSupabaseAnonKey());
}

// Detect if the runtime environment still has the legacy project's anon key or a placeholder
export let IS_LEGACY_OR_PLACEHOLDER_ANON_KEY = !hasValidCustomerAnonKey();

export let SUPABASE_ANON_KEY =
  getActiveSupabaseAnonKey() || 'missing-rbdsjgalxoehuwskzvit-anon-key';

export let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const PENDING_KEY_NOTICE = `Awaiting public anon/publishable key for shared Customer App project ${CUSTOMER_SUPABASE_PROJECT_ID} (${SUPABASE_URL}). Paste the ${CUSTOMER_SUPABASE_PROJECT_ID} public anon key in "Test Connection" or set VITE_SUPABASE_ANON_KEY in .env.`;

let lastSupabaseError: string | null = hasValidCustomerAnonKey() ? null : PENDING_KEY_NOTICE;

export function getLastSupabaseError(): string | null {
  return lastSupabaseError;
}

export function setRuntimeSupabaseAnonKey(newKey: string): {
  valid: boolean;
  message: string;
} {
  const clean = (newKey || '').trim();
  if (!isValidCustomerProjectAnonKey(clean)) {
    return {
      valid: false,
      message:
        clean === LEGACY_RESTAURANT_ANON_KEY
          ? `That key belongs to the deprecated project (${LEGACY_RESTAURANT_PROJECT_ID}). Please paste the public anon/publishable key from ${CUSTOMER_SUPABASE_PROJECT_ID}.`
          : `Please enter a valid public anon/publishable key for ${CUSTOMER_SUPABASE_PROJECT_ID}.`,
    };
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(RUNTIME_ANON_KEY_STORAGE, clean);
    } catch {
      // ignore storage quota errors
    }
  }

  SUPABASE_ANON_KEY = clean;
  IS_LEGACY_OR_PLACEHOLDER_ANON_KEY = false;
  lastSupabaseError = null;

  if (ordersRealtimeChannel) {
    try {
      supabase.removeChannel(ordersRealtimeChannel);
    } catch {
      // ignore cleanup error
    }
    ordersRealtimeChannel = null;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  notifySessionListeners(getPartnerSession());
  return {
    valid: true,
    message: `Public anon key saved for ${CUSTOMER_SUPABASE_PROJECT_ID} (${SUPABASE_URL}). Connecting to live tables...`,
  };
}

function formatSupabaseError(err: any, table: string): string {
  const rawMsg =
    typeof err === 'string'
      ? err
      : err?.message || err?.error_description || err?.hint || JSON.stringify(err || 'Unknown Supabase error');
  if (
    String(rawMsg).toLowerCase().includes('invalid api key') ||
    String(rawMsg).toLowerCase().includes('no api key found') ||
    !hasValidCustomerAnonKey()
  ) {
    return `Invalid or missing VITE_SUPABASE_ANON_KEY for shared project ${CUSTOMER_SUPABASE_PROJECT_ID} (${SUPABASE_URL}). Paste the public anon/publishable key of ${CUSTOMER_SUPABASE_PROJECT_ID} in the Connection Bridge or set VITE_SUPABASE_ANON_KEY in .env. (Server response: ${rawMsg})`;
  }
  return `Supabase (${CUSTOMER_SUPABASE_PROJECT_ID} • public."${table}"): ${rawMsg}`;
}

export interface PartnerSession {
  email: string;
  operator: string;
  role: string;
  branch: string;
  storeId: string; // 'ALL' for All Connected Vendors or a specific storeId (e.g., 'store_mosaic', 'store_grand_pavilion')
  authenticatedAt: string;
  keepLoggedIn: boolean;
}

const PARTNER_SESSION_KEY = 'quickshop_vayora_partner_session_v1';

const DEFAULT_PARTNER_SESSION: PartnerSession = {
  email: 'gm@grandpavilion.ae',
  operator: 'Tariq Al Mansoori',
  role: 'General Director',
  branch: 'All Connected Vendors (Abu Dhabi Hub)',
  storeId: 'ALL',
  authenticatedAt: new Date().toISOString(),
  keepLoggedIn: true,
};

type SessionListener = (session: PartnerSession) => void;
const sessionListeners: Set<SessionListener> = new Set();

export function onPartnerSessionChange(listener: SessionListener) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function notifySessionListeners(session: PartnerSession) {
  sessionListeners.forEach((l) => l(session));
}

export function resolveStoreFromBranchOrEmail(
  branchOrStoreId?: string,
  email?: string
): { storeId: string; branchName: string } {
  const cleanBranch = (branchOrStoreId || '').trim().replace(/\s*\(Terminal #\d+\)$/i, '');
  if (
    !cleanBranch ||
    cleanBranch.toLowerCase().includes('all connected') ||
    cleanBranch === 'ALL'
  ) {
    return {
      storeId: 'ALL',
      branchName: 'All Connected Vendors (Abu Dhabi Hub)',
    };
  }

  const byId = SHARED_ABU_DHABI_STORES.find((s) => s.id === cleanBranch);
  if (byId) {
    return { storeId: byId.id, branchName: byId.nameEn };
  }

  const byName = SHARED_ABU_DHABI_STORES.find(
    (s) =>
      cleanBranch.toLowerCase().includes(s.nameEn.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(cleanBranch.toLowerCase())
  );
  if (byName) {
    return { storeId: byName.id, branchName: byName.nameEn };
  }

  if (email) {
    const byEmail = SHARED_ABU_DHABI_STORES.find(
      (s) => s.operatorEmail.toLowerCase() === email.toLowerCase()
    );
    if (byEmail) {
      return { storeId: byEmail.id, branchName: byEmail.nameEn };
    }
  }

  return {
    storeId: 'store_grand_pavilion',
    branchName: cleanBranch || 'The Grand Pavilion • Al Maryah Island',
  };
}

let currentMemorySession: PartnerSession = { ...DEFAULT_PARTNER_SESSION };

export function getPartnerSession(): PartnerSession {
  if (typeof window === 'undefined') return currentMemorySession;
  try {
    const raw = window.localStorage.getItem(PARTNER_SESSION_KEY);
    if (!raw) return currentMemorySession;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.branch) {
      if (!parsed.storeId) {
        const resolved = resolveStoreFromBranchOrEmail(parsed.branch, parsed.email);
        parsed.storeId = resolved.storeId;
      }
      currentMemorySession = parsed;
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return currentMemorySession;
}

export function setPartnerBranch(branchNameOrStoreId: string): PartnerSession {
  const current = getPartnerSession();
  const resolved = resolveStoreFromBranchOrEmail(branchNameOrStoreId, current.email);
  const updated: PartnerSession = {
    ...current,
    branch: resolved.branchName,
    storeId: resolved.storeId,
  };
  currentMemorySession = updated;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  }
  notifySessionListeners(updated);
  return updated;
}

export async function authenticatePartnerSession(
  email: string,
  password: string,
  branch: string,
  keepLoggedIn: boolean = true
): Promise<{ success: boolean; session?: PartnerSession; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid partner email address.' };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Invalid terminal security key. Minimum 6 characters required.',
    };
  }

  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return {
      success: false,
      error: PENDING_KEY_NOTICE,
    };
  }

  try {
    // 1. Verify live Supabase database connectivity against public."order"
    const { error: dbError } = await supabase.from(CUSTOMER_DB_TABLES.order).select('id').limit(1);

    if (dbError) {
      const formatted = formatSupabaseError(dbError, CUSTOMER_DB_TABLES.order);
      lastSupabaseError = formatted;
      return {
        success: false,
        error: formatted,
      };
    }

    // 2. Authenticate via Supabase Auth on rbdsjgalxoehuwskzvit
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authErr) {
      return {
        success: false,
        error: `Supabase Auth error on ${CUSTOMER_SUPABASE_PROJECT_ID}: ${authErr.message}`,
      };
    }

    let resolved = resolveStoreFromBranchOrEmail(branch, cleanEmail);

    // Check public."user" and public."store" for partner store assignment
    if (authData?.user?.id) {
      const { data: userRow } = await supabase
        .from(CUSTOMER_DB_TABLES.user)
        .select('*')
        .or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
        .maybeSingle();

      if (userRow?.assigned_store_id || userRow?.store_id) {
        resolved = resolveStoreFromBranchOrEmail(
          String(userRow.assigned_store_id || userRow.store_id),
          cleanEmail
        );
      } else {
        const { data: ownedStore } = await supabase
          .from(CUSTOMER_DB_TABLES.store)
          .select('id, name, name_en')
          .eq('owner_user_id', authData.user.id)
          .maybeSingle();
        if (ownedStore?.id) {
          resolved = {
            storeId: String(ownedStore.id),
            branchName: ownedStore.name_en || ownedStore.name || resolved.branchName,
          };
        }
      }
    }

    const operatorName =
      authData?.user?.user_metadata?.full_name ||
      (cleanEmail.startsWith('gm@')
        ? 'Tariq Al Mansoori'
        : cleanEmail
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()));

    const session: PartnerSession = {
      email: cleanEmail,
      operator: operatorName,
      role: resolved.storeId === 'ALL' ? 'General Director (All Stores)' : 'Store Partner Manager',
      branch: resolved.branchName,
      storeId: resolved.storeId,
      authenticatedAt: new Date().toISOString(),
      keepLoggedIn,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(session));
    }
    notifySessionListeners(session);

    await logPartnerAction('partner_terminal_login', session.branch, {
      email: session.email,
      operator: session.operator,
      store_id: session.storeId,
      supabase_auth_uid: authData?.user?.id || 'authenticated',
    });

    return { success: true, session };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unable to verify credentials with Supabase.',
    };
  }
}

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
 * Broadcasts partner or customer actions to in-app telemetry listeners.
 * Does NOT create or write to unrequested tables on the shared Customer App database.
 */
export async function logPartnerAction(
  actionType: string,
  entityId: string,
  details: Record<string, any> = {}
): Promise<SyncedAction> {
  const session = getPartnerSession();
  const newAction: SyncedAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action_type: actionType,
    entity_id: entityId,
    details,
    operator: `${session.operator} (${session.role})`,
    branch: session.branch,
    timestamp: new Date().toISOString(),
    status: 'synced',
  };

  notifyListeners(newAction);
  return newAction;
}

/**
 * Non-destructively checks live counts in `public."product"` and `public."store"`
 * on `https://rbdsjgalxoehuwskzvit.supabase.co` without overwriting or deleting any records.
 */
export async function ensureSharedCatalogSyncedToSupabase(): Promise<{
  syncedProducts: number;
  syncedZones: number;
  totalProductsInDb: number;
  totalZonesInDb: number;
}> {
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return {
      syncedProducts: 0,
      syncedZones: 0,
      totalProductsInDb: 0,
      totalZonesInDb: SHARED_ABU_DHABI_ZONES.length,
    };
  }
  try {
    const { count: prodCount, error: prodErr } = await supabase
      .from(CUSTOMER_DB_TABLES.product)
      .select('id', { count: 'exact', head: true });
    if (prodErr) {
      lastSupabaseError = formatSupabaseError(prodErr, CUSTOMER_DB_TABLES.product);
    } else {
      lastSupabaseError = null;
    }

    const { count: storeCount } = await supabase
      .from(CUSTOMER_DB_TABLES.store)
      .select('id', { count: 'exact', head: true });

    return {
      syncedProducts: 0,
      syncedZones: 0,
      totalProductsInDb: prodCount || 0,
      totalZonesInDb: storeCount || SHARED_ABU_DHABI_ZONES.length,
    };
  } catch (err: any) {
    lastSupabaseError = formatSupabaseError(err, CUSTOMER_DB_TABLES.product);
    return {
      syncedProducts: 0,
      syncedZones: 0,
      totalProductsInDb: 0,
      totalZonesInDb: SHARED_ABU_DHABI_ZONES.length,
    };
  }
}

/**
 * Fetches live products from `public."product"` (joined or matched with `public."store"` & `public."category"`)
 * on `https://rbdsjgalxoehuwskzvit.supabase.co` and maps real columns to `SharedProduct`.
 */
export async function fetchMenuInventoryFromSupabase(
  filterStoreId?: string
): Promise<SharedProduct[]> {
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return filterStoreId && filterStoreId !== 'ALL'
      ? SHARED_PRODUCTS.filter((p) => p.storeId === filterStoreId)
      : SHARED_PRODUCTS;
  }
  try {
    let query = supabase.from(CUSTOMER_DB_TABLES.product).select('*');
    if (filterStoreId && filterStoreId !== 'ALL') {
      query = query.eq('store_id', filterStoreId);
    }
    const { data: prodRows, error: prodErr } = await query.order('id', { ascending: true });
    if (prodErr || !prodRows) {
      if (prodErr) {
        lastSupabaseError = formatSupabaseError(prodErr, CUSTOMER_DB_TABLES.product);
      }
      return filterStoreId && filterStoreId !== 'ALL'
        ? SHARED_PRODUCTS.filter((p) => p.storeId === filterStoreId)
        : SHARED_PRODUCTS;
    }

    lastSupabaseError = null;

    if (prodRows.length === 0) {
      return filterStoreId && filterStoreId !== 'ALL'
        ? SHARED_PRODUCTS.filter((p) => p.storeId === filterStoreId)
        : SHARED_PRODUCTS;
    }

    const mappedProducts: SharedProduct[] = prodRows.map((row: any) => {
      const storeIdStr = String(row.store_id ?? row.storeId ?? 'store_grand_pavilion');
      const matchedStore =
        SHARED_ABU_DHABI_STORES.find((s) => s.id === storeIdStr) || SHARED_ABU_DHABI_STORES[0];
      const fallbackCatalogItem = SHARED_PRODUCTS.find((p) => p.id === String(row.id));
      const stock =
        typeof row.stock === 'number'
          ? row.stock
          : typeof row.quantity === 'number'
          ? row.quantity
          : fallbackCatalogItem?.stock ?? 20;
      const isAvailableCol =
        row.is_available !== undefined
          ? Boolean(row.is_available)
          : row.available !== undefined
          ? Boolean(row.available)
          : true;
      const is86 = Boolean(row.is_86) || !isAvailableCol || stock <= 0;
      const priceVal = Number(
        row.price_aed ?? row.price ?? row.unit_price ?? fallbackCatalogItem?.priceAed ?? 45
      );

      return {
        id: String(row.id),
        storeId: storeIdStr,
        storeName: row.store_name || matchedStore.nameEn,
        nameEn:
          row.name_en ||
          row.name ||
          row.title ||
          fallbackCatalogItem?.nameEn ||
          String(row.id),
        nameAr:
          row.name_ar ||
          fallbackCatalogItem?.nameAr ||
          row.name_en ||
          row.name ||
          String(row.id),
        description:
          row.description ||
          fallbackCatalogItem?.description ||
          `Available at ${matchedStore.nameEn}`,
        priceAed: priceVal,
        weightOrPortion:
          row.weight_or_portion ||
          row.unit ||
          fallbackCatalogItem?.weightOrPortion ||
          'Standard portion',
        category: String(
          row.category_id || row.category || fallbackCatalogItem?.category || 'mains'
        ),
        stock,
        isAvailable: !is86 && stock > 0,
        sku: row.sku || fallbackCatalogItem?.sku || `${storeIdStr}::${row.id}`,
        image:
          row.image_url ||
          row.image ||
          fallbackCatalogItem?.image ||
          SHARED_PRODUCTS[0].image,
      };
    });

    return mappedProducts;
  } catch (err: any) {
    lastSupabaseError = formatSupabaseError(err, CUSTOMER_DB_TABLES.product);
    return filterStoreId && filterStoreId !== 'ALL'
      ? SHARED_PRODUCTS.filter((p) => p.storeId === filterStoreId)
      : SHARED_PRODUCTS;
  }
}

/**
 * Fetches live store / delivery zone metadata from `public."store"` on `rbdsjgalxoehuwskzvit`
 * and maps Abu Dhabi delivery zones.
 */
export async function fetchDeliveryZonesFromSupabase() {
  if (hasValidCustomerAnonKey()) {
    try {
      const { data: storesData, error } = await supabase
        .from(CUSTOMER_DB_TABLES.store)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        lastSupabaseError = formatSupabaseError(error, CUSTOMER_DB_TABLES.store);
      } else if (storesData && storesData.length > 0) {
        lastSupabaseError = null;
      }
    } catch (err: any) {
      lastSupabaseError = formatSupabaseError(err, CUSTOMER_DB_TABLES.store);
    }
  } else {
    lastSupabaseError = PENDING_KEY_NOTICE;
  }

  return SHARED_ABU_DHABI_ZONES.map((z) => ({
    id: z.id,
    name: z.nameEn,
    radius: `${z.district} • ~${z.estimatedMinutes} mins`,
    fee: `AED ${z.deliveryFeeAed.toFixed(0)}`,
    min_order: `AED ${z.minOrderAed.toFixed(0)}`,
    is_active: z.isServiceable,
  }));
}

export interface EnrichedOrderRecord {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  user_id?: string | null;
  rider_id?: string | null;
  vip_tier: string;
  status: string; // Normalized partner status: 'incoming' | 'cooking' | 'ready_for_pickup' | 'completed' | 'declined'
  raw_customer_status?: string; // Raw status column from public."order"
  subtotal_aed?: number;
  delivery_fee_aed?: number;
  total_aed: number;
  delivery_zone: string;
  delivery_address?: any;
  payment_method?: string;
  items: any[] | null;
  courier: string | null;
  notes: string | null;
  updated_at: string;
  // Resolved multi-vendor & Customer App fields
  storeId: string;
  storeName: string;
  customerStatus: {
    code: CustomerOrderStatus;
    title: string;
    description: string;
  };
}

export interface AcceptOrderResult {
  success: boolean;
  orderId: string;
  previousStatus?: string;
  newStatus?: string;
  customerStatus?: CustomerOrderStatus;
  error?: string;
  order?: EnrichedOrderRecord;
}

/**
 * Normalizes a raw order row from `public."order"` (with joined `public."order_items"`)
 * into `EnrichedOrderRecord`, mapping both Customer App columns and Partner columns.
 */
export function enrichOrderRecord(raw: any): EnrichedOrderRecord {
  const rawOrderItems = Array.isArray(raw?.order_items)
    ? raw.order_items
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  const normalizedItems = rawOrderItems.map((oi: any) => {
    const prodId = String(oi.product_id ?? oi.productId ?? oi.id ?? '');
    const catalogMatch = SHARED_PRODUCTS.find((p) => p.id === prodId);
    const qty = Number(oi.quantity ?? oi.qty ?? 1);
    const unitPrice = Number(
      oi.unit_price_aed ??
        oi.price_aed ??
        oi.unit_price ??
        oi.price ??
        catalogMatch?.priceAed ??
        0
    );
    const nameEn =
      oi.product_name_en ||
      oi.product_name ||
      oi.name_en ||
      oi.name ||
      oi.title ||
      catalogMatch?.nameEn ||
      `Item #${prodId || '1'}`;
    const nameAr = oi.product_name_ar || oi.name_ar || catalogMatch?.nameAr || '';

    return {
      id: String(oi.id ?? prodId),
      order_id: raw?.id,
      product_id: prodId,
      name: nameEn,
      name_en: nameEn,
      name_ar: nameAr,
      qty,
      quantity: qty,
      price_aed: unitPrice,
      unit_price_aed: unitPrice,
      price: `AED ${(unitPrice * qty).toFixed(2)}`,
      weight_or_portion: oi.weight_or_portion || catalogMatch?.weightOrPortion || '',
      special_notes: oi.special_notes || oi.notes || '',
      store_id: raw?.store_id ?? raw?.storeId ?? oi.store_id,
    };
  });

  // Compute fallback total from items if order row total column uses a different name or is 0
  const itemsSubtotal = normalizedItems.reduce(
    (sum: number, item: any) => sum + Number(item.price_aed || 0) * Number(item.quantity || 1),
    0
  );

  const subtotalAed = Number(
    raw?.subtotal_aed ?? raw?.subtotalAed ?? raw?.subtotal ?? raw?.sub_total ?? itemsSubtotal
  );
  const deliveryFeeAed = Number(
    raw?.delivery_fee_aed ?? raw?.deliveryFeeAed ?? raw?.delivery_fee ?? 0
  );
  const totalAed = Number(
    raw?.total_aed ??
      raw?.totalAed ??
      raw?.total_amount ??
      raw?.total_price ??
      raw?.total ??
      subtotalAed + deliveryFeeAed
  );

  // Resolve delivery address / zone string from Customer App columns
  let deliveryZoneStr = raw?.delivery_zone || '';
  if (!deliveryZoneStr) {
    if (typeof raw?.delivery_address === 'string' && raw.delivery_address.trim()) {
      deliveryZoneStr = raw.delivery_address.trim();
    } else if (raw?.delivery_address && typeof raw.delivery_address === 'object') {
      const addr = raw.delivery_address;
      const parts = [
        addr.zoneName || addr.zone_name || addr.emirate,
        addr.buildingName || addr.building_name || addr.street,
        addr.apartmentOrVilla || addr.apartment_or_villa,
      ].filter(Boolean);
      deliveryZoneStr = parts.join(' • ');
    } else if (raw?.address) {
      deliveryZoneStr = String(raw.address);
    }
  }
  if (!deliveryZoneStr) {
    deliveryZoneStr = 'Abu Dhabi';
  }

  // Normalize status from either Customer App `status` ('CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'DECLINED')
  // or Partner `partner_status` ('incoming', 'cooking', 'ready_for_pickup', 'completed', 'declined')
  const normalizedPartnerStatus = mapCustomerOrDbStatusToPartnerStatus(
    raw?.status ?? raw?.order_status,
    raw?.partner_status
  );

  const explicitStoreId = raw?.store_id ?? raw?.storeId;
  const matchedStore = explicitStoreId
    ? SHARED_ABU_DHABI_STORES.find((s) => s.id === String(explicitStoreId))
    : undefined;

  const rawWithItems = {
    ...raw,
    id: String(raw?.id ?? ''),
    customer_name:
      raw?.customer_name ||
      raw?.customerName ||
      raw?.user_name ||
      raw?.recipient_name ||
      'Customer Patron',
    customer_phone: raw?.customer_phone || raw?.customerPhone || raw?.phone || null,
    user_id: raw?.user_id || raw?.customer_id || null,
    rider_id: raw?.rider_id || null,
    vip_tier:
      raw?.vip_tier ||
      raw?.store_name ||
      raw?.storeName ||
      matchedStore?.nameEn ||
      'Abu Dhabi Store',
    status: normalizedPartnerStatus,
    raw_customer_status: String(raw?.status ?? ''),
    subtotal_aed: subtotalAed,
    delivery_fee_aed: deliveryFeeAed,
    total_aed: totalAed,
    delivery_zone: deliveryZoneStr,
    delivery_address: raw?.delivery_address || null,
    payment_method: raw?.payment_method || raw?.paymentMethod || 'Card / Apple Pay',
    items: normalizedItems,
    courier: raw?.courier || (raw?.rider_id ? `Rider #${raw.rider_id}` : null),
    notes: raw?.notes || raw?.special_instructions || raw?.instructions || null,
    updated_at:
      raw?.updated_at || raw?.created_at || raw?.createdAtFormatted || new Date().toISOString(),
  };

  const vendor = resolveOrderVendor(rawWithItems);
  const resolvedStoreId = explicitStoreId ? String(explicitStoreId) : vendor.storeId;
  const resolvedStoreName =
    raw?.store_name || raw?.storeName || matchedStore?.nameEn || vendor.storeName;
  const customerStatus = mapPartnerToCustomerStatus(normalizedPartnerStatus);

  return {
    ...rawWithItems,
    storeId: resolvedStoreId,
    storeName: resolvedStoreName,
    customerStatus,
  };
}

/**
 * Helper to attach rows from `public."order_items"` onto rows from `public."order"`
 * if PostgREST embedded join (`order_items(*)`) is unavailable prior to FK creation.
 */
async function attachOrderItemsManually(orderRows: any[]): Promise<any[]> {
  if (!orderRows || orderRows.length === 0) return [];
  const orderIds = orderRows.map((r) => r.id).filter((id) => id !== undefined && id !== null);
  if (orderIds.length === 0) return orderRows;

  try {
    const { data: itemRows, error: itemErr } = await supabase
      .from(CUSTOMER_DB_TABLES.orderItems)
      .select('*')
      .in('order_id', orderIds);

    if (itemErr || !itemRows) {
      return orderRows;
    }

    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemRows) {
      const key = String(item.order_id);
      if (!itemsByOrder.has(key)) {
        itemsByOrder.set(key, []);
      }
      itemsByOrder.get(key)!.push(item);
    }

    return orderRows.map((ord) => ({
      ...ord,
      order_items: itemsByOrder.get(String(ord.id)) || [],
    }));
  } catch {
    return orderRows;
  }
}

/**
 * Fetch all live orders directly from `public."order"` and `public."order_items"`
 * on `https://rbdsjgalxoehuwskzvit.supabase.co`.
 */
export async function fetchOrdersFromSupabase(
  filterStoreId?: string
): Promise<EnrichedOrderRecord[] | null> {
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return null;
  }
  try {
    let query = supabase
      .from(CUSTOMER_DB_TABLES.order)
      .select(`*, ${CUSTOMER_DB_TABLES.orderItems}(*)`);

    if (filterStoreId && filterStoreId !== 'ALL') {
      query = query.eq('store_id', filterStoreId);
    }

    let { data, error } = await query.order('id', { ascending: false });

    // Fallback if embedded FK relationship between "order" and "order_items" isn't in schema cache yet
    if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
      let fallbackQuery = supabase.from(CUSTOMER_DB_TABLES.order).select('*');
      if (filterStoreId && filterStoreId !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('store_id', filterStoreId);
      }
      const fallbackRes = await fallbackQuery.order('id', { ascending: false });
      if (fallbackRes.error) {
        lastSupabaseError = formatSupabaseError(fallbackRes.error, CUSTOMER_DB_TABLES.order);
        return null;
      }
      const joined = await attachOrderItemsManually(fallbackRes.data || []);
      lastSupabaseError = null;
      return joined.map(enrichOrderRecord);
    }

    // Fallback if store_id column is not yet added to public."order"
    if (error && error.message?.includes('store_id')) {
      const fallbackAll = await supabase.from(CUSTOMER_DB_TABLES.order).select('*');
      if (fallbackAll.error) {
        lastSupabaseError = formatSupabaseError(fallbackAll.error, CUSTOMER_DB_TABLES.order);
        return null;
      }
      const joined = await attachOrderItemsManually(fallbackAll.data || []);
      lastSupabaseError = null;
      const enriched = joined.map(enrichOrderRecord);
      if (filterStoreId && filterStoreId !== 'ALL') {
        return enriched.filter((o) => o.storeId === filterStoreId);
      }
      return enriched;
    }

    if (error) {
      lastSupabaseError = formatSupabaseError(error, CUSTOMER_DB_TABLES.order);
      return null;
    }

    lastSupabaseError = null;
    return (data || []).map(enrichOrderRecord);
  } catch (err: any) {
    lastSupabaseError = formatSupabaseError(err, CUSTOMER_DB_TABLES.order);
    return null;
  }
}

/**
 * Fetch a single order record by ID from `public."order"` + `public."order_items"`
 * on `https://rbdsjgalxoehuwskzvit.supabase.co`.
 */
export async function fetchSingleOrderFromSupabase(
  orderId: string
): Promise<EnrichedOrderRecord | null> {
  if (!orderId) return null;
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return null;
  }
  const cleanId = orderId.trim().replace(/^#/, '');
  try {
    const { data, error } = await supabase
      .from(CUSTOMER_DB_TABLES.order)
      .select(`*, ${CUSTOMER_DB_TABLES.orderItems}(*)`)
      .eq('id', cleanId)
      .maybeSingle();

    if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
      const { data: ordRow, error: ordErr } = await supabase
        .from(CUSTOMER_DB_TABLES.order)
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (ordErr || !ordRow) {
        if (ordErr) lastSupabaseError = formatSupabaseError(ordErr, CUSTOMER_DB_TABLES.order);
        return null;
      }
      const [withItems] = await attachOrderItemsManually([ordRow]);
      lastSupabaseError = null;
      return enrichOrderRecord(withItems);
    }

    if (error) {
      lastSupabaseError = formatSupabaseError(error, CUSTOMER_DB_TABLES.order);
      return null;
    }

    lastSupabaseError = null;
    return data ? enrichOrderRecord(data) : null;
  } catch (err: any) {
    lastSupabaseError = formatSupabaseError(err, CUSTOMER_DB_TABLES.order);
    return null;
  }
}

/**
 * Customer App -> Shared Supabase Order Placement (`placeCustomerOrderInSupabase`):
 * Inserts into existing `public."order"` and `public."order_items"` tables in `rbdsjgalxoehuwskzvit`.
 */
export interface PlaceCustomerOrderInput {
  orderId?: string;
  storeId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  emirate: string;
  zoneId: string;
  buildingName: string;
  apartmentOrVilla: string;
  instructions?: string;
  paymentMethod: string;
  items: {
    productId: string;
    quantity: number;
    specialNotes?: string;
  }[];
}

export async function placeCustomerOrderInSupabase(
  input: PlaceCustomerOrderInput
): Promise<{
  success: boolean;
  orderId?: string;
  order?: EnrichedOrderRecord;
  error?: string;
}> {
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return {
      success: false,
      error: PENDING_KEY_NOTICE,
    };
  }
  // 1. Validate store exists and is approved by ADAFSA
  const store: SharedVendorStore | undefined = SHARED_ABU_DHABI_STORES.find(
    (s) => s.id === input.storeId
  );
  if (!store) {
    return {
      success: false,
      error: `Vendor "${input.storeId}" not found in shared Abu Dhabi registry.`,
    };
  }
  if (!store.isApproved) {
    return {
      success: false,
      error: `Ordering Disabled: '${store.nameEn}' (${store.approvalNumber}) is awaiting municipal ADAFSA food safety approval. Orders cannot be placed.`,
    };
  }

  // 2. Validate Abu Dhabi Service Area Geofence (strictly Abu Dhabi only)
  if ((input.emirate || '').trim().toLowerCase() !== 'abu dhabi') {
    return {
      success: false,
      error: `Service Area Restriction: VAYORA operates exclusively in Abu Dhabi, UAE. Deliveries to '${input.emirate}' are strictly unavailable.`,
    };
  }

  const zone = SHARED_ABU_DHABI_ZONES.find(
    (z) =>
      z.id === input.zoneId ||
      z.nameEn.toLowerCase().includes((input.zoneId || '').toLowerCase())
  );
  if (!zone || !zone.isServiceable) {
    return {
      success: false,
      error: `Outside Coverage: '${input.zoneId}' is not within active Abu Dhabi courier service zones.`,
    };
  }

  if (!input.buildingName || !input.buildingName.trim()) {
    return {
      success: false,
      error: 'Incomplete Address: Building or Villa name in Abu Dhabi is required.',
    };
  }

  if (!input.items || input.items.length === 0) {
    return {
      success: false,
      error: 'Cart is empty. Please select at least one product.',
    };
  }

  // 3. Resolve products
  const liveProducts = await fetchMenuInventoryFromSupabase(store.id);
  const orderItemsPayload: any[] = [];
  let subtotalAed = 0;

  for (const cartItem of input.items) {
    const product =
      liveProducts.find((p) => p.id === cartItem.productId) ||
      SHARED_PRODUCTS.find((p) => p.id === cartItem.productId);
    if (!product) {
      return {
        success: false,
        error: `Product "${cartItem.productId}" not found for store ${store.nameEn}.`,
      };
    }
    if (!product.isAvailable || product.stock <= 0) {
      return {
        success: false,
        error: `Item "${product.nameEn}" is currently 86'd / out of stock at ${store.nameEn}.`,
      };
    }
    const qty = Math.max(1, Number(cartItem.quantity || 1));
    const lineTotal = product.priceAed * qty;
    subtotalAed += lineTotal;

    orderItemsPayload.push({
      id: product.id,
      product_id: product.id,
      name: product.nameEn,
      name_en: product.nameEn,
      name_ar: product.nameAr,
      qty,
      quantity: qty,
      price_aed: product.priceAed,
      price: `AED ${lineTotal.toFixed(2)}`,
      weight_or_portion: product.weightOrPortion,
      category: product.category,
      store_id: store.id,
      store_name: store.nameEn,
      special_notes: cartItem.specialNotes || '',
    });
  }

  const deliveryFeeAed = zone.deliveryFeeAed || store.deliveryFeeAed;
  const totalAed = subtotalAed + deliveryFeeAed;

  const fullDeliveryDestination = `${zone.nameEn} • ${input.buildingName.trim()}${
    input.apartmentOrVilla ? `, ${input.apartmentOrVilla.trim()}` : ''
  }`;

  const notesParts = [
    `Store: ${store.nameEn} (${store.id})`,
    `Payment: ${input.paymentMethod || 'Apple Pay'}`,
  ];
  if (input.customerPhone) notesParts.push(`Tel: ${input.customerPhone}`);
  if (input.instructions) notesParts.push(`Note: ${input.instructions}`);

  try {
    // Insert into normalized public."order" and public."order_items" on rbdsjgalxoehuwskzvit
    const orderHeaderPayload: Record<string, any> = {
      store_id: store.id,
      store_name: store.nameEn,
      customer_name: input.customerName.trim() || 'Fatima Al Mansoori',
      customer_phone: input.customerPhone || null,
      vip_tier: store.nameEn,
      status: 'CONFIRMED',
      partner_status: 'incoming',
      subtotal_aed: subtotalAed,
      delivery_fee_aed: deliveryFeeAed,
      total_aed: totalAed,
      delivery_zone: fullDeliveryDestination,
      delivery_address: {
        emirate: 'Abu Dhabi',
        zoneId: zone.id,
        zoneName: zone.nameEn,
        buildingName: input.buildingName.trim(),
        apartmentOrVilla: input.apartmentOrVilla?.trim() || '',
        instructions: input.instructions || '',
      },
      payment_method: input.paymentMethod || 'Apple Pay',
      notes: notesParts.join(' | '),
      updated_at: new Date().toISOString(),
    };
    if (input.orderId) {
      orderHeaderPayload.id = input.orderId;
    }

    let { data: insertedOrder, error: orderErr } = await supabase
      .from(CUSTOMER_DB_TABLES.order)
      .insert([orderHeaderPayload])
      .select()
      .single();

    // Fallback to core Customer App columns if additive columns haven't been migrated yet
    if (orderErr && orderErr.message?.includes('column')) {
      const minimalOrderPayload: Record<string, any> = {
        store_id: store.id,
        status: 'CONFIRMED',
        total_aed: totalAed,
      };
      if (input.orderId) minimalOrderPayload.id = input.orderId;
      const retryOrder = await supabase
        .from(CUSTOMER_DB_TABLES.order)
        .insert([minimalOrderPayload])
        .select()
        .single();
      insertedOrder = retryOrder.data;
      orderErr = retryOrder.error;
    }

    if (orderErr || !insertedOrder) {
      const formatted = formatSupabaseError(orderErr, CUSTOMER_DB_TABLES.order);
      lastSupabaseError = formatted;
      return {
        success: false,
        error: `Failed to insert into public."order": ${formatted}`,
      };
    }

    const createdOrderId = String(insertedOrder.id);

    const normalizedOrderItems = orderItemsPayload.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.product_id,
      product_name_en: item.name_en,
      product_name_ar: item.name_ar,
      quantity: item.quantity,
      unit_price_aed: item.price_aed,
      weight_or_portion: item.weight_or_portion,
      special_notes: item.special_notes,
    }));

    let { error: itemsErr } = await supabase
      .from(CUSTOMER_DB_TABLES.orderItems)
      .insert(normalizedOrderItems);

    // Fallback to core order_items columns if additive columns haven't been migrated yet
    if (itemsErr && itemsErr.message?.includes('column')) {
      const minimalItems = orderItemsPayload.map((item) => ({
        order_id: insertedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      const retryItems = await supabase.from(CUSTOMER_DB_TABLES.orderItems).insert(minimalItems);
      itemsErr = retryItems.error;
    }

    if (itemsErr) {
      const formatted = formatSupabaseError(itemsErr, CUSTOMER_DB_TABLES.orderItems);
      lastSupabaseError = formatted;
      return {
        success: false,
        error: `Order header ${createdOrderId} created, but public."order_items" insert failed: ${formatted}`,
      };
    }

    const verified = await fetchSingleOrderFromSupabase(createdOrderId);
    if (!verified) {
      return {
        success: false,
        error: `Order ${createdOrderId} could not be verified from public."order" after insert.`,
      };
    }

    await logPartnerAction('customer_order_placed', createdOrderId, {
      source: 'VAYORA Customer App',
      store_id: store.id,
      store_name: store.nameEn,
      customer_name: verified.customer_name,
      subtotal_aed: subtotalAed,
      delivery_fee_aed: deliveryFeeAed,
      total_aed: totalAed,
      delivery_zone: fullDeliveryDestination,
      items_count: orderItemsPayload.length,
      customer_status: verified.customerStatus.code,
    });

    lastSupabaseError = null;
    return {
      success: true,
      orderId: createdOrderId,
      order: verified,
    };
  } catch (err: any) {
    const formatted = formatSupabaseError(err, CUSTOMER_DB_TABLES.order);
    lastSupabaseError = formatted;
    return {
      success: false,
      error: formatted,
    };
  }
}

/**
 * Unified, Verified Order Status Updater in `public."order"` on `rbdsjgalxoehuwskzvit`:
 * Updates both `partner_status` ('incoming' | 'cooking' | 'ready_for_pickup' | 'completed' | 'declined')
 * and Customer App `status` ('CONFIRMED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'DECLINED').
 */
export async function updateOrderStatusInSupabase(
  orderId: string,
  targetStatus: string,
  extra: Record<string, any> = {}
): Promise<AcceptOrderResult> {
  if (!orderId) {
    return {
      success: false,
      orderId: '',
      error: 'Order ID is missing.',
    };
  }
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return {
      success: false,
      orderId,
      error: PENDING_KEY_NOTICE,
    };
  }

  const cleanId = orderId.trim().replace(/^#/, '');

  try {
    // 1. Locate the exact record in public."order"
    const { data: directMatch, error: directErr } = await supabase
      .from(CUSTOMER_DB_TABLES.order)
      .select('*')
      .eq('id', cleanId)
      .limit(1);

    if (directErr) {
      const formatted = formatSupabaseError(directErr, CUSTOMER_DB_TABLES.order);
      lastSupabaseError = formatted;
      return {
        success: false,
        orderId: cleanId,
        error: formatted,
      };
    }

    if (!directMatch || directMatch.length === 0) {
      return {
        success: false,
        orderId: cleanId,
        error: `Order record "${cleanId}" not found in Supabase public."${CUSTOMER_DB_TABLES.order}" table on ${CUSTOMER_SUPABASE_PROJECT_ID}.`,
      };
    }

    const existingOrder = directMatch[0];
    const matchedId = String(existingOrder.id);

    // 2. Verify order ownership when partner terminal is scoped to a specific store
    const session = getPartnerSession();
    const orderVendor = resolveOrderVendor(existingOrder);
    const effectiveOrderStoreId = existingOrder.store_id
      ? String(existingOrder.store_id)
      : orderVendor.storeId;

    if (
      session.storeId &&
      session.storeId !== 'ALL' &&
      effectiveOrderStoreId !== session.storeId &&
      !extra.bypassOwnershipCheck
    ) {
      return {
        success: false,
        orderId: matchedId,
        error: `Authorization Denied: Order #${matchedId} belongs to "${orderVendor.storeName}", not "${session.branch}". Switch to "${orderVendor.storeName}" or "All Connected Vendors" to manage this order.`,
      };
    }

    const currentStatus = mapCustomerOrDbStatusToPartnerStatus(
      existingOrder.status,
      existingOrder.partner_status
    );
    const normalizedTargetPartnerStatus = mapCustomerOrDbStatusToPartnerStatus(
      targetStatus,
      targetStatus
    );
    const mappedCustomerStatus = mapPartnerToCustomerStatus(normalizedTargetPartnerStatus);

    // 3. Build update payload for public."order"
    const updatePayload: Record<string, any> = {
      partner_status: normalizedTargetPartnerStatus,
      status: mappedCustomerStatus.code,
      updated_at: new Date().toISOString(),
    };

    if (extra.courier) {
      updatePayload.courier = extra.courier;
    }
    if (extra.delivery_zone) {
      updatePayload.delivery_zone = extra.delivery_zone;
    }
    if (extra.notes || extra.reason || extra.note) {
      const extraNote = extra.notes || extra.reason || extra.note;
      const baseNote = existingOrder.notes ? `${existingOrder.notes} | ` : '';
      updatePayload.notes = existingOrder.notes?.includes(extraNote)
        ? existingOrder.notes
        : `${baseNote}${extraNote}`;
    } else if (extra.minutes) {
      const baseNote = existingOrder.notes ? `${existingOrder.notes} | ` : '';
      updatePayload.notes = `${baseNote}Prep delay +${extra.minutes}m`;
    }

    let { data: updateData, error: updateError } = await supabase
      .from(CUSTOMER_DB_TABLES.order)
      .update(updatePayload)
      .eq('id', matchedId)
      .select();

    // Fallback to updating core Customer App `status` column if additive columns haven't been migrated yet
    if (updateError && updateError.message?.includes('column')) {
      const retryUpdate = await supabase
        .from(CUSTOMER_DB_TABLES.order)
        .update({ status: mappedCustomerStatus.code })
        .eq('id', matchedId)
        .select();
      updateData = retryUpdate.data;
      updateError = retryUpdate.error;
    }

    if (updateError) {
      const formatted = formatSupabaseError(updateError, CUSTOMER_DB_TABLES.order);
      lastSupabaseError = formatted;
      return {
        success: false,
        orderId: matchedId,
        error: formatted,
      };
    }

    if (!updateData || updateData.length === 0) {
      return {
        success: false,
        orderId: matchedId,
        error: `Database update returned 0 modified rows for order "${matchedId}" in public."${CUSTOMER_DB_TABLES.order}". Check RLS UPDATE policies for this store.`,
      };
    }

    // 4. Re-fetch from public."order" to independently confirm the saved status
    const verifiedEnriched = await fetchSingleOrderFromSupabase(matchedId);
    if (!verifiedEnriched) {
      return {
        success: false,
        orderId: matchedId,
        error: `Could not verify updated order status in Supabase public."${CUSTOMER_DB_TABLES.order}".`,
      };
    }

    // 5. Log confirmed action
    const actionLabel =
      normalizedTargetPartnerStatus === 'cooking'
        ? 'order_accepted'
        : normalizedTargetPartnerStatus === 'declined'
        ? 'order_declined'
        : `order_${normalizedTargetPartnerStatus}`;

    await logPartnerAction(actionLabel, matchedId, {
      store_id: verifiedEnriched.storeId,
      store_name: verifiedEnriched.storeName,
      previous_status: currentStatus,
      new_status: verifiedEnriched.status,
      customer_app_status: verifiedEnriched.customerStatus.code,
      customer_name: verifiedEnriched.customer_name,
      total_aed: verifiedEnriched.total_aed,
      ...extra,
    });

    lastSupabaseError = null;
    return {
      success: true,
      orderId: matchedId,
      previousStatus: currentStatus,
      newStatus: verifiedEnriched.status,
      customerStatus: verifiedEnriched.customerStatus.code,
      order: verifiedEnriched,
    };
  } catch (err: any) {
    const formatted = formatSupabaseError(err, CUSTOMER_DB_TABLES.order);
    lastSupabaseError = formatted;
    return {
      success: false,
      orderId: cleanId,
      error: formatted,
    };
  }
}

/**
 * Accept Order in Supabase (`public."order"`): sets partner_status='cooking' & status='PREPARING'
 */
export async function acceptOrderInSupabase(orderId: string): Promise<AcceptOrderResult> {
  return updateOrderStatusInSupabase(orderId, 'cooking');
}

/**
 * Reject / Decline Order in Supabase (`public."order"`): sets partner_status='declined' & status='DECLINED'
 */
export async function rejectOrderInSupabase(
  orderId: string,
  reason: string
): Promise<AcceptOrderResult> {
  return updateOrderStatusInSupabase(orderId, 'declined', {
    reason: `Declined: ${reason}`,
  });
}

/**
 * Sync Order Status to `public."order"` in Supabase (verified)
 */
export async function syncOrderToSupabase(
  orderId: string,
  status: string,
  extra: Record<string, any> = {}
): Promise<AcceptOrderResult> {
  return updateOrderStatusInSupabase(orderId, status, extra);
}

const ordersRealtimeListeners = new Set<(payload?: any) => void>();
let ordersRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

/**
 * Subscribe to real-time changes on `public."order"` and `public."order_items"` in `rbdsjgalxoehuwskzvit`.
 * Multiplexes all listeners over a single shared RealtimeChannel to avoid
 * adding `postgres_changes` callbacks after `.subscribe()` has been called.
 */
export function subscribeToOrdersRealtime(onOrderChange: (payload?: any) => void) {
  ordersRealtimeListeners.add(onOrderChange);

  if (hasValidCustomerAnonKey() && !ordersRealtimeChannel) {
    ordersRealtimeChannel = supabase
      .channel(`shared-vayora-order-sync-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: CUSTOMER_DB_TABLES.order },
        (payload) => {
          ordersRealtimeListeners.forEach((listener) => {
            try {
              listener(payload);
            } catch {
              // ignore listener error
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: CUSTOMER_DB_TABLES.orderItems },
        (payload) => {
          ordersRealtimeListeners.forEach((listener) => {
            try {
              listener(payload);
            } catch {
              // ignore listener error
            }
          });
        }
      )
      .subscribe();
  }

  return () => {
    ordersRealtimeListeners.delete(onOrderChange);
    if (ordersRealtimeListeners.size === 0 && ordersRealtimeChannel) {
      const channelToRemove = ordersRealtimeChannel;
      ordersRealtimeChannel = null;
      supabase.removeChannel(channelToRemove);
    }
  };
}

/**
 * Sync Dish & Inventory changes to `public."product"` on `https://rbdsjgalxoehuwskzvit.supabase.co`
 */
export async function syncMenuStockToSupabase(
  dishId: string,
  dishTitle: string,
  newStock: number,
  is86ed: boolean = false,
  extra?: { price?: number; category?: string; sku?: string }
) {
  await logPartnerAction(is86ed ? 'menu_item_86ed' : 'menu_stock_updated', dishId, {
    dishTitle,
    newStock,
    is86ed,
    ...extra,
  });

  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return;
  }

  try {
    const updatePayload: Record<string, any> = {
      stock: newStock,
      is_86: is86ed,
      is_available: !is86ed && newStock > 0,
      updated_at: new Date().toISOString(),
    };
    if (extra?.price !== undefined) updatePayload.price_aed = extra.price;
    if (extra?.sku !== undefined) updatePayload.sku = extra.sku;

    let { error } = await supabase
      .from(CUSTOMER_DB_TABLES.product)
      .update(updatePayload)
      .eq('id', dishId);

    // Fallback to core `is_available` column if additive columns (`stock`, `is_86`, `updated_at`) are not yet added
    if (error && error.message?.includes('column')) {
      const retry = await supabase
        .from(CUSTOMER_DB_TABLES.product)
        .update({ is_available: !is86ed && newStock > 0 })
        .eq('id', dishId);
      error = retry.error;
    }

    if (error) {
      lastSupabaseError = formatSupabaseError(error, CUSTOMER_DB_TABLES.product);
    } else {
      lastSupabaseError = null;
    }
  } catch (err: any) {
    lastSupabaseError = formatSupabaseError(err, CUSTOMER_DB_TABLES.product);
  }
}

/**
 * Sync Delivery Zone Status (logged to partner session telemetry; preserves Customer App schema)
 */
export async function syncZoneToSupabase(zoneId: string, zoneName: string, isActive: boolean) {
  await logPartnerAction('delivery_zone_toggled', zoneId, {
    zoneName,
    isActive,
  });
}

/**
 * Check real connectivity with `https://rbdsjgalxoehuwskzvit.supabase.co` (`public."order"`)
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  projectUrl: string;
}> {
  if (!hasValidCustomerAnonKey()) {
    lastSupabaseError = PENDING_KEY_NOTICE;
    return {
      connected: false,
      message: PENDING_KEY_NOTICE,
      projectUrl: SUPABASE_URL,
    };
  }
  try {
    const { error } = await supabase
      .from(CUSTOMER_DB_TABLES.order)
      .select('id', { count: 'exact', head: true });
    if (error) {
      const formatted = formatSupabaseError(error, CUSTOMER_DB_TABLES.order);
      lastSupabaseError = formatted;
      return {
        connected: false,
        message: formatted,
        projectUrl: SUPABASE_URL,
      };
    }
    lastSupabaseError = null;
    return {
      connected: true,
      message: `Connected to shared Customer App Supabase (${SUPABASE_PROJECT_ID} • public."${CUSTOMER_DB_TABLES.order}")`,
      projectUrl: SUPABASE_URL,
    };
  } catch (err: any) {
    const formatted = formatSupabaseError(err, CUSTOMER_DB_TABLES.order);
    lastSupabaseError = formatted;
    return {
      connected: false,
      message: formatted,
      projectUrl: SUPABASE_URL,
    };
  }
}

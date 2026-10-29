-- ============================================================================
-- Staged Non-Destructive Additive Migration for Customer App Supabase Project
-- Target Project URL: https://rbdsjgalxoehuwskzvit.supabase.co
-- Target Project Ref: rbdsjgalxoehuwskzvit
--
-- PURPOSE:
-- Connects the Restaurant App ("Quick Shop Partner" / delivery-app) to the
-- existing Customer App ("VAYORA" / vayora) Supabase database WITHOUT:
--   1. Deleting, truncating, or overwriting any existing rows
--   2. Creating duplicate conflicting tables (NO "orders", "products", "stores",
--      "categories", or "users" tables are created)
--   3. Inventing fake partner accounts or hardcoded credentials
--
-- PRESERVED EXISTING TABLES IN rbdsjgalxoehuwskzvit:
--   1. public."category"
--   2. public."order"        (Reserved SQL keyword -> always double-quoted)
--   3. public."order_items"
--   4. public."product"
--   5. public."rider_profile"
--   6. public."store"
--   7. public."user"         (Reserved SQL keyword -> always double-quoted)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PRE-FLIGHT SAFETY CHECK: Verify all 7 existing tables exist before running
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  missing_tables text[];
BEGIN
  SELECT array_agg(req.tbl)
    INTO missing_tables
  FROM (
    VALUES
      ('category'),
      ('order'),
      ('order_items'),
      ('product'),
      ('rider_profile'),
      ('store'),
      ('user')
  ) AS req(tbl)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name = req.tbl
  );

  IF missing_tables IS NOT NULL AND array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION
      'Pre-flight check aborted: Expected existing tables missing in public schema: %',
      array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. ADDITIVE EXTENSION OF public."store"
--    Preserves existing store columns and adds Partner Portal & ADAFSA fields
-- ----------------------------------------------------------------------------
ALTER TABLE public."store"
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS category_display_name text,
  ADD COLUMN IF NOT EXISTS zone_id text,
  ADD COLUMN IF NOT EXISTS zone_name text,
  ADD COLUMN IF NOT EXISTS emirate text DEFAULT 'Abu Dhabi',
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 4.80,
  ADD COLUMN IF NOT EXISTS delivery_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS delivery_fee_aed numeric(10,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS min_order_aed numeric(10,2) DEFAULT 35.00,
  ADD COLUMN IF NOT EXISTS is_open boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_authority text DEFAULT 'ADAFSA',
  ADD COLUMN IF NOT EXISTS approval_number text,
  ADD COLUMN IF NOT EXISTS banner_tag text,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ----------------------------------------------------------------------------
-- 2. ADDITIVE EXTENSION OF public."category"
--    Preserves existing category rows and links categories to stores if needed
-- ----------------------------------------------------------------------------
ALTER TABLE public."category"
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS icon_name text,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Dynamically add store_id on public."category" matching public."store"(id) type
DO $$
DECLARE
  store_pk_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO store_pk_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'store'
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF store_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category' AND column_name = 'store_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."category" ADD COLUMN store_id %s', store_pk_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'category_store_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category' AND column_name = 'store_id'
  ) THEN
    BEGIN
      ALTER TABLE public."category"
        ADD CONSTRAINT category_store_id_fkey
        FOREIGN KEY (store_id) REFERENCES public."store"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped category_store_id_fkey due to existing column type difference; inspect category.store_id vs store.id.';
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. ADDITIVE EXTENSION OF public."product"
--    Preserves Customer App products and adds Restaurant App inventory fields
--    (stock, is_available, is_86, sku, weight_or_portion)
-- ----------------------------------------------------------------------------
ALTER TABLE public."product"
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS price_aed numeric(10,2),
  ADD COLUMN IF NOT EXISTS weight_or_portion text,
  ADD COLUMN IF NOT EXISTS stock integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_86 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Dynamically ensure store_id and category_id on public."product" match PK types
DO $$
DECLARE
  store_pk_type text;
  category_pk_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO store_pk_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'store' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO category_pk_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'category' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  IF store_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product' AND column_name = 'store_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."product" ADD COLUMN store_id %s', store_pk_type);
  END IF;

  IF category_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product' AND column_name = 'category_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."product" ADD COLUMN category_id %s', category_pk_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_store_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product' AND column_name = 'store_id'
  ) THEN
    BEGIN
      ALTER TABLE public."product"
        ADD CONSTRAINT product_store_id_fkey
        FOREIGN KEY (store_id) REFERENCES public."store"(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped product_store_id_fkey due to existing column type difference; inspect product.store_id vs store.id.';
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_category_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product' AND column_name = 'category_id'
  ) THEN
    BEGIN
      ALTER TABLE public."product"
        ADD CONSTRAINT product_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES public."category"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped product_category_id_fkey due to existing column type difference; inspect product.category_id vs category.id.';
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. ADDITIVE EXTENSION OF public."user"
--    Links application user rows to Supabase Auth (auth.users) and store roles
--    NOTE: Does NOT insert any fake partner accounts or invented credentials.
-- ----------------------------------------------------------------------------
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS default_emirate text DEFAULT 'Abu Dhabi',
  ADD COLUMN IF NOT EXISTS default_zone_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Dynamically add assigned_store_id on public."user" matching public."store"(id) type
DO $$
DECLARE
  store_pk_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO store_pk_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'store' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  IF store_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'assigned_store_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."user" ADD COLUMN assigned_store_id %s', store_pk_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_assigned_store_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'assigned_store_id'
  ) THEN
    BEGIN
      ALTER TABLE public."user"
        ADD CONSTRAINT user_assigned_store_id_fkey
        FOREIGN KEY (assigned_store_id) REFERENCES public."store"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped user_assigned_store_id_fkey due to existing column type difference.';
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. ADDITIVE EXTENSION OF public."rider_profile"
--    Preserves existing rider profiles and links to auth.users & public."user"
-- ----------------------------------------------------------------------------
ALTER TABLE public."rider_profile"
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS assigned_zone text,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS current_status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
DECLARE
  user_pk_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO user_pk_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'user' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  IF user_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rider_profile' AND column_name = 'user_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."rider_profile" ADD COLUMN user_id %s', user_pk_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rider_profile_user_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rider_profile' AND column_name = 'user_id'
  ) THEN
    BEGIN
      ALTER TABLE public."rider_profile"
        ADD CONSTRAINT rider_profile_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public."user"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped rider_profile_user_id_fkey due to existing column type difference.';
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. ADDITIVE EXTENSION OF public."order" (Singular table — NOT "orders")
--    Preserves all existing Customer App columns and adds Partner Portal KDS
--    columns so both apps read & write the exact same order row.
-- ----------------------------------------------------------------------------
ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS vip_tier text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'CONFIRMED',
  ADD COLUMN IF NOT EXISTS partner_status text DEFAULT 'incoming',
  ADD COLUMN IF NOT EXISTS subtotal_aed numeric(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS delivery_fee_aed numeric(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_aed numeric(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS delivery_zone text,
  ADD COLUMN IF NOT EXISTS delivery_address jsonb,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS courier text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Dynamically ensure store_id, customer_id, and rider_id on public."order"
DO $$
DECLARE
  store_pk_type text;
  user_pk_type text;
  rider_pk_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO store_pk_type
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'store' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod) INTO user_pk_type
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'user' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod) INTO rider_pk_type
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'rider_profile' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  IF store_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'store_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."order" ADD COLUMN store_id %s', store_pk_type);
  END IF;

  IF user_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'customer_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."order" ADD COLUMN customer_id %s', user_pk_type);
  END IF;

  IF rider_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'rider_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."order" ADD COLUMN rider_id %s', rider_pk_type);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_store_id_fkey')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'store_id') THEN
    BEGIN
      ALTER TABLE public."order"
        ADD CONSTRAINT order_store_id_fkey
        FOREIGN KEY (store_id) REFERENCES public."store"(id)
        ON UPDATE CASCADE ON DELETE RESTRICT;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped order_store_id_fkey due to existing column type difference.';
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_customer_id_fkey')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'customer_id') THEN
    BEGIN
      ALTER TABLE public."order"
        ADD CONSTRAINT order_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES public."user"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped order_customer_id_fkey due to existing column type difference.';
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_rider_id_fkey')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'rider_id') THEN
    BEGIN
      ALTER TABLE public."order"
        ADD CONSTRAINT order_rider_id_fkey
        FOREIGN KEY (rider_id) REFERENCES public."rider_profile"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped order_rider_id_fkey due to existing column type difference.';
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. ADDITIVE EXTENSION OF public."order_items"
--    Preserves normalized line items and links each item to "order" & "product"
-- ----------------------------------------------------------------------------
ALTER TABLE public."order_items"
  ADD COLUMN IF NOT EXISTS product_name_en text,
  ADD COLUMN IF NOT EXISTS product_name_ar text,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price_aed numeric(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS weight_or_portion text,
  ADD COLUMN IF NOT EXISTS special_notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
DECLARE
  order_pk_type text;
  product_pk_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO order_pk_type
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'order' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod) INTO product_pk_type
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'product' AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped;

  IF order_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'order_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."order_items" ADD COLUMN order_id %s', order_pk_type);
  END IF;

  IF product_pk_type IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'product_id'
  ) THEN
    EXECUTE format('ALTER TABLE public."order_items" ADD COLUMN product_id %s', product_pk_type);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'order_id') THEN
    BEGIN
      ALTER TABLE public."order_items"
        ADD CONSTRAINT order_items_order_id_fkey
        FOREIGN KEY (order_id) REFERENCES public."order"(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped order_items_order_id_fkey due to existing column type difference.';
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'product_id') THEN
    BEGIN
      ALTER TABLE public."order_items"
        ADD CONSTRAINT order_items_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public."product"(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN datatype_mismatch THEN
      RAISE NOTICE 'Skipped order_items_product_id_fkey due to existing column type difference.';
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. BIDIRECTIONAL STATUS SYNC TRIGGER ON public."order"
--    Keeps Customer App `status` ('CONFIRMED', 'PREPARING', 'ON_THE_WAY',
--    'DELIVERED', 'DECLINED') and Restaurant App `partner_status` ('incoming',
--    'cooking', 'ready_for_pickup', 'completed', 'declined') synchronized
--    whenever either app updates an order row.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_order_status_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := COALESCE(NEW.updated_at, now());

  -- If partner_status was changed by the Restaurant App, sync status for Customer App
  IF TG_OP = 'INSERT' OR (NEW.partner_status IS DISTINCT FROM OLD.partner_status) THEN
    CASE lower(COALESCE(NEW.partner_status, ''))
      WHEN 'incoming', 'pending' THEN
        NEW.status := 'CONFIRMED';
      WHEN 'accepted', 'cooking', 'preparing' THEN
        NEW.status := 'PREPARING';
      WHEN 'ready_for_pickup', 'ready', 'out_for_delivery', 'dispatched' THEN
        NEW.status := 'ON_THE_WAY';
      WHEN 'completed', 'delivered' THEN
        NEW.status := 'DELIVERED';
      WHEN 'declined', 'rejected', 'cancelled' THEN
        NEW.status := 'DECLINED';
      ELSE
        NULL;
    END CASE;
  -- Otherwise if status was changed directly by the Customer App or Rider
  ELSIF (NEW.status IS DISTINCT FROM OLD.status) THEN
    CASE upper(COALESCE(NEW.status, ''))
      WHEN 'CONFIRMED', 'INCOMING', 'PENDING' THEN
        NEW.partner_status := 'incoming';
      WHEN 'PREPARING', 'COOKING', 'ACCEPTED' THEN
        NEW.partner_status := 'cooking';
      WHEN 'ON_THE_WAY', 'READY_FOR_PICKUP', 'READY' THEN
        NEW.partner_status := 'ready_for_pickup';
      WHEN 'DELIVERED', 'COMPLETED' THEN
        NEW.partner_status := 'completed';
      WHEN 'DECLINED', 'REJECTED', 'CANCELLED' THEN
        NEW.partner_status := 'declined';
      ELSE
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_status_columns ON public."order";
CREATE TRIGGER trg_sync_order_status_columns
  BEFORE INSERT OR UPDATE ON public."order"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_status_columns();

-- ----------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES ON FOREIGN KEYS & STORE QUERIES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_store_id ON public."product"(store_id);
CREATE INDEX IF NOT EXISTS idx_product_category_id ON public."product"(category_id);
CREATE INDEX IF NOT EXISTS idx_category_store_id ON public."category"(store_id);
CREATE INDEX IF NOT EXISTS idx_order_store_id ON public."order"(store_id);
CREATE INDEX IF NOT EXISTS idx_order_customer_id ON public."order"(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_rider_id ON public."order"(rider_id);
CREATE INDEX IF NOT EXISTS idx_order_updated_at ON public."order"(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public."order_items"(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public."order_items"(product_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON public."user"(auth_user_id);

-- ----------------------------------------------------------------------------
-- 10. AUTHENTICATION & STORE-SCOPED AUTHORIZATION HELPER FUNCTIONS
--     Resolves the authenticated user's role and assigned store from
--     public."user" and public."store" using Supabase `auth.uid()`.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT u.role
      FROM public."user" u
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    ),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'customer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_partner_for_store(target_store_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."store" s
    WHERE s.id::text = target_store_id
      AND s.owner_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.auth_user_id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'partner' AND u.assigned_store_id::text = target_store_id)
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) & STORE-SCOPED PARTNER PERMISSIONS
-- ----------------------------------------------------------------------------
ALTER TABLE public."store" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rider_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order_items" ENABLE ROW LEVEL SECURITY;

-- 11A. public."store" Policies
DROP POLICY IF EXISTS "store_select_public" ON public."store";
CREATE POLICY "store_select_public"
  ON public."store"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "store_update_scoped_partner" ON public."store";
CREATE POLICY "store_update_scoped_partner"
  ON public."store"
  FOR UPDATE
  TO authenticated
  USING (public.is_partner_for_store(id::text))
  WITH CHECK (public.is_partner_for_store(id::text));

-- 11B. public."category" Policies
DROP POLICY IF EXISTS "category_select_public" ON public."category";
CREATE POLICY "category_select_public"
  ON public."category"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "category_write_scoped_partner" ON public."category";
CREATE POLICY "category_write_scoped_partner"
  ON public."category"
  FOR ALL
  TO authenticated
  USING (store_id IS NULL OR public.is_partner_for_store(store_id::text))
  WITH CHECK (store_id IS NULL OR public.is_partner_for_store(store_id::text));

-- 11C. public."product" Policies
DROP POLICY IF EXISTS "product_select_public" ON public."product";
CREATE POLICY "product_select_public"
  ON public."product"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "product_write_scoped_partner" ON public."product";
CREATE POLICY "product_write_scoped_partner"
  ON public."product"
  FOR ALL
  TO authenticated
  USING (public.is_partner_for_store(store_id::text))
  WITH CHECK (public.is_partner_for_store(store_id::text));

-- 11D. public."user" Policies (Users see/edit own profile; partners see customer info for their orders)
DROP POLICY IF EXISTS "user_select_own_or_admin" ON public."user";
CREATE POLICY "user_select_own_or_admin"
  ON public."user"
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR id::text = auth.uid()::text
    OR public.current_app_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "user_update_own" ON public."user";
CREATE POLICY "user_update_own"
  ON public."user"
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() OR id::text = auth.uid()::text)
  WITH CHECK (auth_user_id = auth.uid() OR id::text = auth.uid()::text);

DROP POLICY IF EXISTS "user_insert_own" ON public."user";
CREATE POLICY "user_insert_own"
  ON public."user"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid() OR id::text = auth.uid()::text);

-- 11E. public."rider_profile" Policies
DROP POLICY IF EXISTS "rider_profile_select_authenticated" ON public."rider_profile";
CREATE POLICY "rider_profile_select_authenticated"
  ON public."rider_profile"
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "rider_profile_update_own" ON public."rider_profile";
CREATE POLICY "rider_profile_update_own"
  ON public."rider_profile"
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() OR public.current_app_user_role() = 'admin')
  WITH CHECK (auth_user_id = auth.uid() OR public.current_app_user_role() = 'admin');

-- 11F. public."order" Policies
-- Customers can view & create their own orders;
-- Restaurant partners can view & update ONLY orders where store_id matches their assigned store;
-- Riders can view & update orders assigned to their rider_profile.
DROP POLICY IF EXISTS "order_select_customer_partner_rider" ON public."order";
CREATE POLICY "order_select_customer_partner_rider"
  ON public."order"
  FOR SELECT
  TO authenticated
  USING (
    -- Customer owns the order
    EXISTS (
      SELECT 1 FROM public."user" u
      WHERE u.id::text = customer_id::text
        AND (u.auth_user_id = auth.uid() OR u.id::text = auth.uid()::text)
    )
    OR customer_id::text = auth.uid()::text
    -- Store Partner owns/manages the target store
    OR public.is_partner_for_store(store_id::text)
    -- Rider is assigned to the order
    OR EXISTS (
      SELECT 1 FROM public."rider_profile" rp
      WHERE rp.id::text = rider_id::text
        AND rp.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_insert_customer" ON public."order";
CREATE POLICY "order_insert_customer"
  ON public."order"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Order must target an approved store in Abu Dhabi
    EXISTS (
      SELECT 1 FROM public."store" s
      WHERE s.id::text = store_id::text
        AND COALESCE(s.is_approved, true) = true
    )
  );

DROP POLICY IF EXISTS "order_update_scoped_partner_or_rider" ON public."order";
CREATE POLICY "order_update_scoped_partner_or_rider"
  ON public."order"
  FOR UPDATE
  TO authenticated
  USING (
    public.is_partner_for_store(store_id::text)
    OR EXISTS (
      SELECT 1 FROM public."rider_profile" rp
      WHERE rp.id::text = rider_id::text
        AND rp.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_partner_for_store(store_id::text)
    OR EXISTS (
      SELECT 1 FROM public."rider_profile" rp
      WHERE rp.id::text = rider_id::text
        AND rp.auth_user_id = auth.uid()
    )
  );

-- 11G. public."order_items" Policies
-- Scoped via parent row in public."order"
DROP POLICY IF EXISTS "order_items_select_via_order" ON public."order_items";
CREATE POLICY "order_items_select_via_order"
  ON public."order_items"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."order" o
      WHERE o.id::text = order_id::text
        AND (
          o.customer_id::text = auth.uid()::text
          OR public.is_partner_for_store(o.store_id::text)
          OR EXISTS (
            SELECT 1 FROM public."user" u
            WHERE u.id::text = o.customer_id::text
              AND u.auth_user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public."rider_profile" rp
            WHERE rp.id::text = o.rider_id::text
              AND rp.auth_user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "order_items_insert_via_order" ON public."order_items";
CREATE POLICY "order_items_insert_via_order"
  ON public."order_items"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."order" o
      WHERE o.id::text = order_id::text
    )
  );

-- ----------------------------------------------------------------------------
-- 12. REALTIME PUBLICATION FOR LIVE ORDER & INVENTORY UPDATES
--     Enables Supabase Realtime on public."order", public."order_items", and
--     public."product" so the Restaurant App KDS and Customer App tracker update
--     instantly without polling.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."order";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."order_items";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'product'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."product";
    END IF;
  END IF;
END $$;

COMMIT;

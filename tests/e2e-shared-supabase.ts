import {
  supabase,
  SUPABASE_URL,
  SUPABASE_PROJECT_ID,
  CUSTOMER_DB_TABLES,
  testSupabaseConnection,
  ensureSharedCatalogSyncedToSupabase,
  fetchMenuInventoryFromSupabase,
  fetchDeliveryZonesFromSupabase,
  fetchOrdersFromSupabase,
  fetchSingleOrderFromSupabase,
  placeCustomerOrderInSupabase,
  acceptOrderInSupabase,
  rejectOrderInSupabase,
  updateOrderStatusInSupabase,
  setPartnerBranch,
} from '../src/lib/supabase';
import {
  SHARED_ABU_DHABI_STORES,
  SHARED_PRODUCTS,
  SHARED_ABU_DHABI_ZONES,
} from '../src/lib/sharedCatalog';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runEndToEndVerification() {
  console.log('====================================================================');
  console.log('VAYORA SHARED SUPABASE END-TO-END VERIFICATION SUITE');
  console.log(`Target Supabase Project: ${SUPABASE_PROJECT_ID} (${SUPABASE_URL})`);
  console.log(
    `Target Customer Tables : public."${CUSTOMER_DB_TABLES.order}", public."${CUSTOMER_DB_TABLES.orderItems}", public."${CUSTOMER_DB_TABLES.product}", public."${CUSTOMER_DB_TABLES.store}"`
  );
  console.log('====================================================================\n');

  const testOrderId1 = `ORD-AD-E2E-${Date.now().toString().slice(-4)}A`;
  const testOrderId2 = `ORD-AD-E2E-${Date.now().toString().slice(-4)}B`;
  let connectedToDb = false;

  try {
    // 1. Connectivity Check
    console.log('[1/7] Verifying live Supabase connection to rbdsjgalxoehuwskzvit...');
    const conn = await testSupabaseConnection();
    assert(conn.connected, `Supabase connection failed: ${conn.message}`);
    connectedToDb = true;
    console.log(`  PASS: ${conn.message}`);

    // 2. Non-destructive Catalog & Zone Sync Check
    console.log('\n[2/7] Verifying shared Abu Dhabi catalog (public."store" & public."product")...');
    const syncStats = await ensureSharedCatalogSyncedToSupabase();
    const liveMenu = await fetchMenuInventoryFromSupabase('ALL');
    const liveZones = await fetchDeliveryZonesFromSupabase();
    assert(
      liveMenu.length >= SHARED_PRODUCTS.length,
      `Expected at least ${SHARED_PRODUCTS.length} products, found ${liveMenu.length}`
    );
    assert(
      Array.isArray(liveZones) && liveZones.length >= SHARED_ABU_DHABI_ZONES.length,
      `Expected at least ${SHARED_ABU_DHABI_ZONES.length} zones, found ${liveZones?.length || 0}`
    );
    console.log(
      `  PASS: ${SHARED_ABU_DHABI_STORES.length} stores, ${liveMenu.length} products in public."product" (newly seeded: ${syncStats.syncedProducts}).`
    );

    // 3. Customer App Guardrails Check (Unapproved store & Non-Abu Dhabi geofence)
    console.log('\n[3/7] Testing Customer App business & geofence validation rules...');
    const unapprovedAttempt = await placeCustomerOrderInSupabase({
      storeId: 'store_unapproved_sample', // Corniche Marina Refreshments (ADAFSA-PENDING-2024, isApproved = false)
      customerName: 'E2E Test Customer',
      emirate: 'Abu Dhabi',
      zoneId: 'ad_al_bateen',
      buildingName: 'Corniche Tower A',
      apartmentOrVilla: 'Apt 402',
      paymentMethod: 'Apple Pay',
      items: [{ productId: 'prod_unapproved_1', quantity: 1 }],
    });
    assert(!unapprovedAttempt.success, 'Unapproved store order placement should be blocked');
    assert(
      unapprovedAttempt.error?.includes('Ordering Disabled'),
      `Expected ADAFSA approval error, got: ${unapprovedAttempt.error}`
    );
    console.log(`  PASS (Unapproved vendor blocked): ${unapprovedAttempt.error}`);

    const outsideEmirateAttempt = await placeCustomerOrderInSupabase({
      storeId: 'store_mosaic',
      customerName: 'E2E Test Customer',
      emirate: 'Dubai', // Outside Abu Dhabi
      zoneId: 'ad_al_khalidiya',
      buildingName: 'Marina Gate',
      apartmentOrVilla: 'Apt 101',
      paymentMethod: 'Apple Pay',
      items: [{ productId: 'prod_ms_mixed_grill', quantity: 1 }],
    });
    assert(!outsideEmirateAttempt.success, 'Non-Abu Dhabi order placement should be blocked');
    console.log(`  PASS (Outside Abu Dhabi blocked): ${outsideEmirateAttempt.error}`);

    // 4. Customer Order Creation -> Restaurant Scoped Retrieval
    console.log('\n[4/7] Testing Customer Order Placement (public."order" + public."order_items") -> Restaurant Scoped Retrieval...');
    const placed1 = await placeCustomerOrderInSupabase({
      orderId: testOrderId1,
      storeId: 'store_mosaic', // Mosaic Lebanese Restaurant
      customerName: 'Mariam Al Dhaheri (E2E Verification)',
      customerPhone: '+971 50 555 0199',
      emirate: 'Abu Dhabi',
      zoneId: 'ad_al_khalidiya',
      buildingName: 'Al Khalidiya Residence',
      apartmentOrVilla: 'Apt 1204',
      instructions: 'E2E verification order - extra garlic',
      paymentMethod: 'Apple Pay',
      items: [
        { productId: 'prod_ms_mixed_grill', quantity: 1 },
        { productId: 'prod_ms_hommos_meat', quantity: 1 },
      ],
    });
    assert(placed1.success && placed1.order, `Order placement failed: ${placed1.error}`);
    assert(
      placed1.order.status === 'incoming',
      `Expected initial Partner status 'incoming', got '${placed1.order.status}'`
    );
    assert(
      placed1.order.customerStatus.code === 'CONFIRMED',
      `Expected Customer App status 'CONFIRMED', got '${placed1.order.customerStatus.code}'`
    );

    const mosaicOrders = await fetchOrdersFromSupabase('store_mosaic');
    const roasterOrders = await fetchOrdersFromSupabase('store_lebanese_roaster');
    assert(
      mosaicOrders?.some((o) => o.id === testOrderId1),
      `Mosaic Lebanese Restaurant ('store_mosaic') must see order ${testOrderId1}`
    );
    assert(
      !roasterOrders?.some((o) => o.id === testOrderId1),
      `Lebanese Roaster ('store_lebanese_roaster') must NOT see Mosaic's order ${testOrderId1}`
    );
    console.log(
      `  PASS: Order ${testOrderId1} saved in public."order" + public."order_items" (total AED ${placed1.order.total_aed}), visible to 'store_mosaic' and isolated from 'store_lebanese_roaster'.`
    );

    // 5. Cross-Store Ownership Enforcement Check
    console.log('\n[5/7] Testing Cross-Store Ownership & Authorization Enforcement...');
    setPartnerBranch('store_lebanese_roaster'); // Log partner terminal into Lebanese Roaster
    const unauthorizedAccept = await acceptOrderInSupabase(testOrderId1);
    assert(
      !unauthorizedAccept.success,
      'Partner scoped to store_lebanese_roaster must be blocked from accepting store_mosaic order'
    );
    console.log(`  PASS (Cross-store update blocked): ${unauthorizedAccept.error}`);

    // 6. Restaurant Accept & Full Status Lifecycle -> Customer App Status Retrieval
    console.log('\n[6/7] Testing Restaurant Accept & Status Updates -> Customer App Tracking...');
    setPartnerBranch('store_mosaic'); // Switch partner terminal to Mosaic Lebanese Restaurant

    const acceptRes = await acceptOrderInSupabase(testOrderId1);
    assert(acceptRes.success, `Accept order failed: ${acceptRes.error}`);
    assert(acceptRes.newStatus === 'cooking', `Expected 'cooking', got '${acceptRes.newStatus}'`);
    assert(
      acceptRes.customerStatus === 'PREPARING',
      `Expected 'PREPARING', got '${acceptRes.customerStatus}'`
    );
    console.log(
      `  PASS (Accept Order): ${testOrderId1} Partner status='${acceptRes.newStatus}' -> Customer App sees '${acceptRes.customerStatus}'`
    );

    const readyRes = await updateOrderStatusInSupabase(testOrderId1, 'ready_for_pickup', {
      courier: 'Zayed Al Nahyan (Fleet #AD-14)',
    });
    assert(readyRes.success, `Ready for pickup update failed: ${readyRes.error}`);
    assert(
      readyRes.newStatus === 'ready_for_pickup',
      `Expected 'ready_for_pickup', got '${readyRes.newStatus}'`
    );
    assert(
      readyRes.customerStatus === 'ON_THE_WAY',
      `Expected 'ON_THE_WAY', got '${readyRes.customerStatus}'`
    );
    console.log(
      `  PASS (Ready / Out for Delivery): ${testOrderId1} Partner status='${readyRes.newStatus}' -> Customer App sees '${readyRes.customerStatus}'`
    );

    const completedRes = await updateOrderStatusInSupabase(testOrderId1, 'completed');
    assert(completedRes.success, `Completed update failed: ${completedRes.error}`);
    assert(
      completedRes.newStatus === 'completed',
      `Expected 'completed', got '${completedRes.newStatus}'`
    );
    assert(
      completedRes.customerStatus === 'DELIVERED',
      `Expected 'DELIVERED', got '${completedRes.customerStatus}'`
    );
    console.log(
      `  PASS (Completed / Delivered): ${testOrderId1} Partner status='${completedRes.newStatus}' -> Customer App sees '${completedRes.customerStatus}'`
    );

    // 7. Restaurant Reject Workflow -> Customer App Declined Status
    console.log('\n[7/7] Testing Restaurant Reject Order Workflow...');
    setPartnerBranch('store_lebanese_roaster');
    const placed2 = await placeCustomerOrderInSupabase({
      orderId: testOrderId2,
      storeId: 'store_lebanese_roaster',
      customerName: 'Khalid Al Ameri (E2E Reject Test)',
      emirate: 'Abu Dhabi',
      zoneId: 'ad_al_reem',
      buildingName: 'Sky Tower',
      apartmentOrVilla: 'Floor 29',
      paymentMethod: 'Card',
      items: [{ productId: 'prod_lr_syrian_pistachio', quantity: 1 }],
    });
    assert(placed2.success, `Failed to place second test order: ${placed2.error}`);

    const rejectRes = await rejectOrderInSupabase(
      testOrderId2,
      'Roastery drum maintenance in progress'
    );
    assert(rejectRes.success, `Reject order failed: ${rejectRes.error}`);
    assert(
      rejectRes.newStatus === 'declined',
      `Expected 'declined', got '${rejectRes.newStatus}'`
    );
    assert(
      rejectRes.customerStatus === 'DECLINED',
      `Expected 'DECLINED', got '${rejectRes.customerStatus}'`
    );
    const verifiedRejected = await fetchSingleOrderFromSupabase(testOrderId2);
    assert(
      verifiedRejected?.notes?.includes('Roastery drum maintenance in progress'),
      'Expected rejection reason to be persisted in order notes'
    );
    console.log(
      `  PASS (Reject Order): ${testOrderId2} Partner status='${rejectRes.newStatus}' -> Customer App sees '${rejectRes.customerStatus}' (Notes: "${verifiedRejected?.notes}")`
    );
  } finally {
    setPartnerBranch('ALL');
    if (connectedToDb) {
      await supabase
        .from(CUSTOMER_DB_TABLES.orderItems)
        .delete()
        .in('order_id', [testOrderId1, testOrderId2]);
      await supabase
        .from(CUSTOMER_DB_TABLES.order)
        .delete()
        .in('id', [testOrderId1, testOrderId2]);
      console.log(
        `\nCleanup complete: Removed temporary E2E test rows (${testOrderId1}, ${testOrderId2}) from public."order_items" and public."order".`
      );
    }
  }

  console.log('\n====================================================================');
  console.log('ALL 7 END-TO-END SHARED SUPABASE WORKFLOW TESTS PASSED.');
  console.log('====================================================================');
}

runEndToEndVerification().catch((err) => {
  console.error('\nE2E TEST SUITE RESULT:', err.message || err);
  process.exit(1);
});

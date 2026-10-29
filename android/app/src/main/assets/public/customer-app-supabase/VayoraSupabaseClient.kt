package com.example.data.remote

import com.example.data.model.Order
import com.example.data.model.OrderStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Shared Supabase Backend Client for VAYORA Customer App (github.com/fatima-hub-code228/vayora)
 * and Quick Shop Partner / Delivery App (github.com/fatima-hub-code228/delivery-app).
 *
 * Shared Customer App Project ID: rbdsjgalxoehuwskzvit
 * Shared Customer App Project URL: https://rbdsjgalxoehuwskzvit.supabase.co
 *
 * Tables Reused (No duplicate plural "orders" table):
 *   - public."order"        (PostgREST endpoint: /rest/v1/order)
 *   - public."order_items"  (PostgREST endpoint: /rest/v1/order_items)
 *   - public."product"      (PostgREST endpoint: /rest/v1/product)
 *   - public."store"        (PostgREST endpoint: /rest/v1/store)
 *
 * Security: Uses only the public publishable/anon key (never service-role keys).
 */
object VayoraSupabaseClient {
    const val SUPABASE_PROJECT_ID = "rbdsjgalxoehuwskzvit"
    const val SUPABASE_URL = "https://rbdsjgalxoehuwskzvit.supabase.co"

    // Provide your public anon key for rbdsjgalxoehuwskzvit via BuildConfig or local.properties
    var SUPABASE_ANON_KEY: String = System.getenv("SUPABASE_ANON_KEY") ?: ""

    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    /**
     * Maps `public."order".status` or `public."order".partner_status` to Customer App `OrderStatus`.
     */
    fun mapSupabaseStatusToCustomerStatus(dbStatus: String?, partnerStatus: String? = null): OrderStatus {
        val raw = (dbStatus?.ifBlank { null } ?: partnerStatus ?: "CONFIRMED").trim().lowercase()
        return when (raw) {
            "incoming", "confirmed", "pending", "new", "placed" -> OrderStatus.CONFIRMED
            "accepted", "cooking", "preparing", "in_kitchen" -> OrderStatus.PREPARING
            "ready_for_pickup", "ready", "dispatched", "out_for_delivery", "on_the_way" -> OrderStatus.ON_THE_WAY
            "completed", "delivered" -> OrderStatus.DELIVERED
            "declined", "rejected", "cancelled", "canceled" -> OrderStatus.DECLINED
            else -> OrderStatus.CONFIRMED
        }
    }

    /**
     * Inserts a newly placed Customer App order into `public."order"` and its line items into
     * `public."order_items"` in https://rbdsjgalxoehuwskzvit.supabase.co so the target Abu Dhabi
     * restaurant/store immediately receives it in the Restaurant App.
     */
    suspend fun insertCustomerOrder(
        order: Order,
        customerName: String,
        customerPhone: String
    ): Result<Order> = withContext(Dispatchers.IO) {
        runCatching {
            require(SUPABASE_ANON_KEY.isNotBlank()) {
                "SUPABASE_ANON_KEY for project $SUPABASE_PROJECT_ID must be configured."
            }

            val deliveryZoneDisplay = buildString {
                append(order.deliveryAddress.zoneName)
                if (order.deliveryAddress.buildingName.isNotBlank()) {
                    append(" • ")
                    append(order.deliveryAddress.buildingName)
                }
                if (order.deliveryAddress.apartmentOrVilla.isNotBlank()) {
                    append(", ")
                    append(order.deliveryAddress.apartmentOrVilla)
                }
            }

            val notesText = buildString {
                append("Store: ${order.storeName} (${order.storeId})")
                append(" | Payment: ${order.paymentMethod}")
                if (customerPhone.isNotBlank()) {
                    append(" | Tel: $customerPhone")
                }
                if (order.deliveryAddress.instructions.isNotBlank()) {
                    append(" | Note: ${order.deliveryAddress.instructions}")
                }
            }

            val deliveryAddressJson = JSONObject().apply {
                put("emirate", order.deliveryAddress.emirate)
                put("zoneId", order.deliveryAddress.zoneId)
                put("zoneName", order.deliveryAddress.zoneName)
                put("buildingName", order.deliveryAddress.buildingName)
                put("apartmentOrVilla", order.deliveryAddress.apartmentOrVilla)
                put("instructions", order.deliveryAddress.instructions)
            }

            val orderPayload = JSONObject().apply {
                put("id", order.id)
                put("store_id", order.storeId)
                put("store_name", order.storeName)
                put("customer_name", customerName.ifBlank { "Fatima Al Mansoori" })
                put("customer_phone", customerPhone)
                put("vip_tier", order.storeName)
                put("status", "CONFIRMED")
                put("partner_status", "incoming")
                put("subtotal_aed", order.subtotalAed)
                put("delivery_fee_aed", order.deliveryFeeAed)
                put("total_aed", order.totalAed)
                put("delivery_zone", deliveryZoneDisplay)
                put("delivery_address", deliveryAddressJson)
                put("payment_method", order.paymentMethod)
                put("notes", notesText)
            }

            // 1. Insert header row into public."order"
            val orderRequest = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/order")
                .addHeader("apikey", SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_ANON_KEY")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .post(orderPayload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(orderRequest).execute().use { response ->
                if (!response.isSuccessful) {
                    val errBody = response.body?.string().orEmpty()
                    throw IllegalStateException("Supabase public.\"order\" insert failed (${response.code}): $errBody")
                }
            }

            // 2. Insert normalized line items into public."order_items"
            val itemsArray = JSONArray()
            order.items.forEach { cartItem ->
                val itemObj = JSONObject().apply {
                    put("order_id", order.id)
                    put("product_id", cartItem.product.id)
                    put("product_name_en", cartItem.product.nameEn)
                    put("product_name_ar", cartItem.product.nameAr)
                    put("quantity", cartItem.quantity)
                    put("unit_price_aed", cartItem.product.priceAed)
                    put("weight_or_portion", cartItem.product.weightOrPortion)
                    put("special_notes", cartItem.specialNotes)
                }
                itemsArray.put(itemObj)
            }

            if (itemsArray.length() > 0) {
                val itemsRequest = Request.Builder()
                    .url("$SUPABASE_URL/rest/v1/order_items")
                    .addHeader("apikey", SUPABASE_ANON_KEY)
                    .addHeader("Authorization", "Bearer $SUPABASE_ANON_KEY")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Prefer", "return=representation")
                    .post(itemsArray.toString().toRequestBody(jsonMediaType))
                    .build()

                httpClient.newCall(itemsRequest).execute().use { response ->
                    if (!response.isSuccessful) {
                        val errBody = response.body?.string().orEmpty()
                        throw IllegalStateException("Supabase public.\"order_items\" insert failed (${response.code}): $errBody")
                    }
                }
            }

            order
        }
    }

    /**
     * Fetches the latest status of an order from `public."order"` in Supabase
     * after the restaurant accepts, updates, or rejects the order in Delivery App.
     */
    suspend fun fetchOrderStatus(orderId: String): Result<OrderStatus> = withContext(Dispatchers.IO) {
        runCatching {
            val cleanId = orderId.trim().removePrefix("#")
            val request = Request.Builder()
                .url("$SUPABASE_URL/rest/v1/order?id=eq.$cleanId&select=id,status,partner_status,courier,notes,updated_at")
                .addHeader("apikey", SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer $SUPABASE_ANON_KEY")
                .get()
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw IllegalStateException("Supabase fetch failed (${response.code})")
                }
                val bodyStr = response.body?.string().orEmpty()
                val arr = JSONArray(bodyStr)
                if (arr.length() == 0) {
                    throw NoSuchElementException("Order $cleanId not found in public.\"order\"")
                }
                val row = arr.getJSONObject(0)
                mapSupabaseStatusToCustomerStatus(
                    row.optString("status"),
                    row.optString("partner_status")
                )
            }
        }
    }

    /**
     * Syncs all customer orders with their live status in `public."order"` in Supabase.
     */
    suspend fun syncOrdersWithSupabase(localOrders: List<Order>): Result<List<Order>> =
        withContext(Dispatchers.IO) {
            runCatching {
                val request = Request.Builder()
                    .url("$SUPABASE_URL/rest/v1/order?select=*&order=updated_at.desc")
                    .addHeader("apikey", SUPABASE_ANON_KEY)
                    .addHeader("Authorization", "Bearer $SUPABASE_ANON_KEY")
                    .get()
                    .build()

                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw IllegalStateException("Supabase public.\"order\" query failed (${response.code})")
                    }
                    val arr = JSONArray(response.body?.string().orEmpty())
                    val statusById = mutableMapOf<String, OrderStatus>()
                    for (i in 0 until arr.length()) {
                        val row = arr.getJSONObject(i)
                        val id = row.optString("id")
                        val status = mapSupabaseStatusToCustomerStatus(
                            row.optString("status"),
                            row.optString("partner_status")
                        )
                        if (id.isNotBlank()) {
                            statusById[id] = status
                        }
                    }

                    localOrders.map { existing ->
                        val remoteStatus = statusById[existing.id]
                        if (remoteStatus != null) existing.copy(status = remoteStatus) else existing
                    }
                }
            }
        }
}

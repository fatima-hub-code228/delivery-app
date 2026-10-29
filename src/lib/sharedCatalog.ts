/**
 * Shared VAYORA Abu Dhabi Registry (Unified Catalog across Customer App & Delivery Partner Portal)
 * Synchronizes:
 *  1. Food Delivery App (Customer App: github.com/fatima-hub-code228/vayora)
 *  2. Delivery App (Restaurant Partner Portal: github.com/fatima-hub-code228/delivery-app)
 *  3. Shared Supabase Backend: https://rbdsjgalxoehuwskzvit.supabase.co
 *     Tables: "category", "order", "order_items", "product", "rider_profile", "store", "user"
 */

export type SharedStoreCategory =
  | 'ALL'
  | 'ROASTERIES_NUTS'
  | 'RESTAURANTS'
  | 'GROCERY'
  | 'SWEETS_CAFES';

export interface SharedVendorStore {
  id: string;
  nameEn: string;
  nameAr: string;
  category: SharedStoreCategory;
  categoryDisplayName: string;
  address: string;
  zoneId: string;
  zoneName: string;
  emirate: string;
  phone: string;
  rating: number;
  reviewCount: number;
  deliveryMinutes: number;
  deliveryFeeAed: number;
  minOrderAed: number;
  isApproved: boolean;
  approvalAuthority: string;
  approvalNumber: string;
  bannerTag: string;
  description: string;
  operatorEmail: string;
}

export interface SharedProduct {
  id: string;
  storeId: string;
  storeName: string;
  nameEn: string;
  nameAr: string;
  description: string;
  priceAed: number;
  weightOrPortion: string;
  category: string;
  stock: number;
  isAvailable: boolean;
  sku: string;
  image: string;
}

export interface SharedAbuDhabiZone {
  id: string;
  nameEn: string;
  nameAr: string;
  district: string;
  deliveryFeeAed: number;
  minOrderAed: number;
  estimatedMinutes: number;
  isServiceable: boolean;
}

export type CustomerOrderStatus = 'CONFIRMED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'DECLINED';
export type PartnerOrderStatus =
  | 'incoming'
  | 'cooking'
  | 'ready_for_pickup'
  | 'completed'
  | 'declined';

/**
 * Normalizes any raw status value from `public."order"` (whether Customer App `OrderStatus`
 * like 'CONFIRMED'/'PREPARING'/'ON_THE_WAY'/'DELIVERED'/'DECLINED' or Partner workflow status
 * like 'incoming'/'cooking'/'ready_for_pickup'/'completed'/'declined') into a canonical PartnerOrderStatus.
 */
export function mapCustomerOrDbStatusToPartnerStatus(
  rawStatus?: string | null,
  partnerStatus?: string | null
): PartnerOrderStatus {
  const candidate = (partnerStatus || rawStatus || 'incoming').trim().toLowerCase();
  if (candidate === 'incoming' || candidate === 'confirmed' || candidate === 'pending' || candidate === 'new' || candidate === 'placed') {
    return 'incoming';
  }
  if (candidate === 'cooking' || candidate === 'preparing' || candidate === 'accepted' || candidate === 'in_kitchen') {
    return 'cooking';
  }
  if (
    candidate === 'ready_for_pickup' ||
    candidate === 'ready' ||
    candidate === 'dispatched' ||
    candidate === 'on_the_way' ||
    candidate === 'out_for_delivery'
  ) {
    return 'ready_for_pickup';
  }
  if (candidate === 'completed' || candidate === 'delivered') {
    return 'completed';
  }
  if (candidate === 'declined' || candidate === 'cancelled' || candidate === 'canceled' || candidate === 'rejected') {
    return 'declined';
  }
  return 'incoming';
}

/**
 * Bidirectional Status Mapping between Customer App (`public."order".status` / `OrderStatus` enum)
 * and Delivery App (`public."order".partner_status` / PartnerOrderStatus)
 */
export function mapPartnerToCustomerStatus(status: string): {
  code: CustomerOrderStatus;
  title: string;
  description: string;
} {
  const normalized = (status || 'incoming').trim().toLowerCase();
  if (normalized === 'incoming' || normalized === 'confirmed' || normalized === 'pending' || normalized === 'new' || normalized === 'placed') {
    return {
      code: 'CONFIRMED',
      title: 'Order Confirmed',
      description: 'Sent to store in Abu Dhabi • Awaiting kitchen acceptance',
    };
  }
  if (normalized === 'cooking' || normalized === 'preparing' || normalized === 'accepted' || normalized === 'in_kitchen') {
    return {
      code: 'PREPARING',
      title: 'Preparing Items',
      description: 'Kitchen/Roastery is actively preparing and packaging your order',
    };
  }
  if (normalized === 'ready_for_pickup' || normalized === 'ready' || normalized === 'dispatched' || normalized === 'on_the_way' || normalized === 'out_for_delivery') {
    return {
      code: 'ON_THE_WAY',
      title: 'Out for Delivery',
      description: 'Order ready / Abu Dhabi courier is on the road',
    };
  }
  if (normalized === 'completed' || normalized === 'delivered') {
    return {
      code: 'DELIVERED',
      title: 'Delivered',
      description: 'Delivered to your Abu Dhabi address',
    };
  }
  if (normalized === 'declined' || normalized === 'cancelled' || normalized === 'canceled' || normalized === 'rejected') {
    return {
      code: 'DECLINED',
      title: 'Order Declined',
      description: 'Store could not fulfill this order',
    };
  }
  return {
    code: 'CONFIRMED',
    title: 'Order Confirmed',
    description: 'Sent to store in Abu Dhabi',
  };
}

export const SHARED_CATEGORIES: { id: SharedStoreCategory; displayName: string; icon: string }[] = [
  { id: 'ALL', displayName: 'All Stores', icon: 'storefront' },
  { id: 'RESTAURANTS', displayName: 'Restaurants', icon: 'restaurant' },
  { id: 'ROASTERIES_NUTS', displayName: 'Roasteries & Nuts', icon: 'coffee' },
  { id: 'SWEETS_CAFES', displayName: 'Sweets & Cafes', icon: 'bakery_dining' },
  { id: 'GROCERY', displayName: 'Grocery & Market', icon: 'local_grocery_store' },
];

/**
 * Unified Abu Dhabi Vendors across Customer App (VayoraData.ABU_DHABI_STORES) + Partner Portal Flagship
 */
export const SHARED_ABU_DHABI_STORES: SharedVendorStore[] = [
  {
    id: 'store_grand_pavilion',
    nameEn: 'The Grand Pavilion • Al Maryah Island',
    nameAr: 'ذا جراند بافيليون • جزيرة المارية',
    category: 'RESTAURANTS',
    categoryDisplayName: 'Restaurants',
    address: 'Al Maryah Island Financial District, Four Seasons Promenade',
    zoneId: 'ad_al_maryah',
    zoneName: 'Al Maryah Island (Financial District)',
    emirate: 'Abu Dhabi',
    phone: '+971 2 600 8800',
    rating: 4.9,
    reviewCount: 3120,
    deliveryMinutes: 25,
    deliveryFeeAed: 10.0,
    minOrderAed: 80.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-90001',
    bannerTag: 'Michelin Guide Executive Dining',
    description:
      'Flagship haute gastronomy venue on Al Maryah Island serving Chilean Sea Bass, Wagyu MB9+, and 24K Gold Truffle Risotto.',
    operatorEmail: 'gm@grandpavilion.ae',
  },
  {
    id: 'store_mosaic',
    nameEn: 'Mosaic Lebanese Restaurant',
    nameAr: 'مطعم موزاييك',
    category: 'RESTAURANTS',
    categoryDisplayName: 'Restaurants',
    address: 'Al Muroor Rd, Al Danah',
    zoneId: 'ad_al_danah',
    zoneName: 'Al Danah / Downtown Abu Dhabi',
    emirate: 'Abu Dhabi',
    phone: '+971 2 622 0909',
    rating: 4.7,
    reviewCount: 2150,
    deliveryMinutes: 35,
    deliveryFeeAed: 6.0,
    minOrderAed: 40.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-11029',
    bannerTag: 'Capital Favorite Grills',
    description:
      'Award-winning Levantine cuisine in central Abu Dhabi. Fresh mezze, charcoal grills, and homemade Arabic breads.',
    operatorEmail: 'partner@mosaiclebanese.ae',
  },
  {
    id: 'store_lebanese_roaster',
    nameEn: 'Lebanese Roaster',
    nameAr: 'محمصة لبنانية',
    category: 'ROASTERIES_NUTS',
    categoryDisplayName: 'Roasteries & Nuts',
    address: 'Sheikh Zayed the First St, Al Danah',
    zoneId: 'ad_al_danah',
    zoneName: 'Al Danah / Downtown Abu Dhabi',
    emirate: 'Abu Dhabi',
    phone: '+971 2 678 1234',
    rating: 4.8,
    reviewCount: 1420,
    deliveryMinutes: 30,
    deliveryFeeAed: 5.0,
    minOrderAed: 30.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-88412',
    bannerTag: 'Iconic Roastery Since 1978',
    description:
      'Renowned Abu Dhabi destination for fresh roasted nuts, artisan coffee beans, dried fruits, and authentic Arabic roastery treats.',
    operatorEmail: 'partner@lebaneseroaster.ae',
  },
  {
    id: 'store_al_rifai',
    nameEn: 'Al Rifai Roastery',
    nameAr: 'الرفاعي للمحامص',
    category: 'ROASTERIES_NUTS',
    categoryDisplayName: 'Roasteries & Nuts',
    address: 'Abu Dhabi Mall, Ground Floor, Al Zahiyah',
    zoneId: 'ad_al_zahiyah',
    zoneName: 'Al Zahiyah (Tourist Club Area)',
    emirate: 'Abu Dhabi',
    phone: '+971 2 645 4848',
    rating: 4.7,
    reviewCount: 890,
    deliveryMinutes: 25,
    deliveryFeeAed: 5.0,
    minOrderAed: 35.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2023-45190',
    bannerTag: 'Premium Kernels & Seeds',
    description:
      'Gourmet mixed kernels, caramelized nuts, and signature roasted snacks packaged with freshness guarantee.',
    operatorEmail: 'partner@alrifai.ae',
  },
  {
    id: 'store_shay_madhboot',
    nameEn: 'Shay Madhboot',
    nameAr: 'شاي مضبوط',
    category: 'SWEETS_CAFES',
    categoryDisplayName: 'Sweets & Cafes',
    address: 'Dihan St, Muroor Sector, Al Hadbat',
    zoneId: 'ad_al_muroor',
    zoneName: 'Al Muroor & Al Hadbat',
    emirate: 'Abu Dhabi',
    phone: '+971 2 621 7308',
    rating: 4.9,
    reviewCount: 3200,
    deliveryMinutes: 20,
    deliveryFeeAed: 5.0,
    minOrderAed: 20.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-99381',
    bannerTag: 'Best Karak & Breakfast',
    description:
      'Beloved Abu Dhabi specialty cafe famous for its slow-simmered saffron Karak tea, warm shakshuka, and traditional breakfast.',
    operatorEmail: 'partner@shaymadhboot.ae',
  },
  {
    id: 'store_bateel',
    nameEn: 'Bateel Boutique',
    nameAr: 'بوتيك بتيل للتمور',
    category: 'SWEETS_CAFES',
    categoryDisplayName: 'Sweets & Cafes',
    address: 'The Galleria Mall, Al Maryah Island',
    zoneId: 'ad_al_maryah',
    zoneName: 'Al Maryah Island (Financial District)',
    emirate: 'Abu Dhabi',
    phone: '+971 2 677 8221',
    rating: 4.9,
    reviewCount: 1800,
    deliveryMinutes: 25,
    deliveryFeeAed: 7.0,
    minOrderAed: 60.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-55112',
    bannerTag: 'Luxury Gourmet Organic Dates',
    description:
      'World-famous gourmet organic dates, artisan chocolates, stuffed date delicacies, and sparkling date juice.',
    operatorEmail: 'partner@bateel.ae',
  },
  {
    id: 'store_al_sultan',
    nameEn: 'Al Sultan Sweets',
    nameAr: 'حلويات السلطان',
    category: 'SWEETS_CAFES',
    categoryDisplayName: 'Sweets & Cafes',
    address: 'Sheikh Rashid Bin Saeed St (Airport Rd), Al Danah',
    zoneId: 'ad_al_danah',
    zoneName: 'Al Danah / Downtown Abu Dhabi',
    emirate: 'Abu Dhabi',
    phone: '+971 2 445 1122',
    rating: 4.7,
    reviewCount: 950,
    deliveryMinutes: 30,
    deliveryFeeAed: 5.0,
    minOrderAed: 35.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-77189',
    bannerTag: 'Fresh Baklava & Warm Kunafa',
    description:
      'Heritage oriental pastry maker in Abu Dhabi crafting authentic cheese kunafa, pistachio baklava, and date maamoul.',
    operatorEmail: 'partner@alsultansweets.ae',
  },
  {
    id: 'store_waitrose',
    nameEn: 'Waitrose & Partners',
    nameAr: 'سوبرماركت ويتزوز',
    category: 'GROCERY',
    categoryDisplayName: 'Grocery & Market',
    address: 'Shams Boutik Mall, Al Reem Island',
    zoneId: 'ad_al_reem',
    zoneName: 'Al Reem Island',
    emirate: 'Abu Dhabi',
    phone: '+971 2 676 8922',
    rating: 4.6,
    reviewCount: 1920,
    deliveryMinutes: 35,
    deliveryFeeAed: 7.0,
    minOrderAed: 50.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2024-67210',
    bannerTag: 'Artisan Bakery & Organic Goods',
    description:
      'Premium grocery destination on Reem Island offering British essentials, organic dairy, sourdough breads, and fresh produce.',
    operatorEmail: 'partner@waitrose.ae',
  },
  {
    id: 'store_lulu',
    nameEn: 'Lulu Hypermarket',
    nameAr: 'لولو هايبرماركت',
    category: 'GROCERY',
    categoryDisplayName: 'Grocery & Market',
    address: 'Al Wahda Mall, Hazza Bin Zayed St, Al Nahyan',
    zoneId: 'ad_al_nahyan',
    zoneName: 'Al Nahyan & Al Wahda',
    emirate: 'Abu Dhabi',
    phone: '+971 2 443 7000',
    rating: 4.5,
    reviewCount: 4500,
    deliveryMinutes: 45,
    deliveryFeeAed: 6.0,
    minOrderAed: 30.0,
    isApproved: true,
    approvalAuthority: 'ADAFSA Food Safety Verified',
    approvalNumber: 'ADAFSA-LIC-2023-33290',
    bannerTag: 'Fresh Daily Market Essentials',
    description:
      "Abu Dhabi's flagship household hypermarket with fresh meat, farm poultry, pantry staples, and bulk roastery items.",
    operatorEmail: 'partner@luluhypermarket.ae',
  },
  {
    id: 'store_unapproved_sample',
    nameEn: 'Corniche Marina Refreshments',
    nameAr: 'مرطبات كورنيش مارينا',
    category: 'RESTAURANTS',
    categoryDisplayName: 'Restaurants',
    address: 'Abu Dhabi Corniche West Promenade',
    zoneId: 'ad_al_bateen',
    zoneName: 'Al Bateen & Marina',
    emirate: 'Abu Dhabi',
    phone: '+971 2 681 0000',
    rating: 3.8,
    reviewCount: 120,
    deliveryMinutes: 40,
    deliveryFeeAed: 7.0,
    minOrderAed: 30.0,
    isApproved: false,
    approvalAuthority: 'ADAFSA Inspection Pending',
    approvalNumber: 'ADAFSA-PENDING-2024',
    bannerTag: 'Awaiting Regulatory Clearance',
    description:
      'New refreshment vendor currently awaiting municipal food safety audit. Ordering is strictly prohibited until licensed.',
    operatorEmail: 'pending@cornichemarina.ae',
  },
];

const DEFAULT_FOOD_IMAGES: Record<string, string> = {
  mains:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA-ga8JLCZID3H46XFVdrhpdnS43kUHGMBM5h5GUh3460jYzuLg2PCLOszOR3zLoSltsnEAfylgywYGde8qv7dYdfxadFAw1AP02MBbWP5JnQbWmVs9Kb30ORtmCtRZE_2SA2-f0BYhu_emBI7Sx2VVmj7BJTEfuG-iCt4qfzYrfl4iOihEs420vKRQBqYARYl6fj71Ugov-kF1aAdbLSFmz-HA6Dsfbpx9RJO5-HV3lT1xZgXOtd4',
  grill:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAs8WyTvu0l60ERcVqbtIDYUXrUqsoQbx0uPNVwbvTVZYsEhM4qRu93kPXdHOQjwSD30g_BSB9VzRpFxJioSKYkZ29Qll93rcPVywnZO5ANZwy82YelgsirUq5H2YlmEBOJFAUGqZlISQAe7tsD_AOxE_7aVVwpHYsF6k5ACA5SOFABrrBcv0Oh0rtdNwepppf81U1cfK428EQnjOAesCSbJ9eA8yhc_mccMM2PY5pt8jlf0r5U2iw',
  risotto:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8szzv4EA-xFJXTJh9_uQO-ffkBwRfg7cwKscFGDq-UXn4duQXDELTdcJ1bYKTwEiPbNObYHDLjZGxW6Kcpcfa1cx4NK1sMyfBjzEoq0W1LvmPNRG8XzHsfGKTXmyTNTR39XN-Kji0ItjFegn_hdtC4VTCNpFY8RpKqDOrWNGwexUezwIpJ2aAOLJ8HOcgXss_A6KKd2XechwprufsW2vGpLaoHgAm70oncq0O08EVlE5fjxkRnXo',
  lobster:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAcLIrkBAVIcTL1Jh01fs5cIXDE-woFis29Xn5AWJI5eM28wznCmR0zd13eSb-PdVeBdJlSSJujan1bUOCl-TOJBCMwVlt1YG1uhbr-28tZNcijqnJdwwFrDDNIXHSxbzI5BljJLsKmuI3BSWWXfiyLtWqkei543it-yj9iGs703KD9V67P93c2Hics5_tbtlc35tDzkFUaU244J4joYsu4U_tn3lfUh7Qu0UHcCDZqGBmYiF8yuBw',
  dessert:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBo8xNtGH5b6L2WycxFdjA3yFEG07Sju7qMlfrqUeeVzooYzlTZ4jFEoD2js0TJsCcdwufiL1oO2texYYgrnH3wtr7TCo2gw6LV3EO30EvTIEc6MVHqSue5lRS3EFydQDkwo-cq2vypZv2xiy8lznaa30jRm9lDEcmHNbQWc7IheFwqogEyRayOqk1_TgnRFvmVB3wphmDwT1023nNHOxEVSNQHw7dXETgrVFqb9TadzPZ4dDegUsE',
  beverage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAMkRg6S-5N1wWIqMGtC0et1nidrt82sUAhTqfVrmMDYbNy7iafETR05Kyq1eO0EKy5_rHXXu-mk_-BoC5nT-yrE8rCrSJSgN8tGaWqD4vO5SAHLJj_gSh03JazihFYwotSUH7CbWbzp6Z-jf1wFg_aBAoi-Gzu5wFuikv6N6IRw27g20lml1SG2ydPmdEXCHiJ4L8Yw_e2ZKFEKBFRbEG3eXnBa-UjvSGkReD_U2Ai6sOW-mYO4tI',
};

/**
 * Complete Unified Product Catalog:
 * Includes the 6 existing Grand Pavilion dishes (DSH-01..DSH-06) + all 27 Customer App products (prod_*)
 */
export const SHARED_PRODUCTS: SharedProduct[] = [
  // Existing Grand Pavilion Flagship Dishes (Preserved in Supabase menu_inventory)
  {
    id: 'DSH-01',
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    nameEn: 'Chilean Sea Bass',
    nameAr: 'قاروص تشيلي مشوي',
    description:
      'Saffron emulsion, roasted baby fennel, citrus beurre blanc, hand-harvested Salicornia.',
    priceAed: 180.0,
    weightOrPortion: '320g fillet',
    category: 'mains',
    stock: 18,
    isAvailable: true,
    sku: 'VAY-SB01',
    image: DEFAULT_FOOD_IMAGES.mains,
  },
  {
    id: 'DSH-02',
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    nameEn: 'Wagyu Ribeye MB9+ (300g)',
    nameAr: 'ريب آي واغيو فاخرة 300 جم',
    description:
      'Charred shallots, Périgord black truffle jus, marrow butter, wild morel mushrooms.',
    priceAed: 340.0,
    weightOrPortion: '300g cut',
    category: 'grill',
    stock: 3,
    isAvailable: true,
    sku: 'VAY-WG02',
    image: DEFAULT_FOOD_IMAGES.grill,
  },
  {
    id: 'DSH-03',
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    nameEn: 'Acquerello Truffle Risotto',
    nameAr: 'ريزوتو الكمأة بالذهب عيار 24',
    description:
      'Aged carnaroli rice, 24K edible gold, winter truffle carpaccio, 36-month Vacche Rosse parmesan.',
    priceAed: 165.0,
    weightOrPortion: '280g plate',
    category: 'mains',
    stock: 25,
    isAvailable: true,
    sku: 'VAY-RS03',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },
  {
    id: 'DSH-04',
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    nameEn: 'Lobster Thermidor Emirati',
    nameAr: 'لوبستر ثيرميدور إماراتي',
    description: 'Whole Maine lobster, Emirati baharat blend, Dijon cream, aged gruyère glaze.',
    priceAed: 290.0,
    weightOrPortion: '650g whole',
    category: 'mains',
    stock: 0,
    isAvailable: false,
    sku: 'VAY-LT04',
    image: DEFAULT_FOOD_IMAGES.lobster,
  },
  {
    id: 'DSH-05',
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    nameEn: 'Saffron & Cardamom Milk Cake',
    nameAr: 'كيكة الحليب بالزعفران والهيل',
    description:
      'Vanilla-cardamom sponge, saffron soaked milk reduction, whipped pistachio chantilly.',
    priceAed: 65.0,
    weightOrPortion: 'Single slice',
    category: 'desserts',
    stock: 30,
    isAvailable: true,
    sku: 'VAY-MC05',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'DSH-06',
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    nameEn: 'Royal Gold Mocktail',
    nameAr: 'موكتيل الذهب الملكي',
    description:
      'Fresh passionfruit, yuzu essence, cold-pressed mint syrup, sparkling elderflower, 24K gold flakes.',
    priceAed: 55.0,
    weightOrPortion: '350ml',
    category: 'desserts',
    stock: 45,
    isAvailable: true,
    sku: 'VAY-RG06',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },

  // Mosaic Lebanese Restaurant (Customer App: store_mosaic)
  {
    id: 'prod_ms_mixed_grill',
    storeId: 'store_mosaic',
    storeName: 'Mosaic Lebanese Restaurant',
    nameEn: 'Mosaic Mixed Grill Platter',
    nameAr: 'مشاوي مشكلة موزاييك',
    description:
      'Juicy shish tawook skewer, tender lamb kebab, beef tikka, grilled onion, tomato & fresh biwas bread.',
    priceAed: 78.0,
    weightOrPortion: 'Generous portion with fries & garlic sauce',
    category: 'Charcoal Grills',
    stock: 24,
    isAvailable: true,
    sku: 'store_mosaic::MS-GR01',
    image: DEFAULT_FOOD_IMAGES.grill,
  },
  {
    id: 'prod_ms_hommos_meat',
    storeId: 'store_mosaic',
    storeName: 'Mosaic Lebanese Restaurant',
    nameEn: 'Hommos with Sautéed Beef & Pine Nuts',
    nameAr: 'حمص باللحمة المفرومة والصنوبر',
    description:
      'Silky chickpea tahini dip topped with warm spiced beef tenderloin and golden pine nuts.',
    priceAed: 34.0,
    weightOrPortion: 'Single bowl with 3 pita breads',
    category: 'Cold & Hot Mezze',
    stock: 30,
    isAvailable: true,
    sku: 'store_mosaic::MS-MZ02',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },
  {
    id: 'prod_ms_tabbouleh',
    storeId: 'store_mosaic',
    storeName: 'Mosaic Lebanese Restaurant',
    nameEn: 'Authentic Lebanese Tabbouleh',
    nameAr: 'تبولة لبنانية طازجة',
    description:
      'Finely chopped parsley, ripe tomatoes, fresh mint, cracked wheat, olive oil and lemon dressing.',
    priceAed: 26.0,
    weightOrPortion: 'Medium salad bowl',
    category: 'Cold & Hot Mezze',
    stock: 35,
    isAvailable: true,
    sku: 'store_mosaic::MS-MZ03',
    image: DEFAULT_FOOD_IMAGES.mains,
  },
  {
    id: 'prod_ms_batata_harra',
    storeId: 'store_mosaic',
    storeName: 'Mosaic Lebanese Restaurant',
    nameEn: 'Spicy Batata Harra',
    nameAr: 'بطاطا حرة بالثوم والكزبرة',
    description:
      'Crispy fried potato cubes tossed with fresh cilantro, crushed garlic, chili flakes and lemon juice.',
    priceAed: 28.0,
    weightOrPortion: 'Shared appetizer plate',
    category: 'Cold & Hot Mezze',
    stock: 28,
    isAvailable: true,
    sku: 'store_mosaic::MS-MZ04',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },

  // Lebanese Roaster (Customer App: store_lebanese_roaster)
  {
    id: 'prod_lr_mixed_nuts',
    storeId: 'store_lebanese_roaster',
    storeName: 'Lebanese Roaster',
    nameEn: 'Extra Super Mixed Roasted Nuts',
    nameAr: 'مكسرات سوبر إكسترا مشكلة',
    description:
      'Freshly roasted cashews, almonds, pistachios, hazelnuts & macadamias with sea salt.',
    priceAed: 45.0,
    weightOrPortion: '500g vacuum sealed',
    category: 'Nuts & Kernels',
    stock: 40,
    isAvailable: true,
    sku: 'store_lebanese_roaster::LR-NT01',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },
  {
    id: 'prod_lr_syrian_pistachio',
    storeId: 'store_lebanese_roaster',
    storeName: 'Lebanese Roaster',
    nameEn: 'Jumbo Roasted Syrian Pistachios',
    nameAr: 'فستق حلبي محمص جامبو',
    description: 'Crispy jumbo roasted pistachios lightly salted with traditional roastery aroma.',
    priceAed: 58.0,
    weightOrPortion: '500g pack',
    category: 'Nuts & Kernels',
    stock: 32,
    isAvailable: true,
    sku: 'store_lebanese_roaster::LR-NT02',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_lr_arabic_coffee',
    storeId: 'store_lebanese_roaster',
    storeName: 'Lebanese Roaster',
    nameEn: 'Ground Arabic Coffee with Green Cardamom',
    nameAr: 'قهوة عربية بالهيل الأخضر',
    description:
      'Medium-dark roasted authentic Arabic coffee blend ground with fragrant green cardamom.',
    priceAed: 28.0,
    weightOrPortion: '250g foil pouch',
    category: 'Coffee & Roastery',
    stock: 50,
    isAvailable: true,
    sku: 'store_lebanese_roaster::LR-CF03',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },
  {
    id: 'prod_lr_dried_apricots',
    storeId: 'store_lebanese_roaster',
    storeName: 'Lebanese Roaster',
    nameEn: 'Malatya Sun-Dried Jumbo Apricots',
    nameAr: 'مشمش مجفف تركي طبيعي',
    description: 'Naturally sun-dried soft whole apricots, sweet and high in natural fiber.',
    priceAed: 26.0,
    weightOrPortion: '400g tub',
    category: 'Dried Fruits',
    stock: 22,
    isAvailable: true,
    sku: 'store_lebanese_roaster::LR-DF04',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_lr_turkish_coffee',
    storeId: 'store_lebanese_roaster',
    storeName: 'Lebanese Roaster',
    nameEn: 'Special Lebanese Blend Turkish Coffee',
    nameAr: 'قهوة تركية خلطة لبنانية',
    description:
      'Finely ground premium Arabica with light cardamom touch for traditional ibrik brewing.',
    priceAed: 24.0,
    weightOrPortion: '250g bag',
    category: 'Coffee & Roastery',
    stock: 35,
    isAvailable: true,
    sku: 'store_lebanese_roaster::LR-CF05',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },

  // Al Rifai Roastery (Customer App: store_al_rifai)
  {
    id: 'prod_rf_kernel_delite',
    storeId: 'store_al_rifai',
    storeName: 'Al Rifai Roastery',
    nameEn: 'Mixed Kernel Delite',
    nameAr: 'مشكل قلوب فاخر',
    description:
      'Signature premium mix of peeled roasted almonds, whole cashews, pistachios and pecan halves.',
    priceAed: 48.0,
    weightOrPortion: '300g resealable bag',
    category: 'Signature Mixes',
    stock: 28,
    isAvailable: true,
    sku: 'store_al_rifai::RF-MX01',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },
  {
    id: 'prod_rf_spicy_corn',
    storeId: 'store_al_rifai',
    storeName: 'Al Rifai Roastery',
    nameEn: 'Chili & Lime Toasted Crunchy Corn',
    nameAr: 'ذرة مقرمشة بالفلفل والليمون',
    description: 'Famous Al Rifai golden crispy roasted giant corn with spicy seasoning.',
    priceAed: 18.0,
    weightOrPortion: '250g bag',
    category: 'Snacks',
    stock: 45,
    isAvailable: true,
    sku: 'store_al_rifai::RF-SN02',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_rf_honey_pecans',
    storeId: 'store_al_rifai',
    storeName: 'Al Rifai Roastery',
    nameEn: 'Honey Glazed Roasted Pecans',
    nameAr: 'بيكان محمص بالعسل الطبيعي',
    description: 'Sweet and savory roasted pecans coated with pure natural honey glaze.',
    priceAed: 42.0,
    weightOrPortion: '250g container',
    category: 'Sweet Roastery',
    stock: 20,
    isAvailable: true,
    sku: 'store_al_rifai::RF-SW03',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },

  // Shay Madhboot (Customer App: store_shay_madhboot)
  {
    id: 'prod_sm_karak',
    storeId: 'store_shay_madhboot',
    storeName: 'Shay Madhboot',
    nameEn: 'Signature Saffron Karak Tea',
    nameAr: 'شاي كرك مضبوط بالزعفران',
    description:
      'Slow boiled black tea with creamy milk, crushed cardamom pods, and Iranian saffron threads.',
    priceAed: 8.0,
    weightOrPortion: 'Regular 350ml cup',
    category: 'Hot Drinks',
    stock: 60,
    isAvailable: true,
    sku: 'store_shay_madhboot::SM-HD01',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },
  {
    id: 'prod_sm_karak_flask',
    storeId: 'store_shay_madhboot',
    storeName: 'Shay Madhboot',
    nameEn: 'Karak 1-Litre Sharing Flask',
    nameAr: 'دلة كرك مضبوط مشاركة 1 لتر',
    description:
      'Insulated thermos flask filled with fresh hot saffron karak tea, serves 5-6 cups.',
    priceAed: 38.0,
    weightOrPortion: '1 Litre flask + 6 cups',
    category: 'Hot Drinks',
    stock: 18,
    isAvailable: true,
    sku: 'store_shay_madhboot::SM-HD02',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },
  {
    id: 'prod_sm_shakshuka',
    storeId: 'store_shay_madhboot',
    storeName: 'Shay Madhboot',
    nameEn: 'Claypot Traditional Shakshuka',
    nameAr: 'شكشوكة فخار على أصولها',
    description:
      'Poached organic eggs in rich spiced tomato, bell pepper, and cumin sauce served with fresh tannour bread.',
    priceAed: 32.0,
    weightOrPortion: 'Includes 2 warm breads',
    category: 'Breakfast & Bites',
    stock: 25,
    isAvailable: true,
    sku: 'store_shay_madhboot::SM-BF03',
    image: DEFAULT_FOOD_IMAGES.mains,
  },
  {
    id: 'prod_sm_brioche',
    storeId: 'store_shay_madhboot',
    storeName: 'Shay Madhboot',
    nameEn: 'Grilled Halloumi & Zaatar Brioche',
    nameAr: 'بروش حلومي مشوي مع زعتر',
    description:
      'Toasted buttery brioche bun filled with grilled Cypriot halloumi, wild zaatar and olive tapenade.',
    priceAed: 28.0,
    weightOrPortion: '1 sandwich',
    category: 'Breakfast & Bites',
    stock: 22,
    isAvailable: true,
    sku: 'store_shay_madhboot::SM-BF04',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },

  // Waitrose & Partners (Customer App: store_waitrose)
  {
    id: 'prod_wt_milk',
    storeId: 'store_waitrose',
    storeName: 'Waitrose & Partners',
    nameEn: 'Waitrose Essential Fresh Milk Full Cream',
    nameAr: 'حليب طازج كامل الدسم ويتزوز',
    description: 'Pasteurized fresh whole milk rich in calcium and natural vitamin D.',
    priceAed: 12.0,
    weightOrPortion: '2 Litre bottle',
    category: 'Dairy & Fridge',
    stock: 40,
    isAvailable: true,
    sku: 'store_waitrose::WT-DF01',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },
  {
    id: 'prod_wt_eggs',
    storeId: 'store_waitrose',
    storeName: 'Waitrose & Partners',
    nameEn: 'Organic Free-Range Large Eggs',
    nameAr: 'بيض عضوي كبير بلدي',
    description: 'Certified free range organic brown eggs from sustainable poultry farms.',
    priceAed: 24.0,
    weightOrPortion: 'Pack of 10',
    category: 'Dairy & Fridge',
    stock: 30,
    isAvailable: true,
    sku: 'store_waitrose::WT-DF02',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },
  {
    id: 'prod_wt_sourdough',
    storeId: 'store_waitrose',
    storeName: 'Waitrose & Partners',
    nameEn: 'Artisan Bakery Seeded Sourdough Loaf',
    nameAr: 'خبز ساوردو مخبوز طازج بالحبوب',
    description:
      'Slow naturally fermented artisan loaf with sunflower, pumpkin, and flax seeds.',
    priceAed: 16.0,
    weightOrPortion: '500g loaf',
    category: 'Bakery',
    stock: 15,
    isAvailable: true,
    sku: 'store_waitrose::WT-BK03',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_wt_avocado',
    storeId: 'store_waitrose',
    storeName: 'Waitrose & Partners',
    nameEn: 'Ripe & Ready Hass Avocados',
    nameAr: 'أفوكادو هاس جاهز للأكل',
    description: 'Creamy buttery Hass avocados perfectly conditioned for salads and toast.',
    priceAed: 19.0,
    weightOrPortion: 'Pack of 3 pieces',
    category: 'Fresh Produce',
    stock: 25,
    isAvailable: true,
    sku: 'store_waitrose::WT-FP04',
    image: DEFAULT_FOOD_IMAGES.mains,
  },

  // Lulu Hypermarket (Customer App: store_lulu)
  {
    id: 'prod_lu_rice',
    storeId: 'store_lulu',
    storeName: 'Lulu Hypermarket',
    nameEn: 'Royal Premium Aged Basmati Rice',
    nameAr: 'أرز بسمتي فاخر رويال 5 كجم',
    description:
      'Extra-long grain naturally aged fragrant aromatic basmati rice for biryanis and mandi.',
    priceAed: 48.0,
    weightOrPortion: '5 kg bag',
    category: 'Pantry Staples',
    stock: 50,
    isAvailable: true,
    sku: 'store_lulu::LU-PS01',
    image: DEFAULT_FOOD_IMAGES.risotto,
  },
  {
    id: 'prod_lu_olive_oil',
    storeId: 'store_lulu',
    storeName: 'Lulu Hypermarket',
    nameEn: 'Extra Virgin Spanish Cold Pressed Olive Oil',
    nameAr: 'زيت زيتون إسباني بكر ممتاز 1 لتر',
    description:
      'First cold pressed natural extra virgin olive oil suitable for cooking and dressings.',
    priceAed: 36.0,
    weightOrPortion: '1 Litre bottle',
    category: 'Pantry Staples',
    stock: 35,
    isAvailable: true,
    sku: 'store_lulu::LU-PS02',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },
  {
    id: 'prod_lu_dates',
    storeId: 'store_lulu',
    storeName: 'Lulu Hypermarket',
    nameEn: 'Premium Jumbo Medjool Dates Gift Box',
    nameAr: 'تمر مجدول فاخر حبة كبيرة 1 كجم',
    description:
      'Soft, luscious large Medjool dates harvested fresh from regional palm groves.',
    priceAed: 55.0,
    weightOrPortion: '1 kg luxury box',
    category: 'Dates & Roastery',
    stock: 28,
    isAvailable: true,
    sku: 'store_lulu::LU-DR03',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },

  // Bateel Boutique (Customer App: store_bateel)
  {
    id: 'prod_bt_wanan_dates',
    storeId: 'store_bateel',
    storeName: 'Bateel Boutique',
    nameEn: 'Organic Wanan Dates Stuffed with Candied Orange',
    nameAr: 'تمور ونان عضوية محشوة بقشر البرتقال',
    description:
      'Signature dark cylindrical organic dates stuffed with artisan candied orange peel strips.',
    priceAed: 95.0,
    weightOrPortion: '350g ballotin box',
    category: 'Gourmet Dates',
    stock: 20,
    isAvailable: true,
    sku: 'store_bateel::BT-GD01',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_bt_khidri_dates',
    storeId: 'store_bateel',
    storeName: 'Bateel Boutique',
    nameEn: 'Khidri Dates with Roasted Caramel Almonds',
    nameAr: 'تمر خضري محشو باللوز المحمص',
    description: 'Sweet chewy Khidri dates filled with whole roasted caramelized almonds.',
    priceAed: 85.0,
    weightOrPortion: '350g box',
    category: 'Gourmet Dates',
    stock: 24,
    isAvailable: true,
    sku: 'store_bateel::BT-GD02',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_bt_sparkling',
    storeId: 'store_bateel',
    storeName: 'Bateel Boutique',
    nameEn: 'Sparkling Date Juice Gold Reserve',
    nameAr: 'عصير التمر الفوار الفاخر',
    description:
      'Non-alcoholic sparkling date beverage with notes of apple and pomegranate.',
    priceAed: 45.0,
    weightOrPortion: '750ml bottle',
    category: 'Gourmet Beverages',
    stock: 30,
    isAvailable: true,
    sku: 'store_bateel::BT-GB03',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },

  // Al Sultan Sweets (Customer App: store_al_sultan)
  {
    id: 'prod_sl_baklava',
    storeId: 'store_al_sultan',
    storeName: 'Al Sultan Sweets',
    nameEn: 'Special Aleppo Pistachio Baklava Assortment',
    nameAr: 'مشكل بقلاوة بالفستق الحلبي الملكي',
    description:
      'Crispy golden layers of phyllo pastry generously filled with bright green pistachios and light syrup.',
    priceAed: 68.0,
    weightOrPortion: '500g tin',
    category: 'Oriental Pastry',
    stock: 25,
    isAvailable: true,
    sku: 'store_al_sultan::SL-OP01',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_sl_kunafa',
    storeId: 'store_al_sultan',
    storeName: 'Al Sultan Sweets',
    nameEn: 'Hot Nabulsiya Cheese Kunafa',
    nameAr: 'كنافة نابلسية بالجبن البلدي ساخنة',
    description:
      'Freshly baked shredded kataifi pastry with stretchy sweet cheese topped with crushed pistachios.',
    priceAed: 32.0,
    weightOrPortion: 'Single plate (350g)',
    category: 'Hot Kunafa',
    stock: 18,
    isAvailable: true,
    sku: 'store_al_sultan::SL-HK02',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },
  {
    id: 'prod_sl_maamoul',
    storeId: 'store_al_sultan',
    storeName: 'Al Sultan Sweets',
    nameEn: 'Traditional Madina Date Maamoul',
    nameAr: 'معمول ملكي بعجوة المدينة',
    description: 'Melt-in-the-mouth semolina cookies filled with pure spiced date paste.',
    priceAed: 45.0,
    weightOrPortion: '500g box (approx 16 pieces)',
    category: 'Oriental Pastry',
    stock: 30,
    isAvailable: true,
    sku: 'store_al_sultan::SL-OP03',
    image: DEFAULT_FOOD_IMAGES.dessert,
  },

  // Unapproved Store (Customer App: store_unapproved_sample)
  {
    id: 'prod_unapproved_1',
    storeId: 'store_unapproved_sample',
    storeName: 'Corniche Marina Refreshments',
    nameEn: 'Corniche Lemon Mint Slush',
    nameAr: 'عصير ليمون ونعناع مثلج',
    description: 'Crushed iced refreshment along the promenade.',
    priceAed: 18.0,
    weightOrPortion: '500ml',
    category: 'Beverages',
    stock: 0,
    isAvailable: false,
    sku: 'store_unapproved_sample::UN-BV01',
    image: DEFAULT_FOOD_IMAGES.beverage,
  },
];

/**
 * Shared Abu Dhabi Service Zones (from Customer App AbuDhabiServiceRegistry.SERVICE_ZONES)
 */
export const SHARED_ABU_DHABI_ZONES: SharedAbuDhabiZone[] = [
  {
    id: 'ad_al_danah',
    nameEn: 'Al Danah / Downtown Abu Dhabi',
    nameAr: 'الدانة / وسط المدينة',
    district: 'Central Capital',
    deliveryFeeAed: 5.0,
    minOrderAed: 30.0,
    estimatedMinutes: 25,
    isServiceable: true,
  },
  {
    id: 'ad_al_zahiyah',
    nameEn: 'Al Zahiyah (Tourist Club Area)',
    nameAr: 'الزاهية / النادي السياحي',
    district: 'Downtown',
    deliveryFeeAed: 5.0,
    minOrderAed: 35.0,
    estimatedMinutes: 25,
    isServiceable: true,
  },
  {
    id: 'ad_al_khalidiya',
    nameEn: 'Al Khalidiya & Corniche',
    nameAr: 'الخالدية والكورنيش',
    district: 'Corniche Sector',
    deliveryFeeAed: 6.0,
    minOrderAed: 40.0,
    estimatedMinutes: 30,
    isServiceable: true,
  },
  {
    id: 'ad_al_reem',
    nameEn: 'Al Reem Island',
    nameAr: 'جزيرة الريم',
    district: 'Island Sector',
    deliveryFeeAed: 7.0,
    minOrderAed: 50.0,
    estimatedMinutes: 30,
    isServiceable: true,
  },
  {
    id: 'ad_al_maryah',
    nameEn: 'Al Maryah Island (Financial District)',
    nameAr: 'جزيرة المارية',
    district: 'Island Sector',
    deliveryFeeAed: 7.0,
    minOrderAed: 60.0,
    estimatedMinutes: 25,
    isServiceable: true,
  },
  {
    id: 'ad_al_bateen',
    nameEn: 'Al Bateen & Marina',
    nameAr: 'البطين والمارينا',
    district: 'West Capital',
    deliveryFeeAed: 7.0,
    minOrderAed: 50.0,
    estimatedMinutes: 35,
    isServiceable: true,
  },
  {
    id: 'ad_al_nahyan',
    nameEn: 'Al Nahyan & Al Wahda',
    nameAr: 'النهيان والوحدة',
    district: 'Central Capital',
    deliveryFeeAed: 6.0,
    minOrderAed: 30.0,
    estimatedMinutes: 25,
    isServiceable: true,
  },
  {
    id: 'ad_al_muroor',
    nameEn: 'Al Muroor & Al Hadbat',
    nameAr: 'المرور والهضبات',
    district: 'Central South',
    deliveryFeeAed: 6.0,
    minOrderAed: 25.0,
    estimatedMinutes: 30,
    isServiceable: true,
  },
  {
    id: 'ad_saadiyat',
    nameEn: 'Saadiyat Island (Cultural District)',
    nameAr: 'جزيرة السعديات',
    district: 'Cultural Sector',
    deliveryFeeAed: 9.0,
    minOrderAed: 80.0,
    estimatedMinutes: 35,
    isServiceable: true,
  },
  {
    id: 'ad_yas_island',
    nameEn: 'Yas Island',
    nameAr: 'جزيرة ياس',
    district: 'Entertainment Sector',
    deliveryFeeAed: 10.0,
    minOrderAed: 80.0,
    estimatedMinutes: 35,
    isServiceable: true,
  },
  {
    id: 'ad_khalifa_city',
    nameEn: 'Khalifa City A',
    nameAr: 'مدينة خليفة أ',
    district: 'Suburban Capital',
    deliveryFeeAed: 10.0,
    minOrderAed: 60.0,
    estimatedMinutes: 40,
    isServiceable: true,
  },
  {
    id: 'ad_mbz_city',
    nameEn: 'Mohamed Bin Zayed City (MBZ)',
    nameAr: 'مدينة محمد بن زايد',
    district: 'Mainland South',
    deliveryFeeAed: 11.0,
    minOrderAed: 60.0,
    estimatedMinutes: 45,
    isServiceable: true,
  },
];

/**
 * Helper to resolve which vendor/store owns an order record in `public.orders`
 */
export function resolveOrderVendor(order: any): {
  storeId: string;
  storeName: string;
  category: SharedStoreCategory;
} {
  // 1. Check items JSONB array for store_id / storeId
  if (Array.isArray(order?.items) && order.items.length > 0) {
    const first = order.items[0];
    const itemStoreId = first.store_id || first.storeId;
    const itemStoreName = first.store_name || first.storeName;
    if (itemStoreId) {
      const matched = SHARED_ABU_DHABI_STORES.find((s) => s.id === itemStoreId);
      if (matched) {
        return { storeId: matched.id, storeName: matched.nameEn, category: matched.category };
      }
      return {
        storeId: itemStoreId,
        storeName: itemStoreName || itemStoreId,
        category: 'RESTAURANTS',
      };
    }
  }

  // 2. Check notes for "Store: <name> (<store_id>)"
  if (typeof order?.notes === 'string') {
    for (const store of SHARED_ABU_DHABI_STORES) {
      if (
        order.notes.includes(store.id) ||
        order.notes.toLowerCase().includes(store.nameEn.toLowerCase())
      ) {
        return { storeId: store.id, storeName: store.nameEn, category: store.category };
      }
    }
  }

  // 3. Check vip_tier if it holds store name
  if (typeof order?.vip_tier === 'string') {
    for (const store of SHARED_ABU_DHABI_STORES) {
      if (order.vip_tier.toLowerCase().includes(store.nameEn.toLowerCase())) {
        return { storeId: store.id, storeName: store.nameEn, category: store.category };
      }
    }
  }

  // 4. Default existing VY-* orders to The Grand Pavilion • Al Maryah Island
  return {
    storeId: 'store_grand_pavilion',
    storeName: 'The Grand Pavilion • Al Maryah Island',
    category: 'RESTAURANTS',
  };
}

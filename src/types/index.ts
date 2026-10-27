export type ScreenId =
  | 'dashboard'
  | 'live-orders'
  | 'order-details'
  | 'menu-inventory'
  | 'add-edit-dish'
  | 'profile-zones'
  | 'analytics-sales'
  | 'settings-tax'
  | 'login';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  subtext?: string;
  dietaryNote?: string;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  vipTier: 'VIP Platinum' | 'VIP Yacht' | 'VIP Tier 1' | 'Standard VIP' | 'Regular';
  deliveryDestination: string;
  status: 'incoming' | 'preparing' | 'ready' | 'dispatched' | 'delivered';
  timeRemaining?: string;
  placedTime: string;
  targetDispatchTime: string;
  items: OrderItem[];
  specialInstruction?: string;
  paymentMethod: string;
  totalAED: number;
  vatAED: number;
  courierName?: string;
  courierRating?: number;
  courierVehicle?: string;
  courierEta?: string;
  handoverCode?: string;
  prepProgress?: number;
  assignedStation?: string;
  assignedChef?: string;
}

export interface MenuItem {
  id: string;
  title: string;
  category: 'starters' | 'mains' | 'grill' | 'desserts';
  categoryLabel: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  badge?: string;
  prepTime: string;
  calories: string;
  dietary: string[];
  image: string;
  isChefSignature?: boolean;
}

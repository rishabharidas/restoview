export type StaffRole = 'GUEST' | 'WAITER' | 'CHEF' | 'DRIVER' | 'ADMIN';

export interface StaffUser {
	id: string;
	name: string;
	role: StaffRole;
	username: string;
	title: string;
	token?: string;
}

export type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';

export type OrderStatus =
	| 'PLACED'
	| 'WAITER_CONFIRMED'
	| 'CHEF_ACCEPTED'
	| 'IN_COOKING'
	| 'BEING_PREPARED'
	| 'PLATING'
	| 'READY_TO_SERVE'
	| 'SERVED'
	| 'DRIVER_ASSIGNED'
	| 'OUT_FOR_DELIVERY'
	| 'DELIVERED'
	| 'COMPLETED'
	| 'CANCELLED';

export type TableBellAction = 'CALL_WAITER' | 'REQUEST_WATER' | 'REQUEST_BILL';

export interface TableBellAlert {
	id: string;
	tenant_id: string;
	table_id: string;
	table_number: string;
	action: TableBellAction;
	action_label: string;
	customer_name?: string;
	notes?: string;
	created_at: string;
}

export interface ItemModifierOption {
	id: string;
	name: string;
	price_diff: number;
}

export interface ItemModifierGroup {
	id: string;
	name: string; // e.g. "Size", "Spice Level", "Add-ons"
	is_required: boolean;
	min_select: number;
	max_select: number;
	options: ItemModifierOption[];
}

export interface MenuItem {
	id: string;
	tenant_id: string;
	category_id: string;
	name: string;
	description?: string;
	price: number;
	food_type: 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
	image_url?: string;
	is_available: boolean;
	kitchen_station?: string;
	preparation_time_mins: number;
	modifiers?: ItemModifierGroup[];
}

export interface MultiplayerCartItem {
	id: string;
	item_id: string;
	item_name: string;
	quantity: number;
	unit_price: number;
	selected_variant?: string;
	selected_addons?: string[];
	special_instructions?: string;
	added_by_name: string;
	added_at: string;
}

export interface TableSession {
	table_id: string;
	table_number: string;
	tenant_id: string;
	diners_count: number;
	items: MultiplayerCartItem[];
	updated_at: string;
}

export interface MenuCategory {
	id: string;
	tenant_id: string;
	name: string;
	description?: string;
	display_order: number;
	is_active: boolean;
	items: MenuItem[];
}

export interface RestaurantTable {
	id: string;
	tenant_id: string;
	outlet_id: string;
	table_number: string;
	qr_code_token: string;
	capacity: number;
	status: string;
	active_order_id?: string;
}

export interface TenantBranding {
	primary_color: string;
	secondary_color: string;
	accent_color?: string;
	font_family?: string;
	logo_url?: string;
	hero_banner_url?: string;
	custom_landing_html?: string;
	landing_mode?: 'DEFAULT' | 'CUSTOM_HTML';
}

export interface TenantSettings {
	currency: string;
	currency_symbol: string;
	tax_gst_percentage: number;
	service_charge_percentage: number;
	enable_dine_in: boolean;
	enable_delivery: boolean;
	enable_takeaway: boolean;
	whatsapp_notifications: boolean;
}

export interface Tenant {
	id: string;
	slug: string;
	name: string;
	phone: string;
	email: string;
	address: string;
	branding: TenantBranding;
	settings: TenantSettings;
}

export interface OrderItemPayload {
	item_id: string;
	quantity: number;
	special_instructions?: string;
}

export interface CreateOrderPayload {
	order_type: OrderType;
	table_id?: string;
	customer_name: string;
	customer_phone: string;
	delivery_address?: string;
	delivery_lat?: number;
	delivery_lng?: number;
	special_instructions?: string;
	items: OrderItemPayload[];
}

export interface Order {
	id: string;
	tenant_id: string;
	outlet_id: string;
	order_number: string;
	order_type: OrderType;
	status: OrderStatus;
	subtotal: number;
	tax_amount: number;
	delivery_fee: number;
	total_amount: number;
	payment_status: string;
	created_at: string;
	items?: Array<{
		id: string;
		item_id: string;
		name?: string;
		quantity: number;
		unit_price: number;
		item_total: number;
		item_status: OrderStatus;
	}>;
}

export interface DriverLocation {
	driver_id: string;
	order_id: string;
	latitude: number;
	longitude: number;
	heading: number;
	speed: number;
	timestamp: string;
}

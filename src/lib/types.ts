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

export interface ItemVariant {
	id: string;
	name: string;
	price_adjustment: number;
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
	assigned_stations?: string[];
	allergens?: string[];
	preparation_time_mins: number;
	variants?: ItemVariant[];
	modifiers?: ItemModifierGroup[];
}

export interface MultiplayerCartItem {
	id: string;
	item_id: string;
	item_name: string;
	quantity: number;
	unit_price: number;
	selected_variant?: string | ItemVariant;
	selected_modifiers?: (string | ItemModifierOption)[];
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

export interface TableOverview {
	id: string;
	tenant_id: string;
	outlet_id: string;
	table_number: string;
	qr_code_token: string;
	capacity: number;
	status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
	active_order_id?: string;
	active_order_number?: string;
	active_order_status?: OrderStatus;
	active_order_total?: number;
	customer_name?: string;
	elapsed_minutes?: number;
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
	variant_id?: string;
	selected_modifiers?: ItemModifierOption[];
	special_instructions?: string;
	assigned_station?: string;
}

export interface CreateOrderPayload {
	idempotency_key?: string;
	order_type: OrderType;
	table_id?: string;
	outlet_id?: string;
	customer_name: string;
	customer_phone: string;
	delivery_address?: string;
	delivery_lat?: number;
	delivery_lng?: number;
	special_instructions?: string;
	items: OrderItemPayload[];
}

export interface OrderItem {
	id: string;
	order_id?: string;
	item_id: string;
	item_name?: string;
	name?: string;
	quantity: number;
	unit_price: number;
	item_total: number;
	item_status: OrderStatus;
	assigned_station?: string;
	special_instructions?: string;
	kitchen_notes?: string;
	completed_at?: string;
	selected_modifiers?: ItemModifierOption[];
}

export interface Order {
	id: string;
	tenant_id: string;
	outlet_id: string;
	order_number: string;
	order_type: OrderType;
	status: OrderStatus;
	table_id?: string;
	table_number?: string;
	customer_name?: string;
	customer_phone?: string;
	subtotal: number;
	tax_amount: number;
	delivery_fee: number;
	total_amount: number;
	payment_status: string;
	created_at: string;
	updated_at?: string;
	items?: OrderItem[];
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

export interface CMSSection {
	id: string;
	page_id: string;
	tenant_id: string;
	section_type: string;
	display_order: number;
	is_enabled: boolean;
	content: Record<string, any>;
	settings: Record<string, any>;
	created_at?: string;
	updated_at?: string;
}

export interface CMSPage {
	id: string;
	tenant_id: string;
	slug: string;
	title: string;
	is_published: boolean;
	meta_description?: string;
	sections: CMSSection[];
}

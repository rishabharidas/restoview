import type {
	Tenant,
	MenuCategory,
	MenuItem,
	RestaurantTable,
	TableOverview,
	CreateOrderPayload,
	Order,
	OrderItem,
	TableBellAction,
	TableSession,
	CMSPage,
	CMSSection
} from './types';

const API_BASE_URL = typeof window !== 'undefined' && (window as any).__PUBLIC_API_URL__
	? (window as any).__PUBLIC_API_URL__
	: 'http://localhost:8080/api/v1';

const WS_BASE_URL = typeof window !== 'undefined' && (window as any).__PUBLIC_WS_URL__
	? (window as any).__PUBLIC_WS_URL__
	: 'ws://localhost:8080/ws';

export function getAuthHeaders(tenantSlug = 'test-resto'): Record<string, string> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'X-Tenant-Slug': tenantSlug
	};
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('resto_jwt_token');
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	}
	return headers;
}

// ---------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------

export async function loginStaff(
	username: string,
	password: string,
	tenantSlug = 'test-resto'
): Promise<{ token: string; user: any }> {
	const res = await fetch(`${API_BASE_URL}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Tenant-Slug': tenantSlug
		},
		body: JSON.stringify({ username, password })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Invalid username or password');
	}
	return res.json();
}

export async function logoutStaff(): Promise<void> {
	try {
		await fetch(`${API_BASE_URL}/auth/logout`, {
			method: 'POST',
			headers: getAuthHeaders()
		});
	} catch (e) {
		// Ignore network failure on logout
	}
	if (typeof window !== 'undefined') {
		localStorage.removeItem('resto_jwt_token');
		localStorage.removeItem('resto_staff_session');
	}
}

// ---------------------------------------------------------------------
// Tenant Configuration
// ---------------------------------------------------------------------

export async function fetchTenantConfig(tenantSlug = 'test-resto'): Promise<Tenant> {
	const res = await fetch(`${API_BASE_URL}/tenant/config`, {
		headers: { 'X-Tenant-Slug': tenantSlug }
	});
	if (!res.ok) throw new Error('Failed to fetch restaurant details');
	return res.json();
}

// ---------------------------------------------------------------------
// Menu Retrieval & 86'ing
// ---------------------------------------------------------------------

export async function fetchMenu(tenantSlug = 'test-resto'): Promise<MenuCategory[]> {
	const res = await fetch(`${API_BASE_URL}/menu`, {
		headers: { 'X-Tenant-Slug': tenantSlug }
	});
	if (!res.ok) throw new Error('Failed to fetch menu');
	return res.json();
}

export async function resolveTableQR(token: string, tenantSlug = 'test-resto'): Promise<RestaurantTable> {
	const res = await fetch(`${API_BASE_URL}/table/qr/${token}`, {
		headers: { 'X-Tenant-Slug': tenantSlug }
	});
	if (!res.ok) throw new Error('Invalid or expired table QR code');
	return res.json();
}

export async function toggleItemAvailability(
	itemId: string,
	isAvailable: boolean,
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/menu/items/${itemId}/availability`, {
		method: 'PATCH',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ is_available: isAvailable })
	});
	if (!res.ok) throw new Error('Failed to update item availability');
	return res.json();
}

// ---------------------------------------------------------------------
// Menu Management (Admin CRUD & CSV Bulk Import)
// ---------------------------------------------------------------------

export async function createMenuCategory(
	payload: { name: string; description?: string; display_order?: number },
	tenantSlug = 'test-resto'
): Promise<MenuCategory> {
	const res = await fetch(`${API_BASE_URL}/menu/categories`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to create category');
	return res.json();
}

export async function updateMenuCategory(
	categoryId: string,
	payload: { name: string; description?: string; display_order?: number; is_active?: boolean },
	tenantSlug = 'test-resto'
): Promise<MenuCategory> {
	const res = await fetch(`${API_BASE_URL}/menu/categories/${categoryId}`, {
		method: 'PUT',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to update category');
	return res.json();
}

export async function deleteMenuCategory(categoryId: string, tenantSlug = 'test-resto'): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/menu/categories/${categoryId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Failed to delete category');
}

export async function createMenuItem(
	payload: Partial<MenuItem>,
	tenantSlug = 'test-resto'
): Promise<{ success: boolean; id: string; item: MenuItem }> {
	const res = await fetch(`${API_BASE_URL}/menu/items`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to create menu item');
	}
	return res.json();
}

export async function updateMenuItem(
	itemId: string,
	payload: Partial<MenuItem>,
	tenantSlug = 'test-resto'
): Promise<{ success: boolean; id: string; item: MenuItem }> {
	const res = await fetch(`${API_BASE_URL}/menu/items/${itemId}`, {
		method: 'PUT',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to update menu item');
	}
	return res.json();
}

export async function deleteMenuItem(itemId: string, tenantSlug = 'test-resto'): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/menu/items/${itemId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Failed to delete menu item');
}

export async function importMenuCSV(
	csvText: string,
	tenantSlug = 'test-resto'
): Promise<{ success: boolean; imported_count: number; message: string }> {
	const res = await fetch(`${API_BASE_URL}/menu/import-csv`, {
		method: 'POST',
		headers: {
			'Content-Type': 'text/csv',
			'X-Tenant-Slug': tenantSlug,
			...(getAuthHeaders(tenantSlug)['Authorization'] ? { 'Authorization': getAuthHeaders(tenantSlug)['Authorization'] } : {})
		},
		body: csvText
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to import CSV');
	}
	return res.json();
}

export async function updateOutletPricing(
	itemId: string,
	outletId: string,
	price: number,
	isAvailable = true,
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/menu/items/${itemId}/outlets/${outletId}`, {
		method: 'PUT',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ price, is_available: isAvailable })
	});
	if (!res.ok) throw new Error('Failed to update outlet price');
	return res.json();
}

// ---------------------------------------------------------------------
// Orders & Fulfillment Pipeline
// ---------------------------------------------------------------------

export async function createOrder(
	payload: CreateOrderPayload,
	tenantSlug = 'test-resto'
): Promise<{
	order_id: string;
	order_number: string;
	total_amount: number;
	status: string;
	tracking_url: string;
}> {
	const res = await fetch(`${API_BASE_URL}/orders`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData.message || 'Failed to place order');
	}
	return res.json();
}

export async function getOrder(orderId: string, tenantSlug = 'test-resto'): Promise<Order> {
	const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Order not found');
	return res.json();
}

export async function fetchOrders(
	options: { active?: boolean; station?: string; type?: string } = {},
	tenantSlug = 'test-resto'
): Promise<Order[]> {
	const params = new URLSearchParams();
	if (options.active) params.set('active', 'true');
	if (options.station) params.set('station', options.station);
	if (options.type) params.set('type', options.type);

	const query = params.toString() ? `?${params.toString()}` : '';
	const res = await fetch(`${API_BASE_URL}/orders${query}`, {
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Failed to fetch orders');
	return res.json();
}

export async function updateOrderStatus(orderId: string, status: string, note = '', tenantSlug = 'test-resto'): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
		method: 'PATCH',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ status, note })
	});
	if (!res.ok) throw new Error('Failed to update order status');
}

export async function cancelOrder(orderId: string, reason = '', tenantSlug = 'test-resto'): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ reason })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to cancel order');
	}
}

export async function updateOrderItemStatus(
	orderId: string,
	itemId: string,
	status: string,
	kitchenNotes = '',
	tenantSlug = 'test-resto'
): Promise<{ success: boolean; order_auto_advanced: boolean }> {
	const res = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, {
		method: 'PATCH',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ status, kitchen_notes: kitchenNotes })
	});
	if (!res.ok) throw new Error('Failed to update item status');
	return res.json();
}

// ---------------------------------------------------------------------
// Waiter Handheld POS & Table Operations
// ---------------------------------------------------------------------

export async function fetchTables(tenantSlug = 'test-resto'): Promise<TableOverview[]> {
	const res = await fetch(`${API_BASE_URL}/tables`, {
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Failed to fetch tables');
	return res.json();
}

export async function appendItemsToOrder(
	tableId: string,
	items: Array<{ item_id: string; quantity: number; special_instructions?: string }>,
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/tables/${tableId}/items`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ items })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to append dishes to order');
	}
	return res.json();
}

export async function transferTable(
	fromTableId: string,
	toTableId: string,
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/tables/transfer`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ from_table_id: fromTableId, to_table_id: toTableId })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to transfer table');
	}
	return res.json();
}

export async function mergeTables(
	sourceTableIds: string[],
	targetTableId: string,
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/tables/merge`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ source_table_ids: sourceTableIds, target_table_id: targetTableId })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to merge tables');
	}
	return res.json();
}

export async function ringTableBell(
	tableId: string,
	action: TableBellAction,
	tableNumber: string,
	customerName = '',
	notes = ''
): Promise<{ success: boolean; message: string }> {
	const res = await fetch(`${API_BASE_URL}/table/${tableId}/bell`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			table_id: tableId,
			table_number: tableNumber,
			action,
			customer_name: customerName,
			notes
		})
	});
	if (!res.ok) throw new Error('Failed to alert server');
	return res.json();
}

export async function getTableCart(tableId: string): Promise<TableSession> {
	const res = await fetch(`${API_BASE_URL}/table/${tableId}/cart`);
	if (!res.ok) throw new Error('Failed to fetch table cart');
	return res.json();
}

export async function syncTableCart(tableId: string, session: Partial<TableSession>): Promise<void> {
	await fetch(`${API_BASE_URL}/table/${tableId}/cart`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(session)
	});
}

export async function generateTableQR(tableNumber: string, capacity: number): Promise<{
	table_id: string;
	table_number: string;
	qr_token: string;
	qr_landing_url: string;
}> {
	const res = await fetch(`${API_BASE_URL}/table/generate-qr`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ table_number: tableNumber, capacity })
	});
	if (!res.ok) throw new Error('Failed to generate table QR');
	return res.json();
}

// ---------------------------------------------------------------------
// Delivery Partner GPS Location
// ---------------------------------------------------------------------

export async function sendDriverLocation(payload: {
	driver_id: string;
	order_id: string;
	latitude: number;
	longitude: number;
	heading: number;
	speed: number;
}): Promise<void> {
	await fetch(`${API_BASE_URL}/delivery/location`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

// ---------------------------------------------------------------------
// Storefront Dynamic CMS Engine
// ---------------------------------------------------------------------

export async function fetchCMSPage(slug = 'home', includeDrafts = false, tenantSlug = 'test-resto'): Promise<{ page: CMSPage }> {
	const query = includeDrafts ? '?all=true' : '';
	const res = await fetch(`${API_BASE_URL}/cms/pages/${slug}${query}`, {
		headers: { 'X-Tenant-Slug': tenantSlug }
	});
	if (!res.ok) throw new Error('Failed to fetch CMS page');
	return res.json();
}

export async function addCMSSection(
	pageSlug: string,
	section: { section_type: string; display_order: number; is_enabled: boolean; content: any; settings: any },
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/cms/pages/${pageSlug}/sections`, {
		method: 'POST',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(section)
	});
	if (!res.ok) throw new Error('Failed to add section');
	return res.json();
}

export async function updateCMSSection(
	sectionId: string,
	section: { section_type: string; display_order: number; is_enabled: boolean; content: any; settings: any },
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/cms/sections/${sectionId}`, {
		method: 'PUT',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(section)
	});
	if (!res.ok) throw new Error('Failed to update section');
	return res.json();
}

export async function deleteCMSSection(sectionId: string, tenantSlug = 'test-resto'): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/cms/sections/${sectionId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Failed to delete section');
}

export async function reorderCMSSections(sectionIds: string[], tenantSlug = 'test-resto'): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/cms/sections/reorder`, {
		method: 'PUT',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify({ section_ids: sectionIds })
	});
	if (!res.ok) throw new Error('Failed to reorder sections');
	return res.json();
}

export async function updateCMSLandingMode(
	payload: { landing_mode: string; custom_landing_html: string },
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/cms/landing-mode`, {
		method: 'PUT',
		headers: getAuthHeaders(tenantSlug),
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to update CMS landing mode');
	return res.json();
}

// ---------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------

export async function createReservation(
	payload: {
		customer_name: string;
		customer_phone: string;
		customer_email?: string;
		guest_count: number;
		reservation_date: string;
		reservation_time: string;
		special_requests?: string;
	},
	tenantSlug = 'test-resto'
): Promise<any> {
	const res = await fetch(`${API_BASE_URL}/reservations`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Tenant-Slug': tenantSlug
		},
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to submit reservation');
	}
	return res.json();
}

export async function fetchReservations(date?: string, tenantSlug = 'test-resto'): Promise<any> {
	const query = date ? `?date=${encodeURIComponent(date)}` : '';
	const res = await fetch(`${API_BASE_URL}/reservations${query}`, {
		headers: getAuthHeaders(tenantSlug)
	});
	if (!res.ok) throw new Error('Failed to fetch reservations');
	return res.json();
}

// ---------------------------------------------------------------------
// WebSocket Connection Hub
// ---------------------------------------------------------------------

export function createWebSocketConnection(
	rooms: string[],
	onMessage: (data: { event: string; payload: any }) => void
): WebSocket | null {
	if (typeof window === 'undefined') return null;

	const wsUrl = `${WS_BASE_URL}?rooms=${encodeURIComponent(rooms.join(','))}`;
	const ws = new WebSocket(wsUrl);

	ws.onmessage = (event) => {
		try {
			const parsed = JSON.parse(event.data);
			onMessage(parsed);
		} catch (e) {
			console.error('Failed to parse WS message', e);
		}
	};

	return ws;
}

import type {
	Tenant,
	MenuCategory,
	RestaurantTable,
	CreateOrderPayload,
	Order,
	TableBellAction,
	TableSession
} from './types';

const API_BASE_URL = typeof window !== 'undefined' && (window as any).__PUBLIC_API_URL__
	? (window as any).__PUBLIC_API_URL__
	: 'http://localhost:8080/api/v1';

const WS_BASE_URL = typeof window !== 'undefined' && (window as any).__PUBLIC_WS_URL__
	? (window as any).__PUBLIC_WS_URL__
	: 'ws://localhost:8080/ws';

export async function fetchTenantConfig(tenantSlug = 'royal-spice'): Promise<Tenant> {
	const res = await fetch(`${API_BASE_URL}/tenant/config`, {
		headers: { 'X-Tenant-Slug': tenantSlug }
	});
	if (!res.ok) throw new Error('Failed to fetch restaurant details');
	return res.json();
}

export async function fetchMenu(tenantSlug = 'royal-spice'): Promise<MenuCategory[]> {
	const res = await fetch(`${API_BASE_URL}/menu`, {
		headers: { 'X-Tenant-Slug': tenantSlug }
	});
	if (!res.ok) throw new Error('Failed to fetch menu');
	return res.json();
}

export async function resolveTableQR(token: string): Promise<RestaurantTable> {
	const res = await fetch(`${API_BASE_URL}/table/qr/${token}`);
	if (!res.ok) throw new Error('Invalid or expired table QR code');
	return res.json();
}

// Milestone 2: Digital Server Call Bell
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

// Milestone 2: Multiplayer Table Cart
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

// Milestone 2: Table QR Stand Generator
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

export async function createOrder(payload: CreateOrderPayload, tenantSlug = 'royal-spice'): Promise<{
	order_id: string;
	order_number: string;
	total_amount: number;
	status: string;
	tracking_url: string;
}> {
	const res = await fetch(`${API_BASE_URL}/orders`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Tenant-Slug': tenantSlug
		},
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData.message || 'Failed to place order');
	}
	return res.json();
}

export async function getOrder(orderId: string): Promise<Order> {
	const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
	if (!res.ok) throw new Error('Order not found');
	return res.json();
}

export async function updateOrderStatus(orderId: string, status: string, note = ''): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status, note })
	});
	if (!res.ok) throw new Error('Failed to update order status');
}

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

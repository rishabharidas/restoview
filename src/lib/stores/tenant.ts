import { writable } from 'svelte/store';
import type { Tenant } from '../types';

export const defaultTenant: Tenant = {
	id: 'a0000000-0000-0000-0000-000000000001',
	slug: 'royal-spice',
	name: 'The Royal Spice Restaurant',
	phone: '+919876543210',
	email: 'contact@royalspice.com',
	address: '123 MG Road, Bangalore, India',
	branding: {
		primary_color: '#e11d48',
		secondary_color: '#1e293b',
		accent_color: '#fbbf24',
		font_family: 'Inter, sans-serif',
		logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
		hero_banner_url: ''
	},
	settings: {
		currency: 'INR',
		currency_symbol: '₹',
		tax_gst_percentage: 5.0,
		service_charge_percentage: 0.0,
		enable_dine_in: true,
		enable_delivery: true,
		enable_takeaway: true,
		whatsapp_notifications: true
	}
};

export const currentTenant = writable<Tenant>(defaultTenant);

export function applyTheme(tenant: Tenant) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	root.style.setProperty('--color-primary', tenant.branding.primary_color || '#e11d48');
	root.style.setProperty('--color-secondary', tenant.branding.secondary_color || '#1e293b');
	root.style.setProperty('--color-accent', tenant.branding.accent_color || '#fbbf24');
}

import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	test('should render restaurant heading and order options', () => {
		render(Page);
		expect(screen.getByText('Delicious Food, Delivered Fast.')).toBeInTheDocument();
		expect(screen.getByText('🛵 Home Delivery')).toBeInTheDocument();
	});
});

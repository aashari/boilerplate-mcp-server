import ipAddressController from './ipaddress.controller.js';
import { ErrorType, McpError } from '../utils/error.util.js';

describe('IP Address Controller', () => {
	describe('get: current IP address', () => {
		it('should return a valid IP address', async () => {
			// Call the function with the real API
			const result = await ipAddressController.get({});

			// Output can be TOON (production) or JSON (test fallback)
			// Check for either format
			const isToon = result.content.includes('status:') && !result.content.startsWith('{');
			const isJson = result.content.startsWith('{');

			expect(isToon || isJson).toBe(true);

			if (isJson) {
				const parsed = JSON.parse(result.content);
				expect(parsed).toHaveProperty('status');
				expect(parsed).toHaveProperty('query');
				expect(parsed).toHaveProperty('country');
				expect(parsed).toHaveProperty('city');
			} else {
				expect(result.content).toContain('status:');
				expect(result.content).toContain('query:');
				expect(result.content).toContain('country:');
				expect(result.content).toContain('city:');
			}
		}, 10000); // Increase timeout for API call

		it('should return JSON format when outputFormat is json', async () => {
			// Call the function with JSON output format
			const result = await ipAddressController.get({ outputFormat: 'json' });

			// Verify the result is valid JSON
			const parsed = JSON.parse(result.content);
			expect(parsed).toHaveProperty('status');
			expect(parsed).toHaveProperty('query');
			expect(parsed).toHaveProperty('country');
		}, 10000);
	});

	describe('get: specific IP address', () => {
		it('should return details for a valid IP address', async () => {
			// Use a known public IP address for testing
			const ipAddress = '8.8.8.8'; // Google's public DNS

			// Call the function with the real API
			const result = await ipAddressController.get({ ipAddress });

			// Output can be TOON or JSON (fallback)
			const isToon = result.content.includes('query: 8.8.8.8');
			const isJson = result.content.startsWith('{');

			expect(isToon || isJson).toBe(true);

			if (isJson) {
				const parsed = JSON.parse(result.content);
				expect(parsed.query).toBe('8.8.8.8');
				expect(parsed.status).toBe('success');
				expect(parsed).toHaveProperty('country');
				expect(JSON.stringify(parsed)).toMatch(/Google/i);
			} else {
				expect(result.content).toContain('query: 8.8.8.8');
				expect(result.content).toContain('status: success');
				expect(result.content).toContain('country:');
				expect(result.content).toMatch(/Google/i);
			}
		}, 10000); // Increase timeout for API call

		it('should apply JQ filter correctly', async () => {
			const ipAddress = '8.8.8.8';

			// Call with a JQ filter to extract specific fields
			const result = await ipAddressController.get({
				ipAddress,
				jq: '{ip: query, country: country}',
				outputFormat: 'json',
			});

			// Verify filtered result
			const parsed = JSON.parse(result.content);
			expect(parsed).toHaveProperty('ip', '8.8.8.8');
			expect(parsed).toHaveProperty('country');
			// Should NOT have other fields
			expect(parsed).not.toHaveProperty('city');
			expect(parsed).not.toHaveProperty('isp');
		}, 10000);

		it('should handle invalid IP addresses', async () => {
			// Use an invalid IP address
			const invalidIp = 'invalid-ip';

			// Call the function with the real API and expect it to throw an McpError
			await expect(
				ipAddressController.get({ ipAddress: invalidIp }),
			).rejects.toThrow(McpError);

			// Try to get the error to verify its properties
			try {
				await ipAddressController.get({ ipAddress: invalidIp });
			} catch (error) {
				// Verify the error is an McpError with the correct type
				expect(error).toBeInstanceOf(McpError);
				expect((error as McpError).type).toBe(ErrorType.API_ERROR);
				expect((error as McpError).message).toContain('IP API error');
			}
		}, 10000); // Increase timeout for API call
	});
});

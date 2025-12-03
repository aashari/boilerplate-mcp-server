import { ErrorType, McpError } from '../utils/error.util.js';
import ipApiService from './vendor.ip-api.com.service.js';
import { config } from '../utils/config.util.js';

/**
 * Helper function to conditionally skip tests in CI environment
 * when we encounter specific rate-limiting errors
 */
function skipIfRateLimited(error: unknown): void {
	// Check if we're in CI and this is a rate limiting error
	if (
		process.env.CI &&
		error instanceof McpError &&
		(error.statusCode === 429 || error.message.includes('rate limit'))
	) {
		// Skip the test in CI environment due to rate limiting
		console.warn(
			'Skipping test in CI due to rate limiting:',
			error.message,
		);
		throw new Error('SKIP_TEST: Rate limited in CI');
	}
	// Otherwise, propagate the error
	throw error;
}

describe('vendor.ip-api.com.service', () => {
	beforeAll(() => {
		// Ensure config is loaded
		config.load();
	});

	describe('get', () => {
		it('should return valid IP details for Google DNS', async () => {
			try {
				// Call the service with a known public IP
				const result = await ipApiService.get('8.8.8.8');

				// Verify it returns the expected data format (ServiceResponse wrapper)
				expect(result).toBeDefined();
				expect(result.data).toBeDefined();
				expect(result.data.status).toBe('success');
				expect(result.data.query).toBe('8.8.8.8');
				expect(result.data.country).toBeDefined();
				expect(result.data.countryCode).toBeDefined();
				// Google DNS should have Google in its organization or ISP
				expect(result.data.org || result.data.isp).toMatch(/Google/i);
				// Verify rawResponsePath is present
				expect(result.rawResponsePath).toBeDefined();
			} catch (error) {
				skipIfRateLimited(error);
			}
		}, 15000); // Increase timeout for network request

		it('should properly handle private IP address errors', async () => {
			try {
				// Call the service and expect it to throw
				await expect(ipApiService.get('192.168.1.1')).rejects.toThrow(
					McpError,
				);

				// Try/catch to get the specific error
				try {
					await ipApiService.get('192.168.1.1');
				} catch (error) {
					expect(error).toBeInstanceOf(McpError);
					expect((error as McpError).type).toBe(ErrorType.API_ERROR);
					expect((error as McpError).statusCode).toBe(400);
					expect((error as McpError).message).toContain(
						'Private IP addresses are not supported',
					);
				}
			} catch (error) {
				skipIfRateLimited(error);
			}
		}, 15000);

		it('should properly handle reserved range IP address errors', async () => {
			try {
				// Call the service and expect it to throw
				await expect(ipApiService.get('127.0.0.1')).rejects.toThrow(
					McpError,
				);

				// Try/catch to get the specific error
				try {
					await ipApiService.get('127.0.0.1');
				} catch (error) {
					expect(error).toBeInstanceOf(McpError);
					expect((error as McpError).type).toBe(ErrorType.API_ERROR);
					expect((error as McpError).statusCode).toBe(400);
					expect((error as McpError).message).toContain(
						'Reserved IP addresses are not supported',
					);
				}
			} catch (error) {
				skipIfRateLimited(error);
			}
		}, 15000);

		it('should reject invalid IP formats', async () => {
			try {
				// Call with an invalid IP format and expect it to throw
				await expect(ipApiService.get('invalid-ip')).rejects.toThrow(
					McpError,
				);

				try {
					await ipApiService.get('invalid-ip');
				} catch (error) {
					expect(error).toBeInstanceOf(McpError);
					expect((error as McpError).type).toBe(ErrorType.API_ERROR);
					expect((error as McpError).message).toContain('error');
				}
			} catch (error) {
				skipIfRateLimited(error);
			}
		}, 15000);

		it('should handle network errors gracefully', async () => {
			try {
				// Call with a non-existent hostname to trigger a network error
				// IP format is valid but points to an invalid host, should cause a network error
				await expect(
					ipApiService.get('0.0.0.0', { useHttps: true }),
				).rejects.toThrow();
			} catch (error) {
				// Skip this test if CI and we received an API error instead of network error
				// (some CI environments might resolve this IP differently)
				if (
					process.env.CI &&
					error instanceof McpError &&
					error.type === ErrorType.API_ERROR
				) {
					console.warn(
						'Skipping network error test in CI due to environment differences',
					);
					return;
				}
				skipIfRateLimited(error);
			}
		}, 15000);
	});
});

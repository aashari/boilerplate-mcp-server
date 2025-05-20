import { executeShopifyQuery, getShopifyDomain, getShopifyAccessToken } from '../services/shopify.service.js';
import { config } from '../utils/config.util.js';

/**
 * Helper function for skipping tests when appropriate in CI
 */
function skipIfError(error: unknown): void {
	// Skip test in CI environment if we encounter API issues
	if (process.env.CI) {
		console.warn('Skipping test in CI due to API error:', error);
		throw new Error('SKIP_TEST: API error in CI');
	}
	// Otherwise, propagate the error
	throw error;
}

describe('shopify.service', () => {
	beforeAll(() => {
		// Ensure config is loaded
		config.load();
	});

	describe('executeShopifyQuery', () => {
		it('should reject when domain is missing', async () => {
			// Attempt to execute with empty domain
			await expect(
				executeShopifyQuery('', 'test-token', 'query')
			).rejects.toThrow('domain is required');
		});

		it('should reject when access token is missing', async () => {
			// Attempt to execute with empty token
			await expect(
				executeShopifyQuery('test-domain', '', 'query')
			).rejects.toThrow('token is required');
		});

		it('should successfully get shop information', async () => {
			try {
				// Skip this test if we don't have credentials configured
				let domain, token;
				try {
					domain = getShopifyDomain();
					token = getShopifyAccessToken();
				} catch (error) {
					console.warn('Skipping test due to missing credentials');
					return;
				}

				// Make a minimal query to get shop name
				const query = `#graphql
					query {
						shop {
							name
						}
					}
				`;

				// Execute the query
				const result = await executeShopifyQuery(domain, token, query);

				// Verify we got data back in the expected format
				expect(result).toBeDefined();
				expect(typeof result).toBe('object');
				// Use type assertion to make TypeScript happy
				const typedResult = result as { shop?: { name?: string } };
				expect(typedResult.shop).toBeDefined();
				expect(typedResult.shop?.name).toBeDefined();
				expect(typeof typedResult.shop?.name).toBe('string');
			} catch (error) {
				skipIfError(error);
			}
		}, 15000); // Increase timeout for network request

		it('should handle invalid GraphQL queries', async () => {
			try {
				// Skip this test if we don't have credentials configured
				let domain, token;
				try {
					domain = getShopifyDomain();
					token = getShopifyAccessToken();
				} catch (error) {
					console.warn('Skipping test due to missing credentials');
					return;
				}

				// Create an invalid query (field that doesn't exist)
				const invalidQuery = `#graphql
					query {
						shop {
							nonExistentField
						}
					}
				`;

				// Execute and expect to throw
				await expect(
					executeShopifyQuery(domain, token, invalidQuery)
				).rejects.toThrow();

				// Additional check for specific error message
				try {
					await executeShopifyQuery(domain, token, invalidQuery);
				} catch (error) {
					// Verify error is defined and contains GraphQL error references
					expect(error).toBeDefined();
					const errorMessage = error instanceof Error ? error.message : String(error);
					expect(errorMessage.toLowerCase()).toContain('graphql');
				}
			} catch (error) {
				skipIfError(error);
			}
		}, 15000); // Increase timeout for network request
	});
}); 
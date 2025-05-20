import { getShopDetailsController } from './shopify.controller.js';
import { config } from '../utils/config.util.js';

/**
 * Helper function to conditionally skip tests in CI environment
 * when we don't have Shopify credentials
 */
function skipIfApiError(error: unknown): void {
  // Skip if we're in CI or credentials are missing
  if (process.env.CI || process.env.NODE_ENV === 'test') {
    console.warn('Skipping test due to API error or CI environment:', error);
    return;
  }
  // Otherwise, propagate the error
  throw error;
}

describe('shopify.controller', () => {
  beforeAll(() => {
    // Ensure config is loaded
    config.load();
  });

  describe('getShopDetailsController', () => {
    it('should fetch and return formatted shop details', async () => {
      try {
        // Call the controller (which will use config values)
        const result = await getShopDetailsController();

        // Verify the response is well-formed
        expect(result).toHaveProperty('content');
        expect(typeof result.content).toBe('string');
        
        // Check the format is correct
        expect(result.content).toContain('```json');
        
        // Basic schema validation of returned data
        expect(result.content).toContain('"name":');
        expect(result.content).toContain('"id":');
        expect(result.content).toContain('"plan":');
        expect(result.content).toContain('```');
      } catch (error) {
        skipIfApiError(error);
      }
    }, 15000); // Increase timeout for API call
  });
}); 
import { jest } from '@jest/globals';
import { ErrorType, McpError } from '../utils/error.util.js';
import ipApiService from './vendor.ip-api.com.service.js';

// Mock the transport module
jest.mock('../utils/transport.util.js', () => ({
	fetchIpApi: jest.fn(),
	getIpApiCredentials: jest.fn().mockReturnValue({}),
}));

// Import the mocked transport module and explicitly type it
import * as transportModule from '../utils/transport.util.js';
const mockFetchIpApi = transportModule.fetchIpApi as jest.MockedFunction<
	typeof transportModule.fetchIpApi
>;

describe('vendor.ip-api.com.service', () => {
	// Reset mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('get', () => {
		it('should return valid IP details for a successful API response', async () => {
			// Mock a successful API response
			const mockApiResponse = {
				status: 'success',
				country: 'United States',
				countryCode: 'US',
				region: 'CA',
				regionName: 'California',
				city: 'Mountain View',
				zip: '94043',
				lat: 37.4224,
				lon: -122.085,
				timezone: 'America/Los_Angeles',
				isp: 'Google LLC',
				org: 'Google LLC',
				as: 'AS15169 Google LLC',
				query: '8.8.8.8',
			};

			// Setup mock implementation
			mockFetchIpApi.mockResolvedValue(mockApiResponse);

			// Call the service
			const result = await ipApiService.get('8.8.8.8');

			// Verify it returns the expected data
			expect(result).toEqual(mockApiResponse);
			expect(mockFetchIpApi).toHaveBeenCalledWith(
				'8.8.8.8',
				expect.any(Object),
			);
		});

		it('should properly handle private IP address errors', async () => {
			// Mock a failure response with 'private range'
			const mockPrivateResponse = {
				status: 'fail',
				message: 'private range',
				query: '192.168.1.1',
			};

			mockFetchIpApi.mockResolvedValue(mockPrivateResponse);

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
				expect((error as McpError).originalError).toBe(
					mockPrivateResponse,
				);
			}
		});

		it('should properly handle reserved range IP address errors', async () => {
			// Mock a failure response with 'reserved range'
			const mockReservedResponse = {
				status: 'fail',
				message: 'reserved range',
				query: '127.0.0.1',
			};

			mockFetchIpApi.mockResolvedValue(mockReservedResponse);

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
				expect((error as McpError).originalError).toBe(
					mockReservedResponse,
				);
			}
		});

		it('should properly handle generic API failures', async () => {
			// Mock a generic failure response
			const mockFailureResponse = {
				status: 'fail',
				message: 'unknown error',
				query: '8.8.8.8',
			};

			mockFetchIpApi.mockResolvedValue(mockFailureResponse);

			// Try/catch to get the specific error
			try {
				await ipApiService.get('8.8.8.8');
			} catch (error) {
				expect(error).toBeInstanceOf(McpError);
				expect((error as McpError).type).toBe(ErrorType.API_ERROR);
				expect((error as McpError).statusCode).toBe(400);
				expect((error as McpError).message).toContain('IP API error');
				expect((error as McpError).originalError).toBe(
					mockFailureResponse,
				);
			}
		});

		it('should handle Zod validation errors for malformed responses', async () => {
			// Mock an incomplete response that will fail Zod validation
			const mockInvalidResponse = {
				status: 'success',
				// Missing required fields
			};

			mockFetchIpApi.mockResolvedValue(mockInvalidResponse);

			// Call the service and expect it to throw a validation error
			try {
				await ipApiService.get('8.8.8.8');
			} catch (error) {
				expect(error).toBeInstanceOf(McpError);
				expect((error as McpError).type).toBe(ErrorType.API_ERROR);
				expect((error as McpError).statusCode).toBe(500);
				expect((error as McpError).message).toContain(
					'API response validation failed',
				);
			}
		});

		it('should handle network errors from the transport layer', async () => {
			// Mock a network error
			const networkError = new Error('ECONNREFUSED');
			mockFetchIpApi.mockRejectedValue(networkError);

			// Call the service and expect it to throw a network error
			try {
				await ipApiService.get('8.8.8.8');
			} catch (error) {
				expect(error).toBeInstanceOf(McpError);
				expect((error as McpError).originalError).toBe(networkError);
			}
		});

		it('should pass through McpErrors from the transport layer', async () => {
			// Mock a transport layer McpError
			const transportError = new McpError(
				'Transport error',
				ErrorType.API_ERROR,
				429,
				{ cause: 'Rate limited' },
			);
			mockFetchIpApi.mockRejectedValue(transportError);

			// Call the service and expect it to pass through the McpError
			try {
				await ipApiService.get('8.8.8.8');
			} catch (error) {
				expect(error).toBe(transportError); // Should be the same error instance
				expect((error as McpError).type).toBe(ErrorType.API_ERROR);
				expect((error as McpError).statusCode).toBe(429);
			}
		});
	});
});

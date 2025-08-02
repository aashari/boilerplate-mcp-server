import { z } from 'zod';
import { Logger } from '../utils/logger.util.js';
import {
	IPDetail,
	IPDetailSchema,
	IPApiRequestOptions,
} from './vendor.ip-api.com.types.js';
import {
	createApiError,
	createUnexpectedError,
	McpError,
} from '../utils/error.util.js';
import { fetchIpApi } from '../utils/transport.util.js';

// Create a contextualized logger for this file
const serviceLogger = Logger.forContext(
	'services/vendor.ip-api.com.service.ts',
);

// Log service initialization
serviceLogger.debug('IP API service initialized');

/**
 * @namespace VendorIpApiService
 * @description Service layer for interacting directly with the ip-api.com vendor API.
 *              Responsible for constructing API requests based on provided parameters
 *              and handling the raw response from the `fetchIpApi` utility.
 */

/**
 * @function get
 * @description Fetches details for a specific IP address or the current device's IP from ip-api.com.
 *              It uses the `fetchIpApi` utility and handles the specific success/failure status returned by ip-api.com.
 * @memberof VendorIpApiService
 * @param {string} [ipAddress] - Optional IP address to look up. If omitted, fetches details for the current device's public IP.
 * @param {IPApiRequestOptions} [options={}] - Optional request options for the ip-api.com service, such as `useHttps`, `fields`, and `lang`.
 * @returns {Promise<IPDetail>} A promise that resolves to the detailed IP information if the API call is successful.
 * @throws {McpError} Throws an `McpError` (specifically `ApiError` or `UnexpectedError`) if:
 *  - The `fetchIpApi` call fails (network error, non-2xx response).
 *  - The ip-api.com response status is not 'success'.
 *  - An unexpected error occurs during processing.
 * @example
 * // Get basic details for 8.8.8.8
 * const details = await get('8.8.8.8');
 * // Get extended details using HTTPS
 * const extendedDetails = await get('1.1.1.1', { useHttps: true, fields: [...] });
 */
async function get(
	ipAddress?: string,
	options: IPApiRequestOptions = {},
): Promise<IPDetail> {
	const methodLogger = Logger.forContext(
		'services/vendor.ip-api.com.service.ts',
		'get',
	);
	methodLogger.debug(`Calling IP API for IP: ${ipAddress || 'current'}`);

	try {
		// Make the API call with correctly typed response
		// Use a more specific type here since we know the API returns at least status + potential message
		const rawData = await fetchIpApi<{
			status: string;
			message?: string;
			[key: string]: unknown;
		}>(ipAddress || '', {
			useHttps: options.useHttps,
			fields: options.fields,
			lang: options.lang,
		});

		// First check API-level success/failure before Zod validation
		// This avoids unnecessary validation errors for known API errors
		if (rawData.status !== 'success') {
			// Handle specific ip-api.com error responses
			if (rawData.message) {
				if (rawData.message.includes('private range')) {
					throw createApiError(
						`Private IP addresses are not supported: ${rawData.message}`,
						400,
						rawData,
					);
				} else if (rawData.message.includes('reserved range')) {
					throw createApiError(
						`Reserved IP addresses are not supported: ${rawData.message}`,
						400,
						rawData,
					);
				}
			}
			throw createApiError(
				`IP API error: ${rawData.message || 'Unknown error'}`,
				400, // Use 400 for client errors from ip-api.com
				rawData,
			);
		}

		// Now parse with Zod for successful responses
		// Validate with Zod schema and return
		const validatedData = IPDetailSchema.parse(rawData);
		methodLogger.debug(
			`Received and validated successful data from IP API`,
		);
		return validatedData;
	} catch (error) {
		methodLogger.error(`Service error fetching IP data`, error);

		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			throw createApiError(
				`API response validation failed: ${error.issues
					.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
					.join(', ')}`,
				500, // Use 500 for validation errors as it's a server-side issue
				error,
			);
		}

		// Rethrow other McpErrors
		if (error instanceof McpError) {
			throw error;
		}

		// Wrap any other unexpected errors
		throw createUnexpectedError(
			'Unexpected service error while fetching IP data',
			error,
		);
	}
}

export default { get };

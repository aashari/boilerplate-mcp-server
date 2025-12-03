import { Logger } from './logger.util.js';
import { config } from './config.util.js';
import {
	createApiError,
	createAuthInvalidError,
	createUnexpectedError,
	McpError,
} from './error.util.js';
import { saveRawResponse } from './response.util.js';

// Create a contextualized logger for this file
const transportLogger = Logger.forContext('utils/transport.util.ts');

// Log transport utility initialization
transportLogger.debug('Transport utility initialized');

/**
 * Interface for IP API credentials.
 * Note: API token is optional for the free tier.
 */
export interface IpApiCredentials {
	apiToken?: string;
}

/**
 * Interface for HTTP request options
 */
export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	headers?: Record<string, string>;
	body?: unknown;
}

/**
 * Transport response wrapper that includes the data and the path to the raw response file
 */
export interface TransportResponse<T> {
	data: T;
	rawResponsePath: string | null;
}

/**
 * Retrieves IP API credentials from configuration.
 * Specifically checks for IPAPI_API_TOKEN.
 * @returns IpApiCredentials object containing the API token if found.
 */
export function getIpApiCredentials(): IpApiCredentials {
	const methodLogger = Logger.forContext(
		'utils/transport.util.ts',
		'getIpApiCredentials',
	);

	const apiToken = config.get('IPAPI_API_TOKEN');

	if (!apiToken) {
		methodLogger.debug(
			'No IP API token found (IPAPI_API_TOKEN). Using free tier.',
		);
		return {}; // Return empty object if no token
	} else {
		methodLogger.debug('Using IP API token from configuration.');
		return { apiToken };
	}
}

/**
 * Fetches data specifically from the ip-api.com endpoint.
 * Handles URL construction, authentication (if token provided), and query parameters.
 * Relies on the generic fetchApi function for the actual HTTP request.
 *
 * @param path The specific IP address or path component (e.g., "8.8.8.8"). Empty string for current IP.
 * @param options Additional options like HTTP method, headers, body, and ip-api specific params.
 * @param options.useHttps - Use HTTPS (requires paid plan for ip-api.com). Defaults to false.
 * @param options.fields - Specific fields to request from ip-api.com.
 * @param options.lang - Language code for response data.
 * @returns Transport response with data and raw response path.
 * @throws {McpError} If the request fails, including network errors, API errors, or parsing issues.
 */
export async function fetchIpApi<T>(
	path: string,
	options: RequestOptions & {
		useHttps?: boolean;
		fields?: string[];
		lang?: string;
	} = {},
): Promise<TransportResponse<T>> {
	const methodLogger = Logger.forContext(
		'utils/transport.util.ts',
		'fetchIpApi',
	);

	// Get credentials (token might be undefined)
	const credentials = getIpApiCredentials();

	// Determine protocol based on options
	const protocol = options.useHttps ? 'https' : 'http';
	const baseUrl = `${protocol}://ip-api.com/json`;

	// Format path for URL
	const normalizedPath = path ? `/${path}` : '';
	let url = `${baseUrl}${normalizedPath}`;

	// Build query parameters
	const queryParams = new URLSearchParams();

	// Add API token if present
	if (credentials.apiToken) {
		queryParams.set('key', credentials.apiToken);
		methodLogger.debug('API token added to query parameters.');
	}

	// Add fields parameter
	if (options.fields?.length) {
		queryParams.set('fields', options.fields.join(','));
		methodLogger.debug(`Requesting fields: ${options.fields.join(',')}`);
	}

	// Add language parameter
	if (options.lang) {
		queryParams.set('lang', options.lang);
		methodLogger.debug(`Requesting language: ${options.lang}`);
	}

	// Append query string if needed
	const queryString = queryParams.toString();
	if (queryString) {
		url += `?${queryString}`;
	}

	methodLogger.debug(`Constructed URL: ${url}`);

	// Delegate the actual fetch call to the generic fetchApi
	return fetchApi<T>(url, {
		method: options.method,
		headers: options.headers,
		body: options.body,
	});
}

/**
 * Generic and reusable function to fetch data from any API endpoint.
 * Handles standard HTTP request setup, response checking, basic error handling, and logging.
 *
 * @param url The full URL to fetch data from.
 * @param options Request options including method, headers, and body.
 * @returns Transport response with data and raw response path.
 * @throws {McpError} If the request fails, including network errors, non-OK HTTP status, or JSON parsing issues.
 */
export async function fetchApi<T>(
	url: string,
	options: RequestOptions = {},
): Promise<TransportResponse<T>> {
	const methodLogger = Logger.forContext(
		'utils/transport.util.ts',
		'fetchApi',
	);

	// Prepare standard request options
	const requestOptions: RequestInit = {
		method: options.method || 'GET',
		headers: {
			// Standard headers, allow overrides via options.headers
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...options.headers,
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
	};

	methodLogger.debug(`Executing API call: ${requestOptions.method} ${url}`);
	const startTime = performance.now(); // Track performance

	try {
		const response = await fetch(url, requestOptions);
		const endTime = performance.now();
		const duration = (endTime - startTime).toFixed(2);

		methodLogger.debug(
			`API call completed in ${duration}ms with status: ${response.status} ${response.statusText}`,
			{ url, status: response.status },
		);

		// Check if the response status is OK (2xx)
		if (!response.ok) {
			const errorText = await response.text(); // Get error body for context
			methodLogger.error(
				`API error response (${response.status}):`,
				errorText,
			);

			// Classify standard HTTP errors
			if (response.status === 401) {
				// Use createAuthInvalidError for consistency, even if ip-api uses keys
				throw createAuthInvalidError(
					'Authentication failed. Check API token if required.',
				);
			} else if (response.status === 403) {
				// Use createAuthInvalidError or a more specific permission error if needed
				throw createAuthInvalidError(
					'Permission denied for the requested resource.',
				);
			} else if (response.status === 404) {
				throw createApiError(
					'Resource not found at the specified URL.',
					response.status,
					errorText,
				);
			} else {
				// Generic API error for other non-2xx statuses
				throw createApiError(
					`API request failed with status ${response.status}: ${response.statusText}`,
					response.status,
					errorText,
				);
			}
		}

		// Attempt to parse the response body as JSON
		try {
			const responseData = await response.json();
			methodLogger.debug('Response body successfully parsed as JSON.');

			// Save raw response to file and capture the path
			const rawResponsePath = saveRawResponse(
				url,
				requestOptions.method || 'GET',
				options.body,
				responseData,
				response.status,
				parseFloat(duration),
			);

			return { data: responseData as T, rawResponsePath };
		} catch (parseError) {
			methodLogger.error(
				'Failed to parse API response JSON:',
				parseError,
			);
			// Throw a specific error for JSON parsing failure
			throw createApiError(
				`Failed to parse API response JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
				response.status, // Include original status for context
				parseError,
			);
		}
	} catch (error) {
		const endTime = performance.now();
		const duration = (endTime - startTime).toFixed(2);
		methodLogger.error(
			`API call failed after ${duration}ms for ${url}:`,
			error,
		);

		// Rethrow if it's already an McpError (e.g., from status checks or parsing)
		if (error instanceof McpError) {
			throw error;
		}

		// Handle potential network errors (TypeError in fetch)
		if (error instanceof TypeError) {
			throw createApiError(
				`Network error during API call: ${error.message}`,
				undefined, // No specific HTTP status for network errors
				error,
			);
		}

		// Wrap any other unexpected errors
		throw createUnexpectedError(
			`Unexpected error during API call: ${error instanceof Error ? error.message : String(error)}`,
			error,
		);
	}
}

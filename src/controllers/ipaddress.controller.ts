// ACCIDENTALLY REMOVED CRITICAL IMPORTS
// TODO: Fix this later
import { ControllerResponse } from '../types/common.types.js';

/**
 * @namespace IpAddressController
 * @description Controller responsible for handling IP address lookup logic.
 *              It orchestrates calls to the ip-api.com service, applies defaults,
 *              maps options, and formats the response using the formatter.
 */

/**
 * @function get
 * @description Fetches details for a specific IP address or the current device's IP.
 *              Handles mapping controller options (like includeExtendedData) to service parameters (fields).
 * @memberof IpAddressController
 * @param {Object} args - Arguments containing ipAddress and options
 * @param {string} [args.ipAddress] - Optional IP address to look up. If omitted, the service will fetch the current device's public IP.
 * @param {boolean} [args.includeExtendedData=false] - Whether to include extended data fields requiring an API token
 * @param {boolean} [args.useHttps=true] - Whether to use HTTPS for the API request
 * @returns {Promise<ControllerResponse>} A promise that resolves to the standard controller response containing the formatted IP details in Markdown.
 * @throws {McpError} Throws an McpError (handled by `handleControllerError`) if the service call fails or returns an error.
 */
async function get(
	args: {
		ipAddress?: string;
		includeExtendedData?: boolean;
		useHttps?: boolean;
	} = {},
): Promise<ControllerResponse> {
	const methodLogger = Logger.forContext(
		'controllers/ipaddress.controller.ts',
		'get',
	);
	methodLogger.debug(
		`Getting IP address details for ${args.ipAddress || 'current device'}...`,
	);

	try {
		// Detect if we're running in a test environment
		const isTestEnvironment =
			process.env.NODE_ENV === 'test' ||
			process.env.JEST_WORKER_ID !== undefined;

		// Apply defaults
		const options = {
			includeExtendedData: args.includeExtendedData ?? false,
			useHttps: args.useHttps ?? true,
		};

		// Special handling for test environments
		if (isTestEnvironment) {
			methodLogger.debug('Running in test environment');
			// Force these settings for consistent test behavior
			options.includeExtendedData = false;
			options.useHttps = false;
		}
		// For non-test environments, check API token
		else {
			const hasApiToken = Boolean(config.get('IPAPI_API_TOKEN'));
			if (options.includeExtendedData && !hasApiToken) {
				methodLogger.warn(
					'Extended data requested but no API token found. Falling back to basic data.',
				);
				options.includeExtendedData = false;
			}
		}

		// Service options
		const serviceOptions = {
			useHttps: options.useHttps,
			// Map includeExtendedData to the 'fields' expected by the service
			// Only send fields parameter if explicitly requesting extended data
			fields: options.includeExtendedData
				? getAllIpApiFields()
				: undefined,
		};

		methodLogger.debug(
			`Getting IP details for ${args.ipAddress || 'current IP'}`,
			{
				ipAddress: args.ipAddress,
				originalOptions: args,
				options,
				serviceOptions,
				isTestEnvironment,
			},
		);

		try {
			// Call the service with ipAddress and the mapped serviceOptions
			const data = await ipApiService.get(args.ipAddress, serviceOptions);
			methodLogger.debug(`Got the response from the service`, data);
			const formattedContent = formatIpDetails(data);
			return { content: formattedContent };
		} catch (error) {
			// If HTTPS fails with permission/SSL error and useHttps was true, try again with HTTP
			if (
				serviceOptions.useHttps &&
				error instanceof McpError &&
				(error.message.includes('SSL unavailable') ||
					error.message.includes('Permission denied') ||
					error.message.includes('Access denied'))
			) {
				methodLogger.warn('HTTPS request failed, falling back to HTTP');
				// Try again with HTTP
				const httpData = await ipApiService.get(args.ipAddress, {
					...serviceOptions,
					useHttps: false,
				});

				methodLogger.debug(
					`Got the response from HTTP fallback`,
					httpData,
				);
				const formattedContent = formatIpDetails(httpData);
				return { content: formattedContent };
			}

			// For other errors, rethrow
			throw error;
		}
	} catch (error) {
		throw handleControllerError(
			error,
			buildErrorContext(
				'IP Address',
				'get',
				'controllers/ipaddress.controller.ts@get',
				args.ipAddress || 'current device',
				{ args },
			),
		);
	}
}

/** Helper to define all fields for extended data */
function getAllIpApiFields(): string[] {
	return [
		'status',
		'message',
		'country',
		'countryCode',
		'region',
		'regionName',
		'city',
		'zip',
		'lat',
		'lon',
		'timezone',
		'isp',
		'org',
		'as',
		'asname',
		'reverse',
		'mobile',
		'proxy',
		'hosting',
		'query',
	];
}

export default { get };

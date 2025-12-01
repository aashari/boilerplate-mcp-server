import { Logger } from './logger.util.js';

const logger = Logger.forContext('utils/toon.util.ts');

/**
 * Type definition for the TOON encode function
 */
type ToonEncode = (input: unknown, options?: { indent?: number }) => string;

/**
 * Cached TOON encoder to avoid repeated dynamic imports
 */
let toonEncode: ToonEncode | null = null;

/**
 * Dynamically loads the TOON encoder module.
 * Uses dynamic import because @toon-format/toon is an ESM-only package.
 *
 * @returns Promise resolving to the encode function or null if loading fails
 */
async function loadToonEncoder(): Promise<ToonEncode | null> {
	const methodLogger = logger.forMethod('loadToonEncoder');

	// Return cached encoder if available
	if (toonEncode) {
		return toonEncode;
	}

	try {
		methodLogger.debug('Loading TOON encoder module...');
		// Dynamic import for ESM module in CommonJS project
		const toon = await import('@toon-format/toon');
		toonEncode = toon.encode;
		methodLogger.debug('TOON encoder loaded successfully');
		return toonEncode;
	} catch (error) {
		methodLogger.error('Failed to load TOON encoder', error);
		return null;
	}
}

/**
 * Convert data to TOON format with JSON fallback.
 *
 * TOON (Token-Oriented Object Notation) is 30-60% more token-efficient than JSON
 * for tabular data, making it ideal for LLM responses.
 *
 * @param data - The data to convert
 * @param jsonFallback - JSON string to return if TOON encoding fails
 * @returns TOON formatted string, or JSON fallback on failure
 *
 * @example
 * const json = JSON.stringify(data, null, 2);
 * const output = await toToonOrJson(data, json);
 */
export async function toToonOrJson(
	data: unknown,
	jsonFallback: string,
): Promise<string> {
	const methodLogger = logger.forMethod('toToonOrJson');

	try {
		const encode = await loadToonEncoder();
		if (!encode) {
			methodLogger.debug(
				'TOON encoder not available, using JSON fallback',
			);
			return jsonFallback;
		}

		const result = encode(data, { indent: 2 });
		methodLogger.debug('Successfully converted to TOON format');
		return result;
	} catch (error) {
		methodLogger.error('TOON encoding failed, using JSON fallback', error);
		return jsonFallback;
	}
}

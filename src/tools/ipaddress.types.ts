import { z } from 'zod';

/**
 * Output format options for API responses
 * - toon: Token-Oriented Object Notation (default, more token-efficient for LLMs)
 * - json: Standard JSON format
 */
export const OutputFormat = z
	.enum(['toon', 'json'])
	.optional()
	.describe(
		'Output format: "toon" (default, 30-60% fewer tokens) or "json". TOON is optimized for LLMs with tabular arrays and minimal syntax.',
	);

/**
 * Zod schema for the IP address tool arguments.
 */
export const IpAddressToolArgs = z
	.object({
		// Note: The ipAddress itself is handled as a separate optional positional argument in the tool/CLI,
		// not as part of the options object validated by this schema.
		includeExtendedData: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				'Whether to include extended data (ASN, host, organization, etc.). Requires API token.',
			),
		useHttps: z
			.boolean()
			.optional()
			.default(true)
			.describe('Whether to use HTTPS for the API call (recommended).'),
		jq: z
			.string()
			.optional()
			.describe(
				'JMESPath expression to filter/transform the response. IMPORTANT: Always use this to extract only needed fields and reduce token costs. Examples: "{ip: query, country: country}" (extract specific fields), "lat" (single field). See https://jmespath.org',
			),
		outputFormat: OutputFormat,
	})
	.strict();

/**
 * TypeScript type inferred from the IpAddressToolArgs Zod schema.
 * This represents the optional arguments passed to the tool handler and controller.
 */
export type IpAddressToolArgsType = z.infer<typeof IpAddressToolArgs>;

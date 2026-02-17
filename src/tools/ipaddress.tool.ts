import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import { IpAddressToolArgs } from './ipaddress.types.js';
import { formatErrorForMcpTool } from '../utils/error.util.js';
import { truncateForAI } from '../utils/formatter.util.js';
import { z } from 'zod';

import ipAddressController from '../controllers/ipaddress.controller.js';

/**
 * Zod schema for the tool arguments, combining the optional positional IP address
 * and the options object.
 */
const GetIpDetailsToolSchema = z.object({
	ipAddress: z
		.string()
		.optional()
		.describe('IP address to lookup (omit for current IP)'),
	...IpAddressToolArgs.shape, // Merge options schema
});

/**
 * @function handleGetIpDetails
 * @description MCP Tool handler to retrieve details for a given IP address (or the current IP).
 *              It calls the ipAddressController to fetch the data and formats the response for the MCP.
 *
 * @param {GetIpDetailsToolArgsType} args - Combined arguments (ipAddress + options) provided to the tool.
 * @returns {Promise<{ content: Array<{ type: 'text', text: string }> }>} Formatted response for the MCP.
 * @throws {McpError} Formatted error if the controller or service layer encounters an issue.
 */
async function handleGetIpDetails(args: Record<string, unknown>) {
	const methodLogger = Logger.forContext(
		'tools/ipaddress.tool.ts',
		'handleGetIpDetails',
	);
	methodLogger.debug(
		`Getting IP address details for ${args.ipAddress || 'current IP'}...`,
		args,
	);

	try {
		// Pass args directly to the controller
		const result = await ipAddressController.get(args);
		methodLogger.debug(`Got the response from the controller`, result);

		// Format the response for the MCP tool, applying truncation for large responses
		return {
			content: [
				{
					type: 'text' as const,
					text: truncateForAI(result.content, result.rawResponsePath),
				},
			],
		};
	} catch (error) {
		methodLogger.error(
			`Error getting details for IP: ${args.ipAddress || 'current IP'}`,
			error,
		);
		return formatErrorForMcpTool(error);
	}
}

/**
 * Tool description for ip_get_details
 */
const IP_GET_DETAILS_DESCRIPTION = `Retrieve geolocation and network information for a public IP address. Returns TOON format by default (30-60% fewer tokens than JSON).

**IMPORTANT - Cost Optimization:**
- Use \`jq\` param to extract only needed fields. Unfiltered responses are expensive!
- Example: \`jq: "{ip: query, country: country, city: city}"\` - extract specific fields
- If unsure about available fields, first call WITHOUT jq filter to see all fields, then use jq in subsequent calls

**Schema Discovery Pattern:**
1. First call: \`ipAddress: "8.8.8.8"\` (no jq) - explore available fields
2. Then use: \`jq: "{ip: query, location: {city: city, country: country}}"\` - extract only what you need

**Output format:** TOON (default, token-efficient) or JSON (\`outputFormat: "json"\`)

**Parameters:**
- \`ipAddress\` - IP to lookup (omit for current device's public IP)
- \`includeExtendedData\` - Include ASN, host, proxy detection (requires API token)
- \`useHttps\` - Use HTTPS (default: true)
- \`jq\` - JMESPath expression to filter response
- \`outputFormat\` - "toon" (default) or "json"

**JQ examples:** \`query\` (IP only), \`{ip: query, country: country}\`, \`{location: {lat: lat, lon: lon}}\`

**Note:** Cannot lookup private IPs (192.168.x.x, 10.x.x.x). Powered by ip-api.com.`;

/**
 * @function registerTools
 * @description Registers the IP address lookup tool ('ip_get_details') with the MCP server.
 *              Uses the modern registerTool API (SDK v1.22.0+) instead of deprecated tool() method.
 *
 * @param {McpServer} server - The MCP server instance.
 */
function registerTools(server: McpServer) {
	const methodLogger = Logger.forContext(
		'tools/ipaddress.tool.ts',
		'registerTools',
	);
	methodLogger.debug(`Registering IP address tools...`);

	// Use the modern registerTool API (SDK v1.22.0+)
	// Following SDK best practices: title for UI display, description for details
	server.registerTool(
		'ip_get_details',
		{
			title: 'IP Address Lookup',
			description: IP_GET_DETAILS_DESCRIPTION,
			inputSchema: GetIpDetailsToolSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
		},
		handleGetIpDetails,
	);

	methodLogger.debug('Successfully registered ip_get_details tool.');
}

export default { registerTools };

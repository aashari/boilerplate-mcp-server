import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import { formatErrorForMcpTool } from '../utils/error.util.js';
import { z } from 'zod';
import ipAddressController from '../controllers/ipaddress.controller.js';

const logger = Logger.forContext('tools/ipaddress-link.tool.ts');

/**
 * Zod schema for the resource-link tool arguments
 */
const GetIpDetailsLinkToolSchema = z.object({
	ipAddress: z
		.string()
		.optional()
		.describe('IP address to lookup (omit for current IP)'),
	includeExtendedData: z
		.boolean()
		.optional()
		.describe('Include extended data (ASN, host, proxy detection)'),
});

/**
 * Tool description for ip_get_details_link
 */
const IP_GET_DETAILS_LINK_DESCRIPTION = `Retrieve IP address details and return as a resource reference (ResourceLink pattern).

**This demonstrates the ResourceLink pattern** - instead of embedding full data inline, the tool returns a reference to a resource. This is useful for:
- Large responses that would consume many tokens
- Data that clients may cache and reuse
- Responses that other tools can reference

**When to use ResourceLink vs inline content:**
- ResourceLink: Large data, cacheable, reusable across multiple tools
- Inline: Small data, one-time use, immediate context

**Parameters:**
- \`ipAddress\` - IP to lookup (omit for current device's public IP)
- \`includeExtendedData\` - Include ASN, host, proxy detection (requires API token)

**Returns:** A resource reference (resourceLink) instead of inline text.

**Note:** Cannot lookup private IPs (192.168.x.x, 10.x.x.x). Powered by ip-api.com.`;

/**
 * Handle IP lookup with ResourceLink pattern
 */
async function handleGetIpDetailsLink(args: Record<string, unknown>) {
	const methodLogger = logger.forMethod('handleGetIpDetailsLink');
	methodLogger.debug(
		`Getting IP address details link for ${args.ipAddress || 'current IP'}...`,
		args,
	);

	try {
		// First, verify we can get the data
		const result = await ipAddressController.get(args);

		// Extract the actual IP from the result
		// The result.content includes the IP in TOON or JSON format
		const ipMatch = result.content.match(/query[:\s]+([0-9.]+)/);
		const actualIp =
			ipMatch?.[1] || (args.ipAddress as string) || 'current';

		methodLogger.debug(`IP resolved to: ${actualIp}`);

		// Return a ResourceLink instead of inline content
		// This tells the client to fetch the resource separately
		return {
			content: [
				{
					type: 'resource' as const,
					resource: {
						uri: `ip://${actualIp}`,
						text: `IP lookup result available at resource ip://${actualIp}`,
						mimeType: 'text/markdown',
					},
				},
			],
		};
	} catch (error) {
		methodLogger.error(
			`Error getting details link for IP: ${args.ipAddress || 'current IP'}`,
			error,
		);
		return formatErrorForMcpTool(error);
	}
}

/**
 * Register the ResourceLink pattern tool
 */
function registerTools(server: McpServer) {
	const methodLogger = logger.forMethod('registerTools');
	methodLogger.debug(`Registering IP address ResourceLink tool...`);

	server.registerTool(
		'ip_get_details_link',
		{
			title: 'IP Address Lookup (ResourceLink)',
			description: IP_GET_DETAILS_LINK_DESCRIPTION,
			inputSchema: GetIpDetailsLinkToolSchema,
		},
		handleGetIpDetailsLink,
	);

	methodLogger.debug('Successfully registered ip_get_details_link tool.');
}

export default { registerTools };

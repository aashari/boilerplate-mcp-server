import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import { formatErrorForMcpTool } from '../utils/error.util.js';
import { truncateForAI } from '../utils/formatter.util.js';
import { z } from 'zod';
import ipAddressController from '../controllers/ipaddress.controller.js';
import { IpAddressToolArgs } from './ipaddress.types.js';

const logger = Logger.forContext('tools/ipaddress-link.tool.ts');

/**
 * Zod schema for the resource-link tool arguments
 * Keep argument shape aligned with ip_get_details for consistency.
 */
const GetIpDetailsLinkToolSchema = z.object({
	ipAddress: z
		.string()
		.optional()
		.describe('IP address to lookup (omit for current IP)'),
	...IpAddressToolArgs.shape,
});

/**
 * Tool description for ip_get_details_link
 */
const IP_GET_DETAILS_LINK_DESCRIPTION = `Retrieve IP address details and return both direct content and a resource link.

**Consistency with ip_get_details:**
- Uses the same arguments: \`ipAddress\`, \`includeExtendedData\`, \`useHttps\`, \`jq\`, \`outputFormat\`
- Uses the same output rendering pipeline (TOON by default, JSON when \`outputFormat: "json"\`)

**What this returns:**
- A normal text response (same rendered output as \`ip_get_details\`)
- A \`resource_link\` entry pointing to \`ip://<resolved-ip>\` for resource-style clients

**Note:** Cannot lookup private IPs (192.168.x.x, 10.x.x.x). Powered by ip-api.com.`;

/**
 * Handle IP lookup with resource-link + text output consistency.
 */
async function handleGetIpDetailsLink(args: Record<string, unknown>) {
	const methodLogger = logger.forMethod('handleGetIpDetailsLink');
	methodLogger.debug(
		`Getting IP address details link for ${args.ipAddress || 'current IP'}...`,
		args,
	);

	try {
		const result = await ipAddressController.get(args);
		const actualIp =
			result.resolvedIp ||
			(typeof args.ipAddress === 'string' ? args.ipAddress : 'current');

		methodLogger.debug(`Resolved IP for resource URI: ${actualIp}`);

		const textContent = truncateForAI(
			result.content,
			result.rawResponsePath,
		);
		const mimeType =
			args.outputFormat === 'json' ? 'application/json' : 'text/plain';

		return {
			content: [
				{
					type: 'text' as const,
					text: textContent,
				},
				{
					type: 'resource_link' as const,
					uri: `ip://${actualIp}`,
					name: `IP lookup ${actualIp}`,
					description: `Resource link for IP lookup result ${actualIp}`,
					mimeType,
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

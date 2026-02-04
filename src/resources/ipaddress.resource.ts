import {
	McpServer,
	ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import ipaddressController from '../controllers/ipaddress.controller.js';
import { formatErrorForMcpResource } from '../utils/error.util.js';

const logger = Logger.forContext('resources/ipaddress.resource.ts');

/**
 * Register an IP address lookup resource with the MCP server
 * Uses the modern registerResource API (SDK v1.22.0+) with ResourceTemplate
 *
 * @param server The MCP server instance
 */
function registerResources(server: McpServer) {
	const registerLogger = logger.forMethod('registerResources');
	registerLogger.debug('Registering IP lookup resources...');

	// Register the IP lookup resource using modern registerResource API
	// ResourceTemplate enables parameterized URIs with {ipAddress} placeholder
	server.registerResource(
		'ip-lookup',
		new ResourceTemplate('ip://{ipAddress}', {
			list: async () => {
				// Return example IPs that can be looked up
				return {
					resources: [
						{
							uri: 'ip://8.8.8.8',
							name: 'Google DNS',
							description: 'Lookup Google DNS server',
							mimeType: 'text/markdown',
						},
						{
							uri: 'ip://1.1.1.1',
							name: 'Cloudflare DNS',
							description: 'Lookup Cloudflare DNS server',
							mimeType: 'text/markdown',
						},
					],
				};
			},
		}),
		{
			title: 'IP Address Lookup', // Display name for UI
			description:
				'Retrieve geolocation and network information for a public IP address',
			mimeType: 'text/markdown',
		},
		async (uri, variables) => {
			const methodLogger = logger.forMethod('ipLookupResource');
			try {
				// Extract ipAddress from template variables
				const ipAddress = variables.ipAddress as string | undefined;

				methodLogger.debug('IP lookup resource called', {
					uri: uri.href,
					ipAddress,
				});

				// Call the controller to get the IP details
				const result = await ipaddressController.get({
					ipAddress: ipAddress || undefined,
					includeExtendedData: false,
					useHttps: true,
				});

				// Return the content as a text resource
				return {
					contents: [
						{
							uri: uri.href,
							text: result.content,
							mimeType: 'text/markdown',
						},
					],
				};
			} catch (error) {
				methodLogger.error('Resource error', error);
				return formatErrorForMcpResource(error, uri.href);
			}
		},
	);

	registerLogger.debug('IP lookup resources registered successfully');
}

export default { registerResources };

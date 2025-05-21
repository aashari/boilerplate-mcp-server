import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import ipaddressController from '../controllers/ipaddress.controller.js';
import { formatErrorForMcpResource } from '../utils/error.util.js';

const logger = Logger.forContext('resources/ipaddress.resource.ts');

/**
 * Register an IP address lookup resource with the MCP server
 *
 * @param server The MCP server instance
 */
function registerResources(server: McpServer) {
	const registerLogger = logger.forMethod('registerResources');
	registerLogger.debug('Registering IP lookup resources...');

	// Register the IP lookup resource
	server.resource(
		'ip-lookup',
		'Lookup IP address details, returning formatted text result',
		async (uri: URL) => {
			const methodLogger = logger.forMethod('ipLookupResource');
			try {
				// Extract the IP address from the request path (if present)
				// Format of the URI would be ip://<ip-address> or ip://
				methodLogger.debug('IP lookup resource called', {
					uri: uri.toString(),
				});

				// Get everything after the ip:// protocol
				const ipAddress = uri.toString().replace(/^ip:\/\//, '');

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
							uri: uri.toString(),
							text: result.content,
							mimeType: 'text/markdown',
							description: `IP Details for ${ipAddress || 'current'}`,
						},
					],
				};
			} catch (error) {
				methodLogger.error('Resource error', error);
				return formatErrorForMcpResource(error, uri.toString());
			}
		},
	);

	registerLogger.debug('IP lookup resources registered successfully');
}

export default { registerResources };

import { z } from 'zod';
import { Logger } from '../utils/logger.util.js';
import { formatErrorForMcpTool } from '../utils/error.util.js';
import { getShopDetailsController } from '../controllers/shopify.controller.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const logger = Logger.forContext('tools/shopify.tool.ts');

// Schema for the 'shopify_get_shop_details' tool arguments - no longer requires parameters
const ShopifyGetShopDetailsArgs = z.object({});

// Handler function for the 'shopify_get_shop_details' tool
async function handleGetShopDetails() {
	logger.info("Tool 'shopify_get_shop_details' called");
	try {
		// Call controller without parameters, it will use config values
		const controllerResponse = await getShopDetailsController();
		// The controller already formats the content as a Markdown string.
		// The MCP tool framework expects content to be an array of content parts.
		return {
			content: [
				{ type: 'text' as const, text: controllerResponse.content },
			],
		};
	} catch (error: unknown) {
		logger.error("Error in 'shopify_get_shop_details' tool handler", {
			error,
		});
		// Corrected usage of formatErrorForMcpTool
		return formatErrorForMcpTool(error);
	}
}

/**
 * Registers Shopify related tools with the MCP server.
 * @param server The McpServer instance.
 */
export function registerShopifyTools(server: McpServer) {
	server.tool(
		'shopify_get_shop_details', // name
		'Retrieves general details and plan information for the configured Shopify store. Credentials should be set in ~/.mcp/configs.json or environment variables.',
		ShopifyGetShopDetailsArgs.shape, // inputSchema (using .shape)
		handleGetShopDetails, // handler
	);

	logger.info('Shopify tools registered.');
}

// To make this tool available to the MCP server, it would typically be added to a list of tools
// that the server loads. For example, in your main server setup file (e.g., src/index.ts or similar):
// import { getShopifyShopDetailsTool } from './tools/shopify.tool.js';
// const allTools = [getShopifyShopDetailsTool, ...otherTools];
// server.setTools(allTools);
// The exact mechanism depends on how your boilerplate-mcp-server registers tools.

// Removed the incorrect export of shopifyTools array

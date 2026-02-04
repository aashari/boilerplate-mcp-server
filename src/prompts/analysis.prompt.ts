import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import { z } from 'zod';
import ipAddressController from '../controllers/ipaddress.controller.js';

const logger = Logger.forContext('prompts/analysis.prompt.ts');

/**
 * Register analysis prompts with the MCP server
 * Prompts provide pre-structured messages for AI interactions
 *
 * @param server The MCP server instance
 */
function registerPrompts(server: McpServer) {
	const registerLogger = logger.forMethod('registerPrompts');
	registerLogger.debug('Registering analysis prompts...');

	// IP Analysis Prompt - generates structured IP analysis request
	server.registerPrompt(
		'ip-analysis',
		{
			title: 'IP Address Analysis',
			description:
				'Generate a structured analysis request for IP address geolocation and network information',
			argsSchema: {
				ipAddress: z
					.string()
					.optional()
					.describe('IP address to analyze (omit for current IP)'),
				focus: z
					.enum([
						'security',
						'geolocation',
						'network',
						'comprehensive',
					])
					.optional()
					.describe(
						'Analysis focus: security, geolocation, network, or comprehensive',
					),
			},
		},
		async (variables) => {
			const methodLogger = logger.forMethod('ipAnalysisPrompt');
			try {
				const ipAddress = (variables.ipAddress as string) || undefined;
				const focus = (variables.focus as string) || 'comprehensive';

				methodLogger.debug('Generating IP analysis prompt', {
					ipAddress,
					focus,
				});

				// Fetch IP details
				const result = await ipAddressController.get({
					ipAddress,
					includeExtendedData: true,
					useHttps: true,
				});

				// Generate focused prompt based on analysis type
				let promptText = '';
				switch (focus) {
					case 'security':
						promptText = `Analyze the security profile of this IP address. Focus on:
- Whether it's associated with known threats or malicious activity
- Proxy/VPN detection indicators
- ASN reputation and ownership
- Geographic risk factors

IP Data:
${result.content}

Provide a security risk assessment and recommendations.`;
						break;

					case 'geolocation':
						promptText = `Analyze the geographic location of this IP address. Focus on:
- Precise location accuracy
- Timezone and regional context
- ISP and connectivity patterns
- Distance from major data centers

IP Data:
${result.content}

Provide geographic insights and potential use cases.`;
						break;

					case 'network':
						promptText = `Analyze the network characteristics of this IP address. Focus on:
- ISP and network provider details
- ASN and routing information
- Connection type and infrastructure
- Network performance indicators

IP Data:
${result.content}

Provide network analysis and technical insights.`;
						break;

					default:
						promptText = `Provide a comprehensive analysis of this IP address covering:
- Geolocation and regional context
- Network and ISP information
- Security and reputation assessment
- Potential use cases and considerations

IP Data:
${result.content}

Deliver a detailed, actionable analysis.`;
				}

				return {
					messages: [
						{
							role: 'user',
							content: {
								type: 'text',
								text: promptText,
							},
						},
					],
				};
			} catch (error) {
				methodLogger.error(
					'Failed to generate IP analysis prompt',
					error,
				);

				// Return error as prompt
				return {
					messages: [
						{
							role: 'user',
							content: {
								type: 'text',
								text: `Error generating IP analysis: ${error instanceof Error ? error.message : String(error)}`,
							},
						},
					],
				};
			}
		},
	);

	registerLogger.debug('Analysis prompts registered successfully');
}

export default { registerPrompts };

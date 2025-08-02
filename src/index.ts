#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { VERSION, PACKAGE_NAME } from './utils/constants.util.js';
import { runCli } from './cli/index.js';
import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';

// Import tools and resources
import ipAddressTools from './tools/ipaddress.tool.js';
import ipAddressResources from './resources/ipaddress.resource.js';

const logger = Logger.forContext('index.ts');

let serverInstance: McpServer | null = null;
let transportInstance:
	| StreamableHTTPServerTransport
	| StdioServerTransport
	| null = null;

/**
 * Start the MCP server with the specified transport mode
 */
export async function startServer(
	mode: 'stdio' | 'http' = 'stdio',
): Promise<McpServer> {
	logger.info(`Starting MCP server in ${mode} mode with ${PACKAGE_NAME} v${VERSION}`);
	const serverLogger = Logger.forContext('index.ts', 'startServer');

	// Load configuration
	serverLogger.info('Starting MCP server initialization...');
	config.load();

	if (config.getBoolean('DEBUG')) {
		serverLogger.debug('Debug mode enabled');
	}

	serverLogger.info(`Initializing Boilerplate MCP server v${VERSION}`);
	serverInstance = new McpServer({
		name: PACKAGE_NAME,
		version: VERSION,
	});

	// Register tools and resources
	serverLogger.info('Registering MCP tools and resources...');
	ipAddressTools.registerTools(serverInstance);
	ipAddressResources.registerResources(serverInstance);
	serverLogger.debug('All tools and resources registered');

	if (mode === 'stdio') {
		serverLogger.info('Using STDIO transport');
		transportInstance = new StdioServerTransport();

		try {
			await serverInstance.connect(transportInstance);
			serverLogger.info(
				'MCP server started successfully on STDIO transport',
			);
			setupGracefulShutdown();
			return serverInstance;
		} catch (err) {
			serverLogger.error(
				'Failed to start server on STDIO transport',
				err,
			);
			process.exit(1);
		}
	} else {
		// HTTP transport with Express
		serverLogger.info('Using Streamable HTTP transport');

		const app = express();
		app.use(cors());
		app.use(express.json());

		const mcpEndpoint = '/mcp';
		serverLogger.debug(`MCP endpoint: ${mcpEndpoint}`);

		// Create transport instance
		const transport = new StreamableHTTPServerTransport({
			// sessionIdGenerator is optional
			sessionIdGenerator: undefined,
		});

		// Connect server to transport
		await serverInstance.connect(transport);
		transportInstance = transport;

		// Handle all MCP requests
		app.all(mcpEndpoint, (req: Request, res: Response) => {
			transport
				.handleRequest(req, res, req.body)
				.catch((err: unknown) => {
					serverLogger.error('Error in transport.handleRequest', err);
					if (!res.headersSent) {
						res.status(500).json({
							error: 'Internal Server Error',
						});
					}
				});
		});

		// Health check endpoint
		app.get('/', (_req: Request, res: Response) => {
			res.send(`Boilerplate MCP Server v${VERSION} is running`);
		});

		// Start HTTP server
		const PORT = Number(process.env.PORT ?? 3000);
		await new Promise<void>((resolve) => {
			app.listen(PORT, () => {
				serverLogger.info(
					`HTTP transport listening on http://localhost:${PORT}${mcpEndpoint}`,
				);
				resolve();
			});
		});

		setupGracefulShutdown();
		return serverInstance;
	}
}

/**
 * Main entry point
 */
async function main() {
	const mainLogger = Logger.forContext('index.ts', 'main');

	// Load configuration
	config.load();

	// CLI mode - if any arguments are provided
	if (process.argv.length > 2) {
		mainLogger.info('CLI mode detected');
		await runCli(process.argv.slice(2));
		return;
	}

	// Server mode - determine transport
	const transportMode = (process.env.TRANSPORT_MODE || 'stdio').toLowerCase();
	let mode: 'http' | 'stdio';

	if (transportMode === 'stdio') {
		mode = 'stdio';
	} else if (transportMode === 'http') {
		mode = 'http';
	} else {
		mainLogger.warn(
			`Unknown TRANSPORT_MODE "${transportMode}", defaulting to stdio`,
		);
		mode = 'stdio';
	}

	mainLogger.info(`Starting server with ${mode.toUpperCase()} transport`);
	await startServer(mode);
}

// Run main if executed directly
if (require.main === module) {
	main().catch((err) => {
		logger.error('Unhandled error in main process', err);
		process.exit(1);
	});
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
	const shutdownLogger = Logger.forContext('index.ts', 'shutdown');

	const shutdown = async () => {
		try {
			shutdownLogger.info('Shutting down gracefully...');

			if (
				transportInstance &&
				'close' in transportInstance &&
				typeof transportInstance.close === 'function'
			) {
				await transportInstance.close();
			}

			if (serverInstance && typeof serverInstance.close === 'function') {
				await serverInstance.close();
			}

			process.exit(0);
		} catch (err) {
			shutdownLogger.error('Error during shutdown', err);
			process.exit(1);
		}
	};

	['SIGINT', 'SIGTERM'].forEach((signal) => {
		process.on(signal as NodeJS.Signals, shutdown);
	});
}

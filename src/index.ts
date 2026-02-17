#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { VERSION, PACKAGE_NAME } from './utils/constants.util.js';
import { runCli } from './cli/index.js';
import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';

// Import tools, resources, and prompts
import ipAddressTools from './tools/ipaddress.tool.js';
import ipAddressLinkTools from './tools/ipaddress-link.tool.js';
import ipAddressResources from './resources/ipaddress.resource.js';
import analysisPrompts from './prompts/analysis.prompt.js';

const logger = Logger.forContext('index.ts');

type HttpSession = {
	server: McpServer;
	transport: StreamableHTTPServerTransport;
	lastActivity: number;
};

let serverInstance: McpServer | null = null;
let transportInstance:
	| StreamableHTTPServerTransport
	| StdioServerTransport
	| null = null;
let httpServerInstance: ReturnType<import('express').Express['listen']> | null =
	null;
const httpSessions = new Map<string, HttpSession>();

function createMcpServer(): McpServer {
	const server = new McpServer({
		name: PACKAGE_NAME,
		version: VERSION,
	});

	ipAddressTools.registerTools(server);
	ipAddressLinkTools.registerTools(server);
	ipAddressResources.registerResources(server);
	analysisPrompts.registerPrompts(server);

	return server;
}

function getSessionId(req: Request): string | null {
	const rawSessionId = req.headers['mcp-session-id'];

	if (Array.isArray(rawSessionId)) {
		return rawSessionId[0] ?? null;
	}

	if (typeof rawSessionId === 'string' && rawSessionId.length > 0) {
		return rawSessionId;
	}

	return null;
}

/**
 * Start the MCP server with the specified transport mode
 */
export async function startServer(
	mode: 'stdio' | 'http' = 'stdio',
): Promise<McpServer> {
	logger.info(
		`Starting MCP server in ${mode} mode with ${PACKAGE_NAME} v${VERSION}`,
	);
	const serverLogger = Logger.forContext('index.ts', 'startServer');

	// Load configuration
	serverLogger.info('Starting MCP server initialization...');
	config.load();

	if (config.getBoolean('DEBUG')) {
		serverLogger.debug('Debug mode enabled');
	}

	if (mode === 'stdio') {
		serverLogger.info(`Initializing Boilerplate MCP server v${VERSION}`);
		serverLogger.info('Registering MCP tools, resources, and prompts...');
		serverInstance = createMcpServer();
		serverLogger.debug('All tools, resources, and prompts registered');

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

		// DNS rebinding protection - validate Origin header
		// See: https://modelcontextprotocol.io/docs/concepts/transports
		app.use((req, res, next) => {
			const origin = req.headers.origin;

			// Allow requests without Origin (direct API calls, curl, etc.)
			if (!origin) {
				return next();
			}

			// Validate Origin matches expected localhost patterns
			const allowedOrigins = [
				'http://localhost',
				'http://127.0.0.1',
				'http://[::1]',
				'https://localhost',
				'https://127.0.0.1',
				'https://[::1]',
			];

			const isAllowed = allowedOrigins.some(
				(allowed) =>
					origin === allowed || origin.startsWith(`${allowed}:`),
			);

			if (!isAllowed) {
				serverLogger.warn(
					`Rejected request with invalid origin: ${origin}`,
				);
				res.status(403).json({
					error: 'Forbidden',
					message: 'Invalid origin for MCP server',
				});
				return;
			}

			next();
		});

		app.use(cors({ origin: true }));
		app.use(express.json({ limit: '1mb' }));

		const mcpEndpoint = '/mcp';
		serverLogger.debug(`MCP endpoint: ${mcpEndpoint}`);

		// Handle MCP POST requests (initialize + normal RPC calls)
		app.post(mcpEndpoint, async (req: Request, res: Response) => {
			const sessionId = getSessionId(req);

			try {
				if (sessionId) {
					const session = httpSessions.get(sessionId);
					if (!session) {
						res.status(404).json({
							jsonrpc: '2.0',
							error: {
								code: -32001,
								message:
									'Session not found for provided Mcp-Session-Id',
							},
							id: null,
						});
						return;
					}

					session.lastActivity = Date.now();
					await session.transport.handleRequest(req, res, req.body);
					return;
				}

				if (!isInitializeRequest(req.body)) {
					res.status(400).json({
						jsonrpc: '2.0',
						error: {
							code: -32000,
							message:
								'Bad Request: Missing Mcp-Session-Id header',
						},
						id: null,
					});
					return;
				}

				serverLogger.info(
					'Creating new HTTP MCP session for initialize request',
				);

				let initializedSessionId: string | null = null;
				const sessionServer = createMcpServer();
				const sessionTransport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: (newSessionId: string) => {
						initializedSessionId = newSessionId;
						httpSessions.set(newSessionId, {
							server: sessionServer,
							transport: sessionTransport,
							lastActivity: Date.now(),
						});
						serverLogger.info(
							`Initialized HTTP MCP session ${newSessionId}`,
						);
					},
					onsessionclosed: (closedSessionId: string) => {
						const session = httpSessions.get(closedSessionId);
						if (!session) {
							return;
						}

						httpSessions.delete(closedSessionId);
						void session.server.close().catch((err: unknown) => {
							serverLogger.error(
								`Error closing server for session ${closedSessionId}`,
								err,
							);
						});

						serverLogger.info(
							`Closed HTTP MCP session ${closedSessionId}`,
						);
					},
				});

				await sessionServer.connect(sessionTransport);

				try {
					await sessionTransport.handleRequest(req, res, req.body);
				} catch (err) {
					if (initializedSessionId) {
						httpSessions.delete(initializedSessionId);
					}
					await sessionTransport.close();
					await sessionServer.close();
					throw err;
				}
			} catch (err) {
				serverLogger.error('Error in HTTP MCP handler', err);
				if (!res.headersSent) {
					res.status(500).json({
						jsonrpc: '2.0',
						error: {
							code: -32603,
							message: 'Internal server error',
						},
						id: null,
					});
				}
			}
		});

		// Handle optional GET requests for streamable HTTP SSE
		app.get(mcpEndpoint, async (req: Request, res: Response) => {
			const sessionId = getSessionId(req);
			if (!sessionId) {
				res.status(400).send('Missing Mcp-Session-Id header');
				return;
			}

			const session = httpSessions.get(sessionId);
			if (!session) {
				res.status(404).send('Session not found');
				return;
			}

			try {
				await session.transport.handleRequest(req, res);
			} catch (err) {
				serverLogger.error('Error in HTTP MCP GET handler', err);
				if (!res.headersSent) {
					res.status(500).send('Internal Server Error');
				}
			}
		});

		// Handle session termination requests
		app.delete(mcpEndpoint, async (req: Request, res: Response) => {
			const sessionId = getSessionId(req);
			if (!sessionId) {
				res.status(400).send('Missing Mcp-Session-Id header');
				return;
			}

			const session = httpSessions.get(sessionId);
			if (!session) {
				res.status(404).send('Session not found');
				return;
			}

			try {
				await session.transport.handleRequest(req, res);
			} catch (err) {
				serverLogger.error('Error in HTTP MCP DELETE handler', err);
				if (!res.headersSent) {
					res.status(500).send('Internal Server Error');
				}
			}
		});

		// Health check endpoint
		app.get('/', (_req: Request, res: Response) => {
			res.send(`Boilerplate MCP Server v${VERSION} is running`);
		});

		// Start HTTP server
		const PORT = Number(process.env.PORT ?? 3000);
		const HOST = '127.0.0.1'; // Explicit localhost binding for security
		await new Promise<void>((resolve) => {
			httpServerInstance = app.listen(PORT, HOST, () => {
				serverLogger.info(
					`HTTP transport listening on http://${HOST}:${PORT}${mcpEndpoint}`,
				);
				serverLogger.info(
					'Server bound to localhost only for security',
				);
				resolve();
			});
		});

		// Reap idle sessions every 5 minutes (TTL: 30 minutes)
		const SESSION_TTL_MS = 30 * 60 * 1000;
		const REAP_INTERVAL_MS = 5 * 60 * 1000;
		const reapInterval = setInterval(() => {
			const now = Date.now();
			for (const [sessionId, session] of httpSessions.entries()) {
				if (now - session.lastActivity > SESSION_TTL_MS) {
					serverLogger.info(`Reaping idle HTTP session ${sessionId}`);
					httpSessions.delete(sessionId);
					void session.transport
						.close()
						.catch((err: unknown) =>
							serverLogger.debug(
								`Error closing transport for reaped session ${sessionId}`,
								err,
							),
						)
						.then(() => session.server.close())
						.catch((err: unknown) =>
							serverLogger.debug(
								`Error closing server for reaped session ${sessionId}`,
								err,
							),
						);
				}
			}
		}, REAP_INTERVAL_MS);
		reapInterval.unref();

		setupGracefulShutdown();

		// HTTP mode uses per-session servers (managed in httpSessions map).
		// Return a reference server for API compatibility; not connected to any transport.
		return createMcpServer();
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
	let shuttingDown = false;

	const shutdown = async () => {
		if (shuttingDown) return;
		shuttingDown = true;

		try {
			shutdownLogger.info('Shutting down gracefully...');

			if (httpSessions.size > 0) {
				shutdownLogger.info(
					`Closing ${httpSessions.size} active HTTP session(s)`,
				);
			}

			for (const [sessionId, session] of httpSessions.entries()) {
				try {
					await session.transport.close();
				} catch (err) {
					shutdownLogger.error(
						`Error closing transport for session ${sessionId}`,
						err,
					);
				}

				try {
					await session.server.close();
				} catch (err) {
					shutdownLogger.error(
						`Error closing server for session ${sessionId}`,
						err,
					);
				}
			}

			httpSessions.clear();

			if (httpServerInstance) {
				await new Promise<void>((resolve) => {
					httpServerInstance!.close(() => resolve());
				});
			}

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

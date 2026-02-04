import { Logger } from './logger.util.js';

/**
 * Error types for classification
 */
export enum ErrorType {
	AUTH_MISSING = 'AUTH_MISSING',
	AUTH_INVALID = 'AUTH_INVALID',
	API_ERROR = 'API_ERROR',
	UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

/**
 * Custom error class with type classification
 */
export class McpError extends Error {
	type: ErrorType;
	statusCode?: number;
	originalError?: unknown;

	constructor(
		message: string,
		type: ErrorType,
		statusCode?: number,
		originalError?: unknown,
	) {
		super(message);
		this.name = 'McpError';
		this.type = type;
		this.statusCode = statusCode;
		this.originalError = originalError;
	}
}

/**
 * Create an authentication missing error
 */
export function createAuthMissingError(
	message: string = 'Authentication credentials are missing',
): McpError {
	return new McpError(message, ErrorType.AUTH_MISSING);
}

/**
 * Create an authentication invalid error
 */
export function createAuthInvalidError(
	message: string = 'Authentication credentials are invalid',
): McpError {
	return new McpError(message, ErrorType.AUTH_INVALID, 401);
}

/**
 * Create an API error
 */
export function createApiError(
	message: string,
	statusCode?: number,
	originalError?: unknown,
): McpError {
	return new McpError(
		message,
		ErrorType.API_ERROR,
		statusCode,
		originalError,
	);
}

/**
 * Create an unexpected error
 */
export function createUnexpectedError(
	message: string = 'An unexpected error occurred',
	originalError?: unknown,
): McpError {
	return new McpError(
		message,
		ErrorType.UNEXPECTED_ERROR,
		undefined,
		originalError,
	);
}

/**
 * Ensure an error is an McpError
 */
export function ensureMcpError(error: unknown): McpError {
	if (error instanceof McpError) {
		return error;
	}

	if (error instanceof Error) {
		return createUnexpectedError(error.message, error);
	}

	return createUnexpectedError(String(error));
}

/**
 * Get the deepest original error from an error chain
 * @param error The error to extract the original cause from
 * @returns The deepest original error or the error itself
 */
export function getDeepOriginalError(error: unknown): unknown {
	if (!error) {
		return error;
	}

	let current = error;
	let depth = 0;
	const maxDepth = 10; // Prevent infinite recursion

	while (
		depth < maxDepth &&
		current instanceof Error &&
		'originalError' in current &&
		current.originalError
	) {
		current = current.originalError;
		depth++;
	}

	return current;
}

/**
 * Format error for MCP tool response
 */
export function formatErrorForMcpTool(error: unknown): {
	content: Array<{ type: 'text'; text: string }>;
	isError: true;
	metadata?: {
		errorType: ErrorType;
		statusCode?: number;
		errorDetails?: unknown;
	};
} {
	const methodLogger = Logger.forContext(
		'utils/error.util.ts',
		'formatErrorForMcpTool',
	);
	const mcpError = ensureMcpError(error);
	methodLogger.error(`${mcpError.type} error`, mcpError);

	// Get the deep original error for additional context
	const originalError = getDeepOriginalError(mcpError.originalError);

	// Safely extract details from the original error
	const errorDetails =
		originalError instanceof Error
			? { message: originalError.message }
			: originalError;

	return {
		content: [
			{
				type: 'text' as const,
				text: `Error: ${mcpError.message}`,
			},
		],
		isError: true,
		metadata: {
			errorType: mcpError.type,
			statusCode: mcpError.statusCode,
			errorDetails,
		},
	};
}

/**
 * Format error for MCP resource response
 */
export function formatErrorForMcpResource(
	error: unknown,
	uri: string,
): {
	contents: Array<{
		uri: string;
		text: string;
		mimeType: string;
		description?: string;
	}>;
} {
	const methodLogger = Logger.forContext(
		'utils/error.util.ts',
		'formatErrorForMcpResource',
	);
	const mcpError = ensureMcpError(error);
	methodLogger.error(`${mcpError.type} error`, mcpError);

	return {
		contents: [
			{
				uri,
				text: `Error: ${mcpError.message}`,
				mimeType: 'text/plain',
				description: `Error: ${mcpError.type}`,
			},
		],
	};
}

/**
 * Handle error in CLI context with improved user feedback
 */
export function handleCliError(error: unknown): never {
	const methodLogger = Logger.forContext(
		'utils/error.util.ts',
		'handleCliError',
	);
	const mcpError = ensureMcpError(error);
	methodLogger.error(`${mcpError.type} error`, mcpError);

	// Get the deep original error for more context
	const originalError = getDeepOriginalError(mcpError.originalError);

	// Print the error message
	console.error(`Error: ${mcpError.message}`);

	// Provide helpful context based on error type
	if (mcpError.type === ErrorType.AUTH_MISSING) {
		console.error(
			'\nTip: Make sure to set up your API token in the configuration file or environment variables.',
		);
	} else if (mcpError.type === ErrorType.AUTH_INVALID) {
		console.error(
			'\nTip: Check that your API token is correct and has not expired.',
		);
	} else if (mcpError.type === ErrorType.API_ERROR) {
		if (mcpError.statusCode === 429) {
			console.error(
				'\nTip: You may have exceeded your API rate limits. Try again later or upgrade your API plan.',
			);
		}

		// Add ip-api.com specific context if available
		if (originalError && typeof originalError === 'object') {
			const origErr = originalError as Record<string, unknown>;
			if (origErr.status === 'fail' && origErr.message) {
				console.error(
					`\nAPI returned failure: ${String(origErr.message)}`,
				);
			}
		}
	}

	// Display DEBUG tip
	if (process.env.DEBUG !== 'mcp:*') {
		console.error(
			'\nFor more detailed error information, run with DEBUG=mcp:* environment variable.',
		);
	}

	process.exit(1);
}

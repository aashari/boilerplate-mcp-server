import { createApiError } from './error.util.js';
import { Logger } from './logger.util.js';

/**
 * Standard error codes for consistent handling
 */
export enum ErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	INVALID_CURSOR = 'INVALID_CURSOR',
	ACCESS_DENIED = 'ACCESS_DENIED',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
	NETWORK_ERROR = 'NETWORK_ERROR',
	RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
	PRIVATE_IP_ERROR = 'PRIVATE_IP_ERROR',
	RESERVED_RANGE_ERROR = 'RESERVED_RANGE_ERROR',
}

/**
 * Context information for error handling
 */
export interface ErrorContext {
	/**
	 * Source of the error (e.g., file path and function)
	 */
	source?: string;

	/**
	 * Type of entity being processed (e.g., 'IP Address', 'User')
	 */
	entityType?: string;

	/**
	 * Identifier of the entity being processed
	 */
	entityId?: string | Record<string, string>;

	/**
	 * Operation being performed (e.g., 'retrieving', 'searching')
	 */
	operation?: string;

	/**
	 * Additional information for debugging
	 */
	additionalInfo?: Record<string, unknown>;
}

/**
 * Helper function to create a consistent error context object
 * @param entityType Type of entity being processed
 * @param operation Operation being performed
 * @param source Source of the error (typically file path and function)
 * @param entityId Optional identifier of the entity
 * @param additionalInfo Optional additional information for debugging
 * @returns A formatted ErrorContext object
 */
export function buildErrorContext(
	entityType: string,
	operation: string,
	source: string,
	entityId?: string | Record<string, string>,
	additionalInfo?: Record<string, unknown>,
): ErrorContext {
	return {
		entityType,
		operation,
		source,
		...(entityId && { entityId }),
		...(additionalInfo && { additionalInfo }),
	};
}

/**
 * Detect specific error types from raw errors
 * @param error The error to analyze
 * @param context Context information for better error detection
 * @returns Object containing the error code and status code
 */
export function detectErrorType(
	error: unknown,
	context: ErrorContext = {},
): { code: ErrorCode; statusCode: number } {
	const methodLogger = Logger.forContext(
		'utils/error-handler.util.ts',
		'detectErrorType',
	);
	methodLogger.debug(`Detecting error type`, { error, context });

	const errorMessage = error instanceof Error ? error.message : String(error);
	const statusCode =
		error instanceof Error && 'statusCode' in error
			? (error as { statusCode: number }).statusCode
			: undefined;

	// Network error detection
	if (
		errorMessage.includes('network error') ||
		errorMessage.includes('fetch failed') ||
		errorMessage.includes('ECONNREFUSED') ||
		errorMessage.includes('ENOTFOUND') ||
		errorMessage.includes('Failed to fetch') ||
		errorMessage.includes('Network request failed')
	) {
		return { code: ErrorCode.NETWORK_ERROR, statusCode: 500 };
	}

	// Rate limiting detection
	if (
		errorMessage.includes('rate limit') ||
		errorMessage.includes('too many requests') ||
		statusCode === 429
	) {
		return { code: ErrorCode.RATE_LIMIT_ERROR, statusCode: 429 };
	}

	// ip-api.com specific error detection
	if (
		errorMessage.includes('private range') ||
		errorMessage.includes('private IP')
	) {
		return { code: ErrorCode.PRIVATE_IP_ERROR, statusCode: 400 };
	}

	if (errorMessage.includes('reserved range')) {
		return { code: ErrorCode.RESERVED_RANGE_ERROR, statusCode: 400 };
	}

	// Check for ip-api.com status="fail" in originalError
	if (
		error instanceof Error &&
		'originalError' in error &&
		error.originalError &&
		typeof error.originalError === 'object'
	) {
		const originalError = error.originalError as Record<string, unknown>;

		if (originalError.status === 'fail') {
			const apiMessage = originalError.message
				? String(originalError.message)
				: '';

			if (apiMessage.includes('private')) {
				return { code: ErrorCode.PRIVATE_IP_ERROR, statusCode: 400 };
			}

			if (apiMessage.includes('reserved')) {
				return {
					code: ErrorCode.RESERVED_RANGE_ERROR,
					statusCode: 400,
				};
			}

			return { code: ErrorCode.VALIDATION_ERROR, statusCode: 400 };
		}
	}

	// Not Found detection
	if (
		errorMessage.includes('not found') ||
		errorMessage.includes('does not exist') ||
		statusCode === 404
	) {
		return { code: ErrorCode.NOT_FOUND, statusCode: 404 };
	}

	// Access Denied detection
	if (
		errorMessage.includes('access') ||
		errorMessage.includes('permission') ||
		errorMessage.includes('authorize') ||
		errorMessage.includes('authentication') ||
		statusCode === 401 ||
		statusCode === 403
	) {
		return { code: ErrorCode.ACCESS_DENIED, statusCode: statusCode || 403 };
	}

	// Invalid Cursor detection
	if (
		(errorMessage.includes('cursor') ||
			errorMessage.includes('startAt') ||
			errorMessage.includes('page')) &&
		(errorMessage.includes('invalid') || errorMessage.includes('not valid'))
	) {
		return { code: ErrorCode.INVALID_CURSOR, statusCode: 400 };
	}

	// Validation Error detection
	if (
		errorMessage.includes('validation') ||
		errorMessage.includes('invalid') ||
		errorMessage.includes('required') ||
		statusCode === 400 ||
		statusCode === 422
	) {
		return {
			code: ErrorCode.VALIDATION_ERROR,
			statusCode: statusCode || 400,
		};
	}

	// Default to unexpected error
	return {
		code: ErrorCode.UNEXPECTED_ERROR,
		statusCode: statusCode || 500,
	};
}

/**
 * Create user-friendly error messages based on error type and context
 * @param code The error code
 * @param context Context information for better error messages
 * @param originalMessage The original error message
 * @returns User-friendly error message
 */
export function createUserFriendlyErrorMessage(
	code: ErrorCode,
	context: ErrorContext = {},
	originalMessage?: string,
): string {
	const methodLogger = Logger.forContext(
		'utils/error-handler.util.ts',
		'createUserFriendlyErrorMessage',
	);
	const { entityType, entityId, operation } = context;

	// Format entity ID for display
	let entityIdStr = '';
	if (entityId) {
		if (typeof entityId === 'string') {
			entityIdStr = entityId;
		} else {
			// Handle object entityId
			entityIdStr = Object.values(entityId).join('/');
		}
	}

	// Determine entity display name
	const entity = entityType
		? `${entityType}${entityIdStr ? ` ${entityIdStr}` : ''}`
		: 'Resource';

	let message: string;

	switch (code) {
		case ErrorCode.NOT_FOUND:
			message = `${entity} not found${entityIdStr ? `: ${entityIdStr}` : ''}. Verify the ID is correct and that you have access to this ${entityType?.toLowerCase() || 'resource'}.`;
			break;

		case ErrorCode.ACCESS_DENIED:
			message = `Access denied for ${entity.toLowerCase()}${entityIdStr ? ` ${entityIdStr}` : ''}. Verify your credentials and permissions.`;
			break;

		case ErrorCode.INVALID_CURSOR:
			message = `Invalid pagination cursor. Use the exact cursor string returned from previous results.`;
			break;

		case ErrorCode.VALIDATION_ERROR:
			message =
				originalMessage ||
				`Invalid data provided for ${operation || 'operation'} ${entity.toLowerCase()}.`;
			break;

		case ErrorCode.NETWORK_ERROR:
			message = `Network error while ${operation || 'connecting to'} the service. Please check your internet connection and try again.`;
			break;

		case ErrorCode.RATE_LIMIT_ERROR:
			message = `Rate limit exceeded. Please wait a moment and try again, or reduce the frequency of requests.`;
			break;

		case ErrorCode.PRIVATE_IP_ERROR:
			message = `Private IP addresses are not supported. Please provide a public IP address.`;
			break;

		case ErrorCode.RESERVED_RANGE_ERROR:
			message = `Reserved range IP addresses are not supported. Please provide a public IP address.`;
			break;

		default:
			message = `An unexpected error occurred while ${operation || 'processing'} ${entity.toLowerCase()}.`;
	}

	// Include original message details if available and appropriate
	if (
		originalMessage &&
		code !== ErrorCode.NOT_FOUND &&
		code !== ErrorCode.ACCESS_DENIED
	) {
		message += ` Error details: ${originalMessage}`;
	}

	methodLogger.debug(`Created user-friendly message: ${message}`, {
		code,
		context,
	});
	return message;
}

/**
 * Handle controller errors consistently
 * @param error The error to handle
 * @param context Context information for better error messages
 * @returns Never returns, always throws an error
 */
export function handleControllerError(
	error: unknown,
	context: ErrorContext = {},
): never {
	const methodLogger = Logger.forContext(
		'utils/error-handler.util.ts',
		'handleControllerError',
	);

	// Extract error details
	const errorMessage = error instanceof Error ? error.message : String(error);
	const statusCode =
		error instanceof Error && 'statusCode' in error
			? (error as { statusCode: number }).statusCode
			: undefined;

	// Detect error type using utility
	const { code, statusCode: detectedStatus } = detectErrorType(
		error,
		context,
	);

	// Combine detected status with explicit status
	const finalStatusCode = statusCode || detectedStatus;

	// Format entity information for logging
	const { entityType, entityId, operation } = context;
	const entity = entityType || 'resource';
	const entityIdStr = entityId
		? typeof entityId === 'string'
			? entityId
			: JSON.stringify(entityId)
		: '';
	const actionStr = operation || 'processing';

	// Log detailed error information
	methodLogger.error(
		`Error ${actionStr} ${entity}${
			entityIdStr ? `: ${entityIdStr}` : ''
		}: ${errorMessage}`,
		error,
	);

	// Create user-friendly error message for the response
	const message =
		code === ErrorCode.VALIDATION_ERROR
			? errorMessage
			: createUserFriendlyErrorMessage(code, context, errorMessage);

	// Throw an appropriate API error with the user-friendly message
	throw createApiError(message, finalStatusCode, error);
}

import {
	ErrorCode,
	detectErrorType,
	buildErrorContext,
} from './error-handler.util.js';
import { createApiError, McpError, ErrorType } from './error.util.js';

describe('error-handler.util', () => {
	describe('detectErrorType', () => {
		it('should detect network errors', () => {
			const networkErrors = [
				'network error occurred',
				'fetch failed with error',
				'ECONNREFUSED on 127.0.0.1:8080',
				'ENOTFOUND api.example.com',
				'Failed to fetch data from server',
				'Network request failed',
			];

			networkErrors.forEach((msg) => {
				const { code, statusCode } = detectErrorType(new Error(msg));
				expect(code).toBe(ErrorCode.NETWORK_ERROR);
				expect(statusCode).toBe(500);
			});
		});

		it('should detect rate limit errors', () => {
			const rateLimitErrors = [
				'rate limit exceeded',
				'too many requests',
				new McpError('API error', ErrorType.API_ERROR, 429),
			];

			rateLimitErrors.forEach((error) => {
				const { code, statusCode } = detectErrorType(error);
				expect(code).toBe(ErrorCode.RATE_LIMIT_ERROR);
				expect(statusCode).toBe(429);
			});
		});

		it('should detect ip-api.com specific errors from message', () => {
			const privateIpError = new Error('private range IP address');
			const { code: privateCode, statusCode: privateStatus } =
				detectErrorType(privateIpError);
			expect(privateCode).toBe(ErrorCode.PRIVATE_IP_ERROR);
			expect(privateStatus).toBe(400);

			const reservedIpError = new Error('reserved range');
			const { code: reservedCode, statusCode: reservedStatus } =
				detectErrorType(reservedIpError);
			expect(reservedCode).toBe(ErrorCode.RESERVED_RANGE_ERROR);
			expect(reservedStatus).toBe(400);
		});

		it('should detect ip-api.com specific errors from originalError', () => {
			// Test with an McpError that has originalError with status='fail' and private message
			const privateApiError = createApiError('API error', 400, {
				status: 'fail',
				message: 'private range',
			});
			const { code: privateCode } = detectErrorType(privateApiError);
			expect(privateCode).toBe(ErrorCode.PRIVATE_IP_ERROR);

			// Test with an McpError that has originalError with status='fail' and reserved message
			const reservedApiError = createApiError('API error', 400, {
				status: 'fail',
				message: 'reserved range',
			});
			const { code: reservedCode } = detectErrorType(reservedApiError);
			expect(reservedCode).toBe(ErrorCode.RESERVED_RANGE_ERROR);

			// Test with general status='fail' but no specific message
			const generalApiError = createApiError('API error', 400, {
				status: 'fail',
			});
			const { code: generalCode } = detectErrorType(generalApiError);
			expect(generalCode).toBe(ErrorCode.VALIDATION_ERROR);
		});

		it('should detect not found errors', () => {
			const notFoundErrors = [
				'resource not found',
				'entity does not exist',
				new McpError('Not found', ErrorType.API_ERROR, 404),
			];

			notFoundErrors.forEach((error) => {
				const { code } = detectErrorType(error);
				expect(code).toBe(ErrorCode.NOT_FOUND);
			});
		});

		it('should detect access denied errors', () => {
			const accessDeniedErrors = [
				'access denied',
				'permission denied',
				'not authorized to access',
				'authentication required',
				new McpError('Forbidden', ErrorType.API_ERROR, 403),
				new McpError('Unauthorized', ErrorType.API_ERROR, 401),
			];

			accessDeniedErrors.forEach((error) => {
				const { code } = detectErrorType(error);
				expect(code).toBe(ErrorCode.ACCESS_DENIED);
			});
		});

		it('should default to unexpected error when no patterns match', () => {
			const { code, statusCode } = detectErrorType(
				new Error('some random error'),
			);
			expect(code).toBe(ErrorCode.UNEXPECTED_ERROR);
			expect(statusCode).toBe(500);
		});
	});

	describe('buildErrorContext', () => {
		it('should build a context object with all parameters', () => {
			const context = buildErrorContext(
				'User',
				'create',
				'controllers/user.controller.ts@create',
				'user123',
				{ requestBody: { name: 'Test User' } },
			);

			expect(context).toEqual({
				entityType: 'User',
				operation: 'create',
				source: 'controllers/user.controller.ts@create',
				entityId: 'user123',
				additionalInfo: { requestBody: { name: 'Test User' } },
			});
		});

		it('should build a context object with only required parameters', () => {
			const context = buildErrorContext(
				'User',
				'list',
				'controllers/user.controller.ts@list',
			);

			expect(context).toEqual({
				entityType: 'User',
				operation: 'list',
				source: 'controllers/user.controller.ts@list',
			});
		});

		it('should handle object entityId', () => {
			const context = buildErrorContext(
				'Document',
				'get',
				'controllers/document.controller.ts@get',
				{ project: 'project1', id: 'doc123' },
			);

			expect(context).toEqual({
				entityType: 'Document',
				operation: 'get',
				source: 'controllers/document.controller.ts@get',
				entityId: { project: 'project1', id: 'doc123' },
			});
		});
	});
});

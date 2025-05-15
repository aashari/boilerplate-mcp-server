import {
	McpError,
	ErrorType,
	createApiError,
	createUnexpectedError,
	getDeepOriginalError,
	formatErrorForMcpTool,
} from './error.util.js';

describe('error.util', () => {
	describe('getDeepOriginalError', () => {
		it('should return the deepest original error in a chain', () => {
			// Create a nested chain of errors
			const deepestError = new Error('Root cause');
			const middleError = createApiError(
				'Middle error',
				500,
				deepestError,
			);
			const topError = createUnexpectedError('Top error', middleError);

			// Should extract the deepest error
			const result = getDeepOriginalError(topError);
			expect(result).toBe(deepestError);
		});

		it('should handle null/undefined input', () => {
			expect(getDeepOriginalError(null)).toBeNull();
			expect(getDeepOriginalError(undefined)).toBeUndefined();
		});

		it('should return the input if it has no originalError', () => {
			const error = new Error('Simple error');
			expect(getDeepOriginalError(error)).toBe(error);
		});

		it('should handle non-Error objects', () => {
			const nonError = { message: 'Not an error' };
			expect(getDeepOriginalError(nonError)).toBe(nonError);
		});

		it('should prevent infinite recursion with circular references', () => {
			const error1 = new McpError('Error 1', ErrorType.UNEXPECTED_ERROR);
			const error2 = new McpError(
				'Error 2',
				ErrorType.UNEXPECTED_ERROR,
				undefined,
				error1,
			);
			// Create circular reference
			error1.originalError = error2;

			// Should not cause stack overflow, should return one of the errors
			const result = getDeepOriginalError(error1);
			expect(result).toBeTruthy();
			expect(result instanceof Error).toBe(true);
		});
	});

	describe('formatErrorForMcpTool', () => {
		it('should format McpError with metadata', () => {
			const error = createApiError('Test error', 404, {
				detail: 'Not found',
			});
			const result = formatErrorForMcpTool(error);

			// Check the content
			expect(result.content).toEqual([
				{
					type: 'text',
					text: 'Error: Test error',
				},
			]);

			// Check the metadata
			expect(result.metadata).toBeDefined();
			expect(result.metadata?.errorType).toBe(ErrorType.API_ERROR);
			expect(result.metadata?.statusCode).toBe(404);
			expect(result.metadata?.errorDetails).toEqual({
				detail: 'Not found',
			});
		});

		it('should wrap non-McpError with metadata', () => {
			const error = new Error('Regular error');
			const result = formatErrorForMcpTool(error);

			// Check content
			expect(result.content[0].text).toBe('Error: Regular error');

			// Check metadata
			expect(result.metadata?.errorType).toBe(ErrorType.UNEXPECTED_ERROR);
			expect(result.metadata?.errorDetails).toHaveProperty(
				'message',
				'Regular error',
			);
		});

		it('should extract error message from non-Error objects', () => {
			const result = formatErrorForMcpTool('String error');
			expect(result.content[0].text).toBe('Error: String error');
			expect(result.metadata?.errorType).toBe(ErrorType.UNEXPECTED_ERROR);
		});

		it('should extract deep original error details', () => {
			const deepError = { code: 'DEEP_ERROR', message: 'Deep cause' };
			const middleError = createApiError('Middle layer', 500, deepError);
			const topError = createUnexpectedError('Top error', middleError);

			const result = formatErrorForMcpTool(topError);

			expect(result.metadata?.errorDetails).toEqual(deepError);
		});
	});
});

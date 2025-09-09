import { CliTestUtil } from '../utils/cli.test.util';
// Import config/transport utils for consistency, even if not strictly needed for ip-api checks
import { getIpApiCredentials } from '../utils/transport.util';
import { config } from '../utils/config.util';

describe('IP Address CLI Commands', () => {
	// Setup: Ensure config is loaded
	beforeAll(() => {
		config.load(); // Ensure config is loaded
		// Check if credentials are available for testing
		const credentials = getIpApiCredentials();
		if (!credentials.apiToken) {
			// Note: API token not available - tests will use free tier access
			// This is expected behavior in most test environments
		}
	});

	describe('get-ip-details command', () => {
		it('should retrieve details for the current device IP', async () => {
			const result = await CliTestUtil.runCommand(['get-ip-details']);

			expect(result.exitCode).toBe(0);
			CliTestUtil.validateMarkdownOutput(result.stdout);
			CliTestUtil.validateOutputContains(result.stdout, [
				'# IP Address Details:',
				'## Location Information',
				'## Network Information',
				'- **IP Address**:',
			]);
			// Check that stderr only contains expected debug logs if DEBUG is on
			if (process.env.DEBUG) {
				expect(result.stderr).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
			} else {
				expect(result.stderr).toBe('');
			}
		}, 15000);

		it('should retrieve details for a specific valid IP (Google DNS)', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'8.8.8.8',
			]);

			expect(result.exitCode).toBe(0);
			CliTestUtil.validateMarkdownOutput(result.stdout);
			CliTestUtil.validateOutputContains(result.stdout, [
				'# IP Address Details: 8.8.8.8',
				'## Location Information',
				'## Network Information',
				'- **IP Address**: 8.8.8.8',
				'Google', // Google DNS should consistently have Google mentioned somewhere
			]);
			// Check that stderr only contains expected debug logs if DEBUG is on
			if (process.env.DEBUG) {
				expect(result.stderr).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
			} else {
				expect(result.stderr).toBe('');
			}
		}, 15000);

		it('should handle invalid IP format gracefully', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'invalid-ip-format',
			]);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain('Error:');
			// The exact error message might vary, but should mention something about an invalid query
			expect(result.stderr).toMatch(/invalid|error|fail/i);
		}, 15000);

		it('should handle private/reserved IP addresses correctly', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'192.168.1.1',
			]);

			// ip-api.com might return different responses for private IPs:
			// - Some versions return a success with limited info
			// - Some versions return an error
			// We'll check both possibilities

			if (result.exitCode === 0) {
				// If it succeeds, validate the output format but with adjusted expectations
				CliTestUtil.validateMarkdownOutput(result.stdout);
				CliTestUtil.validateOutputContains(result.stdout, [
					'# IP Address Details: 192.168.1.1',
					'- **IP Address**: 192.168.1.1',
					// Don't expect specific fields that might be missing for private IPs
				]);
			} else {
				// If it fails with an error, check for appropriate error message
				expect(result.stderr).toContain('Error:');
				// The error might mention private range, reserved, or simply be invalid
				expect(result.stderr).toMatch(
					/private|reserved|invalid|error/i,
				);
			}
		}, 15000);

		it('should handle help flag correctly', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'--help',
			]);

			expect(result.exitCode).toBe(0);
			// Help output should contain information about the command
			expect(result.stdout).toMatch(/Usage|Options|Description/i);
			expect(result.stdout).toContain('get-ip-details');
		}, 15000);

		it('should handle unknown flags gracefully', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'--unknown-flag',
			]);

			// Should either fail with non-zero exit code or succeed but ignore the unknown flag
			if (result.exitCode !== 0) {
				expect(result.stderr).toMatch(/unknown option|invalid|error/i);
			} else {
				// If it succeeds, it should still produce valid output
				CliTestUtil.validateMarkdownOutput(result.stdout);
				CliTestUtil.validateOutputContains(result.stdout, [
					'# IP Address Details:',
					'## Location Information',
					'## Network Information',
				]);
			}
		}, 15000);
	});
});

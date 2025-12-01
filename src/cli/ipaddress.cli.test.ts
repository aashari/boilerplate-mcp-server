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
		it('should retrieve details for the current device IP in TOON format', async () => {
			const result = await CliTestUtil.runCommand(['get-ip-details']);

			expect(result.exitCode).toBe(0);
			// TOON format validation - check for key: value patterns
			CliTestUtil.validateToonOutput(result.stdout);
			CliTestUtil.validateOutputContains(result.stdout, [
				'status:',
				'query:',
				'country:',
				'city:',
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
			CliTestUtil.validateToonOutput(result.stdout);
			CliTestUtil.validateOutputContains(result.stdout, [
				'query: 8.8.8.8',
				'status: success',
				'country:',
				/Google/i, // Google DNS should consistently have Google mentioned somewhere
			]);
			// Check that stderr only contains expected debug logs if DEBUG is on
			if (process.env.DEBUG) {
				expect(result.stderr).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
			} else {
				expect(result.stderr).toBe('');
			}
		}, 15000);

		it('should output JSON format when --output-format json is used', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'8.8.8.8',
				'--output-format',
				'json',
			]);

			expect(result.exitCode).toBe(0);
			// Validate JSON output
			const cleanOutput = result.stdout
				.split('\n')
				.filter((line) => !line.match(/^\[\d{2}:\d{2}:\d{2}\]/))
				.join('\n')
				.trim();
			const parsed = JSON.parse(cleanOutput);
			expect(parsed).toHaveProperty('status', 'success');
			expect(parsed).toHaveProperty('query', '8.8.8.8');
		}, 15000);

		it('should apply JQ filter correctly', async () => {
			const result = await CliTestUtil.runCommand([
				'get-ip-details',
				'8.8.8.8',
				'--jq',
				'{ip: query, country: country}',
				'--output-format',
				'json',
			]);

			expect(result.exitCode).toBe(0);
			const cleanOutput = result.stdout
				.split('\n')
				.filter((line) => !line.match(/^\[\d{2}:\d{2}:\d{2}\]/))
				.join('\n')
				.trim();
			const parsed = JSON.parse(cleanOutput);
			expect(parsed).toHaveProperty('ip', '8.8.8.8');
			expect(parsed).toHaveProperty('country');
			// Should NOT have other fields due to JQ filter
			expect(parsed).not.toHaveProperty('city');
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
				// If it succeeds, validate TOON output format
				CliTestUtil.validateToonOutput(result.stdout);
				CliTestUtil.validateOutputContains(result.stdout, [
					'query: 192.168.1.1',
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
			// Should mention new options
			expect(result.stdout).toMatch(/--jq|--output-format/);
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
				// If it succeeds, it should still produce valid TOON output
				CliTestUtil.validateToonOutput(result.stdout);
				CliTestUtil.validateOutputContains(result.stdout, [
					'status:',
					'query:',
					'country:',
				]);
			}
		}, 15000);
	});
});

import { spawn } from 'child_process';
import { join } from 'path';

/**
 * Utility for testing CLI commands with real execution
 */
export class CliTestUtil {
	/**
	 * Executes a CLI command and returns the result
	 *
	 * @param args - CLI arguments to pass to the command
	 * @param options - Test options
	 * @returns Promise with stdout, stderr, and exit code
	 */
	static async runCommand(
		args: string[],
		options: {
			timeoutMs?: number;
			env?: Record<string, string>;
		} = {},
	): Promise<{
		stdout: string;
		stderr: string;
		exitCode: number;
	}> {
		// Default timeout of 30 seconds
		const timeoutMs = options.timeoutMs || 30000;

		// CLI execution path - points to the built CLI script
		const cliPath = join(process.cwd(), 'dist', 'index.js');

		// Log what command we're about to run
		console.log(`Running CLI command: node ${cliPath} ${args.join(' ')}`);

		return new Promise((resolve, reject) => {
			// Set up timeout handler
			const timeoutId = setTimeout(() => {
				child.kill();
				reject(new Error(`CLI command timed out after ${timeoutMs}ms`));
			}, timeoutMs);

			// Capture stdout and stderr
			let stdout = '';
			let stderr = '';

			// Spawn the process with given arguments and enhanced environment
			const child = spawn('node', [cliPath, ...args], {
				env: {
					...process.env,
					...options.env,
					DEBUG: 'true', // Enable debug logging
					NODE_ENV: 'test', // Ensure tests are detected
				},
			});

			// Collect stdout data
			child.stdout.on('data', (data) => {
				const chunk = data.toString();
				stdout += chunk;
				console.log(`STDOUT chunk: ${chunk.substring(0, 50)}...`);
			});

			// Collect stderr data
			child.stderr.on('data', (data) => {
				const chunk = data.toString();
				stderr += chunk;
				console.log(`STDERR chunk: ${chunk.substring(0, 50)}...`);
			});

			// Handle process completion
			child.on('close', (exitCode) => {
				clearTimeout(timeoutId);
				console.log(`Command completed with exit code: ${exitCode}`);
				console.log(`Total STDOUT length: ${stdout.length} chars`);

				// Get the non-debug output for debugging purposes
				const nonDebugOutput = stdout
					.split('\n')
					.filter((line) => !line.match(/^\[\d{2}:\d{2}:\d{2}\]/))
					.join('\n');

				console.log(
					`Non-debug output length: ${nonDebugOutput.length} chars`,
				);
				console.log(`STDOUT excerpt: ${stdout.substring(0, 100)}...`);
				console.log(
					`Filtered excerpt: ${nonDebugOutput.substring(0, 100)}...`,
				);

				resolve({
					stdout,
					stderr,
					exitCode: exitCode ?? 0,
				});
			});

			// Handle process errors
			child.on('error', (err) => {
				clearTimeout(timeoutId);
				console.error(`Command error: ${err.message}`);
				reject(err);
			});
		});
	}

	/**
	 * Validates that stdout contains expected strings/patterns
	 */
	static validateOutputContains(
		output: string,
		expectedPatterns: (string | RegExp)[],
	): void {
		// Filter out debug log lines for cleaner validation
		const cleanOutput = output
			.split('\n')
			.filter((line) => !line.match(/^\[\d{2}:\d{2}:\d{2}\]/))
			.join('\n');

		console.log('==== Cleaned output for validation ====');
		console.log(cleanOutput);
		console.log('=======================================');

		for (const pattern of expectedPatterns) {
			if (typeof pattern === 'string') {
				expect(cleanOutput).toContain(pattern);
			} else {
				expect(cleanOutput).toMatch(pattern);
			}
		}
	}

	/**
	 * Validates TOON output format
	 * TOON uses "key: value" syntax for objects
	 */
	static validateToonOutput(output: string): void {
		// Filter out debug log lines for cleaner validation
		const cleanOutput = output
			.split('\n')
			.filter((line) => !line.match(/^\[\d{2}:\d{2}:\d{2}\]/))
			.join('\n');

		// TOON format characteristics:
		// - Key-value pairs in "key: value" format
		// - No curly braces for objects
		// - Arrays use [count]{fields}: notation
		const toonPatterns = [
			/^\w+:\s*.+/m, // key: value pattern
		];

		expect(toonPatterns.some((pattern) => pattern.test(cleanOutput))).toBe(
			true,
		);
	}

	/**
	 * Validates Markdown output format
	 * @deprecated Use validateToonOutput for new code - output is now TOON by default
	 */
	static validateMarkdownOutput(output: string): void {
		// Filter out debug log lines for cleaner validation
		const cleanOutput = output
			.split('\n')
			.filter((line) => !line.match(/^\[\d{2}:\d{2}:\d{2}\]/))
			.join('\n');

		// Check for Markdown heading
		expect(cleanOutput).toMatch(/^#\s.+/m);

		// Check for markdown formatting elements like bold text, lists, etc.
		const markdownElements = [
			/\*\*.+\*\*/, // Bold text
			/-\s.+/, // List items
			/\|.+\|.+\|/, // Table rows
			/\[.+\]\(.+\)/, // Links
		];

		expect(
			markdownElements.some((pattern) => pattern.test(cleanOutput)),
		).toBe(true);
	}
}

import { Command } from 'commander';
import { Logger } from '../utils/logger.util.js';
import { handleCliError } from '../utils/error.util.js';
import ipAddressController from '../controllers/ipaddress.controller.js';

const logger = Logger.forContext('cli/ipaddress.cli.ts');

/**
 * Register IP address CLI commands
 * @param program The Commander program instance
 */
function register(program: Command) {
	const methodLogger = logger.forMethod('register');
	methodLogger.debug('Registering IP address CLI commands...');

	program
		.command('get-ip-details')
		.description(
			'Gets geolocation and network details about an IP address or the current device.',
		)
		.argument('[ipAddress]', 'IP address to lookup (omit for current IP)')
		.option(
			'-e, --include-extended-data',
			'Include extended data (ASN, host, org). Requires API token.',
		)
		.option(
			'--no-use-https', // commander creates a 'useHttps' boolean, defaulting to true
			'Use HTTP instead of HTTPS for the API call.',
		)
		.option(
			'--jq <expression>',
			'JMESPath expression to filter/transform the response.',
		)
		.option(
			'-o, --output-format <format>',
			'Output format: "toon" (default, token-efficient) or "json".',
			'toon',
		)
		.action(async (ipAddress, options) => {
			const actionLogger = logger.forMethod('action:get-ip-details');
			try {
				actionLogger.debug(`CLI get-ip-details called`, {
					ipAddress,
					options,
				});

				// Create a single args object to pass to the controller
				const args = {
					ipAddress,
					includeExtendedData: options.includeExtendedData || false,
					useHttps: options.useHttps, // commander handles the default via --no-use-https
					jq: options.jq,
					outputFormat: options.outputFormat as 'toon' | 'json',
				};

				const result = await ipAddressController.get(args);
				console.log(result.content);
			} catch (error) {
				handleCliError(error);
			}
		});

	methodLogger.debug('IP address CLI commands registered successfully');
}

export default { register };

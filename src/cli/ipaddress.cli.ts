import { Command } from 'commander';
import { Logger } from '../utils/logger.util.js';
import { handleCliError } from '../utils/error.util.js';

import ipAddressController from '../controllers/ipaddress.controller.js';

/**
 * Register IP address CLI commands
 * @param program The Commander program instance
 */
function register(program: Command) {
	const cliLogger = Logger.forContext('cli/ipaddress.cli.ts', 'register');
	cliLogger.debug(`Registering IP address CLI commands...`);

	program
		.command('get-ip-details')
		.description(
			`Get geolocation and network details about an IP address or the current device.

        PURPOSE: Retrieve comprehensive information about an IP address including geographical location, ISP, organization, and network details.
        
        Use Case: Useful for identifying the location of an IP address, determining network ownership, or checking your own public IP information.
        
        Output: Formatted Markdown containing location data (country, region, city), network information (ISP, organization, AS number), coordinates, and a link to view the location on a map.
        
        Examples:
  $ mcp-ipaddress get-ip-details
  $ mcp-ipaddress get-ip-details 8.8.8.8
  $ mcp-ipaddress get-ip-details 1.1.1.1`,
		)
		.argument(
			'[ipAddress]',
			'IP address to lookup (optional, omit for current device)',
		)
		.option(
			'--extended',
			'Include extended data like ASN, mobile and proxy detection',
		)
		.option(
			'--https',
			'Use HTTPS for API requests (may require paid API key)',
		)
		.action(
			async (
				ipAddress?: string,
				cmdOptions?: { extended?: boolean; https?: boolean },
			) => {
				const commandLogger = Logger.forContext(
					'cli/ipaddress.cli.ts',
					'get-ip-details',
				);
				try {
					commandLogger.debug(
						`Processing IP details request for ${ipAddress || 'current device'}`,
						cmdOptions,
					);

					// Map CLI options to controller options
					const controllerOptions = {
						includeExtendedData: cmdOptions?.extended || false,
						useHttps: cmdOptions?.https || false,
					};

					commandLogger.debug(
						'Calling controller with options',
						controllerOptions,
					);
					const result = await ipAddressController.get(
						ipAddress,
						controllerOptions,
					);
					commandLogger.debug(`IP details retrieved successfully`);
					console.log(result.content);
				} catch (error) {
					handleCliError(error);
				}
			},
		);

	cliLogger.debug('IP address CLI commands registered successfully');
}

export default { register };

import { Logger } from '../utils/logger.util.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const logger = Logger.forContext('services/shopify.service.ts');

interface ShopifyGlobalConfig {
	accessToken: string;
	myshopifyDomain: string;
}

const API_VERSION = '2025-01'; // Hardcoded API version

let _globalConfig: ShopifyGlobalConfig | null = null;

/**
 * Gets the Shopify myshopifyDomain from environment variables or the MCP config file.
 * @returns The Shopify myshopifyDomain.
 * @throws Will throw an error if the myshopifyDomain is not set.
 */
export function getShopifyDomain(): string {
	if (_globalConfig && _globalConfig.myshopifyDomain) {
		return _globalConfig.myshopifyDomain;
	}

	let myshopifyDomain = process.env.SHOPIFY_DOMAIN;

	if (!myshopifyDomain) {
		logger.debug(
			'Shopify domain not set via environment variable, trying ~/.mcp/configs.json',
		);
		try {
			const configPath = path.join(os.homedir(), '.mcp', 'configs.json');
			if (fs.existsSync(configPath)) {
				const mcpConfig = JSON.parse(
					fs.readFileSync(configPath, 'utf-8'),
				);
				if (mcpConfig.shopify && mcpConfig.shopify.myshopifyDomain) {
					myshopifyDomain = mcpConfig.shopify.myshopifyDomain;
					logger.debug(
						'Loaded Shopify domain from ~/.mcp/configs.json',
					);
				}
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			logger.error(
				'Failed to load Shopify domain from ~/.mcp/configs.json',
				{ error: errorMessage },
			);
		}
	}

	if (!myshopifyDomain) {
		logger.error(
			"Shopify domain is missing. Please set SHOPIFY_DOMAIN environment variable or configure it in ~/.mcp/configs.json under a 'shopify.myshopifyDomain' key.",
		);
		throw new Error('Shopify domain is missing. Cannot proceed.');
	}

	if (!_globalConfig) {
		_globalConfig = { myshopifyDomain, accessToken: '' };
	} else {
		_globalConfig.myshopifyDomain = myshopifyDomain;
	}

	logger.info('Shopify service configured with domain: ' + myshopifyDomain);
	return myshopifyDomain;
}

/**
 * Gets the Shopify access token from environment variables or the MCP config file.
 * @returns The Shopify access token.
 * @throws Will throw an error if the access token is not set.
 */
export function getShopifyAccessToken(): string {
	if (_globalConfig && _globalConfig.accessToken) {
		return _globalConfig.accessToken;
	}

	let accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

	if (!accessToken) {
		logger.debug(
			'Shopify access token not set via environment variable, trying ~/.mcp/configs.json',
		);
		try {
			const configPath = path.join(os.homedir(), '.mcp', 'configs.json');
			if (fs.existsSync(configPath)) {
				const mcpConfig = JSON.parse(
					fs.readFileSync(configPath, 'utf-8'),
				);
				if (mcpConfig.shopify && mcpConfig.shopify.accessToken) {
					accessToken = mcpConfig.shopify.accessToken;
					logger.debug(
						'Loaded Shopify access token from ~/.mcp/configs.json',
					);
				}
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			logger.error(
				'Failed to load Shopify access token from ~/.mcp/configs.json',
				{ error: errorMessage },
			);
		}
	}

	if (!accessToken) {
		logger.error(
			"Shopify access token is missing. Please set SHOPIFY_ACCESS_TOKEN environment variable or configure it in ~/.mcp/configs.json under a 'shopify.accessToken' key.",
		);
		throw new Error('Shopify access token is missing. Cannot proceed.');
	}

	if (!_globalConfig) {
		_globalConfig = { accessToken, myshopifyDomain: '' };
	} else {
		_globalConfig.accessToken = accessToken;
	}

	logger.info('Shopify service configured with access token.');
	return accessToken;
}

interface ShopifyError {
	message: string;
	locations?: Array<{ line: number; column: number }>;
	path?: Array<string | number>;
	extensions?: Record<string, unknown>;
}

interface ShopifyGraphQLResponse<T> {
	data?: T;
	errors?: ShopifyError[];
	extensions?: Record<string, unknown>;
}

/**
 * Executes a GraphQL query against the Shopify Admin API.
 * @param myshopifyDomain The Shopify domain (e.g., 'your-store-handle' from 'your-store-handle.myshopify.com')
 * @param accessToken The Shopify Admin API access token for the store.
 * @param query The GraphQL query string (ensure it's tagged with `#graphql` for codegen).
 * @param variables An object containing variables for the query.
 * @returns The data part of the JSON response from the Shopify API.
 * @throws Will throw an error if the request fails or Shopify returns errors.
 */
export async function executeShopifyQuery<
	T = unknown,
	V = Record<string, unknown>,
>(
	myshopifyDomain: string,
	accessToken: string,
	query: string,
	variables?: V,
): Promise<T> {
	if (!myshopifyDomain) {
		throw new Error('Shopify domain is required to execute a query.');
	}
	if (!accessToken) {
		throw new Error('Shopify access token is required to execute a query.');
	}
	const endpoint = `https://${myshopifyDomain}/admin/api/${API_VERSION}/graphql.json`;

	logger.debug('Executing Shopify GraphQL query', {
		myshopifyDomain,
		endpoint,
		query: query.substring(0, 100) + '...',
		hasVariables: !!variables,
	});

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Shopify-Access-Token': accessToken,
			},
			body: JSON.stringify({ query, variables }),
		});

		const responseText = await response.text(); // Read the body once
		if (!response.ok) {
			logger.error('Shopify API request failed', {
				status: response.status,
				statusText: response.statusText,
				responseBody: responseText,
			});
			throw new Error(
				`Shopify API request failed: ${response.status} ${response.statusText} - ${responseText}`,
			);
		}

		const jsonResponse = JSON.parse(
			responseText,
		) as ShopifyGraphQLResponse<T>;

		if (jsonResponse.errors && jsonResponse.errors.length > 0) {
			logger.error('Shopify API returned GraphQL errors', {
				errors: jsonResponse.errors,
			});
			throw new Error(
				`Shopify API returned GraphQL errors: ${JSON.stringify(jsonResponse.errors)}`,
			);
		}

		if (jsonResponse.data === undefined) {
			// This case should ideally be caught by errors, but as a safeguard:
			logger.error('Shopify API returned no data and no errors', {
				response: jsonResponse,
			});
			throw new Error('Shopify API returned no data and no errors.');
		}

		logger.debug('Shopify GraphQL query successful');
		return jsonResponse.data;
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		logger.error('Error executing Shopify GraphQL query', {
			error: errorMessage,
			stack: errorStack,
		});
		throw error; // Re-throw original error for the controller to handle
	}
}

// Example GraphQL query string (to be used in controller)
// Ensure this is tagged with #graphql for codegen to pick it up if defined here,
// or preferably define it in the controller and import types from generated files.
/*
export const GET_SHOP_DETAILS_QUERY = `#graphql
  query GetShopDetails {
    shop {
      id
      name
      email
      currencyCode
      primaryDomain {
        host
        url
      }
      plan {
        displayName
        partnerDevelopment
        shopifyPlus
      }
    }
  }
`;
*/

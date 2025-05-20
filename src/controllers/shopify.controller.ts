import { Logger } from '../utils/logger.util.js';
import {
	executeShopifyQuery,
	getShopifyDomain,
	getShopifyAccessToken,
} from '../services/shopify.service.js';
import { handleControllerError } from '../utils/error-handler.util.js';
import { ControllerResponse } from '../types/common.types.js';
// Import generated GraphQL types
import type { GetShopDetailsQuery } from '../types/generated/shopifyAdmin/admin.generated.d.ts';

const logger = Logger.forContext('controllers/shopify.controller.ts');

// Define the GraphQL query string for fetching shop details.
// The #graphql tag is important for codegen.
const GET_SHOP_DETAILS_QUERY_STRING = `#graphql
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

export interface GetShopDetailsControllerOptions {
	myshopifyDomain?: string;
	accessToken?: string;
}

/**
 * Controller to fetch shop details from Shopify.
 * If myshopifyDomain and accessToken are not provided, uses configuration values.
 */
export async function getShopDetailsController(
	options: GetShopDetailsControllerOptions = {},
): Promise<ControllerResponse> {
	const myshopifyDomain = options.myshopifyDomain || getShopifyDomain();
	const accessToken = options.accessToken || getShopifyAccessToken();

	logger.info('Attempting to fetch shop details from Shopify', {
		myshopifyDomain,
	});

	try {
		const result = await executeShopifyQuery<GetShopDetailsQuery>(
			myshopifyDomain,
			accessToken,
			GET_SHOP_DETAILS_QUERY_STRING,
		);

		if (!result || !result.shop) {
			logger.warn('Received no shop data from Shopify API', {
				myshopifyDomain,
			});
			throw new Error(
				'No shop data received from Shopify API for store: ' +
					myshopifyDomain,
			);
		}

		logger.info('Successfully fetched shop details', {
			myshopifyDomain,
			shopName: result.shop.name,
		});

		// Format the shop details as a Markdown string for the ControllerResponse
		const shopDetailsMarkdown =
			'```json\n' + JSON.stringify(result.shop, null, 2) + '\n```';

		return {
			content: shopDetailsMarkdown,
		};
	} catch (error) {
		logger.error('Error in getShopDetailsController', {
			myshopifyDomain,
			error,
		});
		throw handleControllerError(error, {
			entityType: 'ShopifyShopDetails',
			operation: 'getShopDetails',
			source: 'controllers/shopify.controller.ts',
			additionalInfo: { myshopifyDomain },
		});
	}
}

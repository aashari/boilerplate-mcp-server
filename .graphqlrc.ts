import { shopifyApiProject, ApiType } from '@shopify/api-codegen-preset';

// Note: You might need to update the apiVersion periodically.
// Refer to Shopify's documentation for the latest stable API versions.
const apiVersion = '2025-01';

export default {
	schema: `https://shopify.dev/admin-graphql-direct-proxy/${apiVersion}`,
	documents: ['./src/**/*.{ts,tsx}'], // Looks for .ts and .tsx files in the src directory
	projects: {
		default: shopifyApiProject({
			apiType: ApiType.Admin,
			apiVersion: apiVersion,
			documents: ['./src/**/*.{ts,tsx}'],
			outputDir: './src/types/generated/shopifyAdmin/', // Output directory for generated types
		}),
	},
};

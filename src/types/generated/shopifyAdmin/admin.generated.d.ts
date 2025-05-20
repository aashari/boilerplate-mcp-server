/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type GetShopDetailsQueryVariables = AdminTypes.Exact<{
	[key: string]: never;
}>;

export type GetShopDetailsQuery = {
	shop: Pick<AdminTypes.Shop, 'id' | 'name' | 'email' | 'currencyCode'> & {
		primaryDomain: Pick<AdminTypes.Domain, 'host' | 'url'>;
		plan: Pick<
			AdminTypes.ShopPlan,
			'displayName' | 'partnerDevelopment' | 'shopifyPlus'
		>;
	};
};

interface GeneratedQueryTypes {
	'#graphql\n  query GetShopDetails {\n    shop {\n      id\n      name\n      email\n      currencyCode\n      primaryDomain {\n        host\n        url\n      }\n      plan {\n        displayName\n        partnerDevelopment\n        shopifyPlus\n      }\n    }\n  }\n': {
		return: GetShopDetailsQuery;
		variables: GetShopDetailsQueryVariables;
	};
}

interface GeneratedMutationTypes {}
declare module '@shopify/admin-api-client' {
	type InputMaybe<T> = AdminTypes.InputMaybe<T>;
	interface AdminQueries extends GeneratedQueryTypes {}
	interface AdminMutations extends GeneratedMutationTypes {}
}

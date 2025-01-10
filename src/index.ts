/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { MeshConfig, MappedHeader } from '@multitenant-graphql/utils';
import { MeshPlugin, OnFetchHookDonePayload, OnFetchHookPayload } from '@graphql-mesh/types';
import { Plugin } from 'graphql-yoga';
import {
	getSourceResponseHeaders,
	processMeshResponseHeaders,
} from '@multitenant-graphql/utils/responseHeaders';
import { addSourceMappedHeader } from './mappedHeaders';
import { GraphQLResolveInfo } from 'graphql/type';
import { updateHeaders } from './response';
import { shouldIncludeMetadata } from './request';

type Context = { request: Request; response: Response };
type YogaMeshPlugin = Plugin<Context> & MeshPlugin<Context>;

/**
 * Extract and process headers from sources.
 * @param meshConfig Mesh configuration
 */
function useSourceHeaders(meshConfig: MeshConfig): YogaMeshPlugin {
	// Map containing source headers per request.
	const mappedHeaders = new WeakMap<Request, MappedHeader[]>();

	/**
	 * Get source response headers for a given request.
	 * @param request Incoming request.
	 */
	function getMappedHeaders(request: Request) {
		let headers = mappedHeaders.get(request);
		if (!headers) {
			headers = [];
			mappedHeaders.set(request, headers);
		}
		return headers;
	}

	return {
		/**
		 * On fetch handler for source headers plugin. Collects headers from each source fetch.
		 * @see https://the-guild.dev/graphql/mesh/docs/plugins/plugins-introduction
		 * @param context OnFetch context.
		 * @param info GraphQL resolve info.
		 */
		onFetch: ({ context, info }: OnFetchHookPayload<Context>) => {
			if (context != null) {
				return ({ response }: OnFetchHookDonePayload) => {
					const mappedHeaders = getMappedHeaders(context.request);
					const sourceName =
						(info as GraphQLResolveInfo & { sourceName: string })?.sourceName || 'undefined';

					// Cookies
					// @ts-ignore
					response.headers.getSetCookie().forEach(value => {
						addSourceMappedHeader(mappedHeaders, sourceName, 'set-cookie', value);
					});

					// Other headers
					response.headers?.forEach((value, key) => {
						if (key === 'set-cookie') {
							return;
						}
						addSourceMappedHeader(mappedHeaders, sourceName, key, value);
					});
				};
			}
		},
		/**
		 * On response handler for source headers plugin. Updates the response with headers collected from each source fetch.
		 * @see https://the-guild.dev/graphql/yoga-server/docs/features/envelop-plugins#onresponse
		 * @param request Incoming request.
		 * @param response Outgoing response.
		 */
		onResponse({ request, response }: Context) {
			const mappedRequestHeaders = getMappedHeaders(request);

			// Clean up mapped headers
			mappedHeaders.delete(request);

			// Process mesh response headers
			const sourceResponseHeaders = getSourceResponseHeaders(
				meshConfig,
				mappedRequestHeaders,
				shouldIncludeMetadata(request),
			);
			const processedResponseHeaders = processMeshResponseHeaders(
				meshConfig.responseConfig,
				sourceResponseHeaders,
				request.method,
				mappedRequestHeaders,
			);
			updateHeaders(response, processedResponseHeaders);
		},
	};
}

export default useSourceHeaders;
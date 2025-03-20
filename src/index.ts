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

import { MappedHeader, MeshConfig } from './types/mesh';
import { MeshPlugin, OnFetchHookDonePayload, OnFetchHookPayload } from '@graphql-mesh/types';
import { Plugin } from 'graphql-yoga';
import {
	getSourceResponseHeaders,
	processMeshResponseHeaders,
} from './responseHeaders';
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
//TODO: Add type for meshConfig
function useSourceHeaders(meshConfig: MeshConfig): YogaMeshPlugin {
	// Map containing sources queried per request
	const mappedSources = new WeakMap<Request, Set<string>>();

	// Map containing source headers per request.
	const mappedHeaders = new WeakMap<Request, MappedHeader[]>();

	/**
	 * Get sources for a given request.
	 * @param request Incoming request.
	 */
	function getMappedSources(request: Request) {
		let sources = mappedSources.get(request);
		if (!sources) {
			sources = new Set();
			mappedSources.set(request, sources);
		}
		return sources;
	}

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
					const mappedSources = getMappedSources(context.request);
					const sourceName =
						(info as GraphQLResolveInfo & { sourceName: string })?.sourceName || 'undefined';
					mappedSources.add(sourceName);

					const mappedHeaders = getMappedHeaders(context.request);

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
			const sourcesQueried = getMappedSources(request);
			const mappedResponseHeaders = getMappedHeaders(request);

			// Clean up maps
			mappedSources.delete(request);
			mappedHeaders.delete(request);

			// Get source response headers. This list should contain all response headers allowed to be included in response.
			const sourceResponseHeaders = getSourceResponseHeaders(
				meshConfig,
				mappedResponseHeaders,
				shouldIncludeMetadata(request),
			);

			// Get processed response headers. This list should contain final response headers for the response.
			const processedResponseHeaders = processMeshResponseHeaders(
				meshConfig.responseConfig || {},
				meshConfig.sources.filter(source => sourcesQueried.has(source.name)),
				mappedResponseHeaders,
				sourceResponseHeaders,
			);
			updateHeaders(response, processedResponseHeaders);
		},
	};
}

export default useSourceHeaders;

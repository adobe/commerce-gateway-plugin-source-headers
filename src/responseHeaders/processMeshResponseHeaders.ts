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

import { getCacheControlDirectives } from '../cachecontrol/getCacheControlDirectives';
import { MappedHeader, MeshResponseConfig } from '../types/mesh';

/**
 * This function takes in the mesh config response headers as well as the source response headers
 * and performs business logic on what to return back. This function also runs the lowest common
 * denominator algorithm on the cache-control headers to return back to the user
 * @param meshResponseConfig response headers defined in the mesh config
 * @param sourceResponseConfig source response headers based on source response config
 * @param method Is this a GET,POST,PUT,DELETE
 * @param responseHeaders source response headers returned back from the query
 * @returns
 */
export const processMeshResponseHeaders = (
	meshResponseConfig: MeshResponseConfig | undefined,
	sourceResponseConfig: { [k: string]: string[] },
	method: string,
	responseHeaders: MappedHeader[] | undefined,
): { [k: string]: string | string[] } => {
	// Start with source response headers based on source response configuration
	let processedHeaders: { [k: string]: string | string[] } = { ...(sourceResponseConfig || {}) };

	// Always include the lowest common denominator cache-control header. This header is calculated based all response
	// headers regardless of the source response configuration headers.
	if (responseHeaders) {
		const ccDirectives = getCacheControlDirectives(responseHeaders);
		processedHeaders = { ...processedHeaders, ...ccDirectives };
	}

	// Apply the mesh response headers if they exist
	if (meshResponseConfig && meshResponseConfig.headers) {
		//make sure we are standardizing all the headers
		const meshHeaders = Object.fromEntries(
			Object.entries(meshResponseConfig.headers).map(([k, v]) => [
				k.toLowerCase(),
				v.toLowerCase(),
			]),
		);
		processedHeaders = { ...processedHeaders, ...meshHeaders };
	}

	return processedHeaders;
};

export default processMeshResponseHeaders;

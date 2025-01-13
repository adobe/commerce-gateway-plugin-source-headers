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

import { MappedHeader } from '@multitenant-graphql/utils';

/**
 * Adds source prefixed mapped header to be returned in a response.
 * @param mappedHeaders Mapped headers.
 * @param sourceName Source name.
 * @param name Header name.
 * @param value Header value.
 */
function addPrefixedMappedHeader(
	mappedHeaders: MappedHeader[],
	sourceName: string,
	name: string,
	value: string,
) {
	mappedHeaders.push({
		name:
			//To return source prefixed headers except cache-control
			name !== 'cache-control' ? `x-${sourceName}-${name}` : name,
		source: sourceName,
		values: [value],
	});
}

/**
 * Adds mapped header equal to the source header name/value to be returned in a response.
 * @param mappedHeaders Mapped headers.
 * @param sourceName Source name.
 * @param name Header name.
 * @param value Header value.
 */
function addMappedHeader(
	mappedHeaders: MappedHeader[],
	sourceName: string,
	name: string,
	value: string,
) {
	// Do not add access control headers to mapped headers as they must be distinct and should be set by mesh responseConfig.
	if (!name.toLowerCase().startsWith('access-control-')) {
		mappedHeaders.push({
			name,
			source: sourceName,
			values: [value],
		});
	}
}

/**
 * Add source mapped headers to mapped headers.
 * @param mappedHeaders Mapped headers.
 * @param sourceName Source name.
 * @param name Header name.
 * @param value Header value.
 */
function addSourceMappedHeader(
	mappedHeaders: MappedHeader[],
	sourceName: string,
	name: string,
	value: string,
) {
	addPrefixedMappedHeader(mappedHeaders, sourceName, name, value);
	addMappedHeader(mappedHeaders, sourceName, name, value);
}

export { addSourceMappedHeader };

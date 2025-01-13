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

import { MappedHeader, MeshConfig, SourceConfig } from '../types/mesh';

/**
 * Runs business logic on the response headers passed in based on the includeMetadata flag
 * @param meshConfig Mesh config.
 * @param responseHeaders headers to send to be processed
 * @param includeMetadata flag to indicate if we want to return all source headers back prefixed by x-sourcename
 * @returns
 */
export const getSourceResponseHeaders = (
	meshConfig: MeshConfig,
	responseHeaders: MappedHeader[] | undefined,
	includeMetadata: boolean
): { [k: string]: string[] } => {
	const sourceResponseHeaders: {
		[k: string]: string[];
	} = {};
	const sourceResponseHeadersMap = new Map<string, string[]>();
	if (meshConfig) {
		meshConfig.sources.forEach((source: SourceConfig) => {
			if (source.responseConfig && source.responseConfig.headers) {
				sourceResponseHeadersMap.set(source.name, source.responseConfig.headers);
			}
		});

		responseHeaders?.forEach(element => {
			const respArray = sourceResponseHeadersMap.get(element.source);
			const lower = respArray?.map(element => {
				return element.toLowerCase();
			});
			const elementName = element.name.toLowerCase();
			if (includeMetadata || (lower && lower.includes(elementName))) {
				if (elementName.endsWith('set-cookie')) {
					element.values?.forEach(value => {
						// Take unique set-cookie headers
						const setCookieHeaders = sourceResponseHeaders[elementName] || [];
						if (!setCookieHeaders.includes(value)) {
							sourceResponseHeaders[elementName] = setCookieHeaders.concat(value);
						}
					});
				} else {
					// Take the last value of all other headers
					sourceResponseHeaders[elementName] = element.values;
				}
			}
		});
	}

	// remove transfer encoding header as it breaks x-include-metadata feature with gateway error
	delete sourceResponseHeaders['transfer-encoding'];
	return sourceResponseHeaders || {};
};

export default getSourceResponseHeaders;
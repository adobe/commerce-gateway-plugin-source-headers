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


import { YamlConfig } from '@graphql-mesh/types';

export type MappedHeader = {
	name: string;
	source: string;
	values: string[];
};

export interface SourceResponseConfig {
	headers?: string[];
}

export declare type CORSOptions = {
	origin?: string[] | string;
	methods?: string[];
	allowedHeaders?: string[];
	exposedHeaders?: string[];
	credentials?: boolean;
	maxAge?: number;
	preflightContinue?: boolean;
};

export interface CustomSource extends YamlConfig.Source {
	responseConfig?: SourceResponseConfig;
}

export interface SourceResponseConfig {
	headers?: string[];
	/**
	 * Source cache configuration.
	 */
	cache?: CacheConfig;
}

/**
 * Cache configuration.
 */
export interface CacheConfig {
	/**
	 * Comma-delimited cache control directives. Similar to the HTTP cache control header.
	 * @see https://www.rfc-editor.org/rfc/rfc9111.html#name-cache-control
	 */
	cacheControl?: string;
}

export interface MeshConfig {
	sources: CustomSource[];
	responseConfig?: ResponseConfig;
}

export interface ResponseConfig {
	headers?: {
		[k: string]: string;
	};
	CORS?: CORSOptions;
	includeHTTPDetails?: boolean;
	/**
	 * Whether response caching is enabled.
	 * @ignore Property is not considered for JSON schema generation.
	 */
	cache?: boolean;
}

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

type FederationTransform = Omit<YamlConfig.FederationTransform, 'version'>;

export interface Tenant {
	/**
	 * annotation for json-schema generation
	 * @ignore
	 */
	lastUpdated: string | undefined;
	meshConfig: MeshConfig;
	meshId: string;
	lastUpdatedBy?: IMSUser;
	configId?: string | undefined;
	/**
	 * annotation for json-schema generation
	 * @ignore
	 */
	meshStatus?: MeshStatus | undefined;
	/**
	 * annotation for json-schema generation
	 * @ignore
	 */
	error?: string | undefined;
	/**
	 * annotation for json-schema generation
	 * @ignore
	 */
	tenantUUID?: string | undefined;
	createdBy?: IMSUser;
	createdOn?: string | undefined;
	orgName?: string | undefined;
	projectName?: string | undefined;
	workspaceName?: string | undefined;
	meshStatusReason?: string | undefined;
	secrets?: string | undefined;
}

export interface GraphQLHandlerHTTPConfiguration {
	endpoint: string;
	/**
	 * schemaHeaders in GQL also support exporting a JSON
	 * object from a file but we will only be supporting
	 * JSON object like other handlers. No file export support.
	 */
	schemaHeaders?: {
		[k: string]: any;
	};
	operationHeaders?: {
		[k: string]: any;
	};
	useGETForQueries?: boolean;
	method?: 'GET' | 'POST';
	source?: string;
}

export interface OpenapiHandler {
	source: any;
	sourceFormat?: 'json' | 'yaml';
	operationHeaders?: {
		[k: string]: any;
	};
	schemaHeaders?: {
		[k: string]: any;
	};
	baseUrl?: string;
	qs?: {
		[k: string]: any;
	};
	includeHttpDetails?: boolean;
}

export interface JsonSchemaHandler {
	baseUrl?: string;
	operationHeaders?: {
		[k: string]: any;
	};
	schemaHeaders?: {
		[k: string]: any;
	};
	/**
	 * Any of: JsonSchemaHTTPOperation, JsonSchemaPubSubOperation
	 */
	operations: YamlConfig.JsonSchemaHTTPOperation[];
	ignoreErrorResponses?: boolean;
}

export interface CustomHandler {
	graphql?: GraphQLHandlerHTTPConfiguration ;
	openapi?: OpenapiHandler;
	JsonSchema?: JsonSchemaHandler;
}

export interface CustomTransform {
	encapsulate?: YamlConfig.EncapsulateTransformObject;
	federation?: FederationTransform;
	filterSchema?: YamlConfig.FilterSchemaTransform;
	namingConvention?: YamlConfig.NamingConventionTransformConfig;
	prefix?: YamlConfig.PrefixTransformConfig;
	rename?: YamlConfig.RenameTransform;
	replaceField?: CustomReplaceFieldTransformConfig;
	typeMerging?: YamlConfig.TypeMergingConfig;
	resolversComposition?: YamlConfig.ResolversCompositionTransform;
}

export interface CustomReplaceFieldTransformConfig {
	typeDefs?: any;
	replacements: CustomReplaceFieldTransformObject[];
}

export type CustomReplaceFieldTransformObject = {
	from: YamlConfig.ReplaceFieldConfig;
	to: YamlConfig.ReplaceFieldConfig1;
	/**
	 * Allowed values: config, hoistValue
	 */
	scope?: 'config' | 'hoistValue';
	composer?: string;
	name?: string;
};

export interface CustomSource extends YamlConfig.Source {
	handler: CustomHandler;
	transforms?: CustomTransform[];
	responseConfig?: SourceResponseConfig;
}

export type MappedHeader = {
	name: string;
	source: string;
	values: string[];
};

export type SourceMappedHeaders = {
	[key: string]: {
		[key: string]: string;
	};
};

export type Artifact = {
	contentType: string | undefined;
	data: Buffer;
	fileName: string | undefined;
};

export interface File {
	path: string;
	content: string;
	/**
	 * @ignore
	 */
	materializedPath?: string;
}

export interface SourceResponseConfig {
	headers?: string[];
}

export interface SourceConfig extends YamlConfig.Source {
	responseConfig?: SourceResponseConfig;
}

export interface MeshConfig {
	sources: CustomSource[];
	transforms?: CustomTransform[];
	files?: File[];
	additionalTypeDefs?: any;
	additionalResolvers?: AdditionalResolvers;
	responseConfig?: ResponseConfig;
	plugins?: MeshPlugin[];
	HIPAA?: boolean;
	disableIntrospection?: boolean;
	runtimeConfig?: RuntimeConfig;
	responseCache?: ResponseCache;
}

export type AdditionalResolvers = (
	| string
	| YamlConfig.AdditionalStitchingResolverObject
	| YamlConfig.AdditionalStitchingBatchResolverObject
)[];

export interface ResponseConfig {
	headers?: {
		[k: string]: string;
	};
	CORS?: CORSOptions;
	includeHTTPDetails?: boolean;
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

export interface MeshResponseConfig {
	headers?: {
		[k: string]: string;
	};
	CORS?: CORSOptions;
}

export type FileInfo = {
	name: string;
	relativePath: string;
	absolutePath: string;
	parentDir: DirPath;
};

export type DirPath = {
	relative: string;
	absolute: string;
};

export type CreateTenant = Omit<Tenant, 'meshId'>;

export type UpdateTenant = Omit<Tenant, 'meshId'>;
export interface IMSUser {
	userId: string;
	userEmail: string;
	firstName: string;
	lastName: string;
	displayName: string;
}

export interface PrometheusPlugin {
	execute: boolean;
	endpoint: '/metrics';
	requestCount?: boolean;
	requestSummary?: boolean;
	parse?: boolean;
	validate?: boolean;
	contextBuilding?: boolean;
	errors?: boolean;
	resolvers?: boolean;
}

export interface NewRelicPlugin {
	includeDocument?: boolean;
	includeExecuteVariables?: boolean;
	includeRawResult?: boolean;
	trackResolvers?: boolean;
	includeResolverArgs?: boolean;
	rootFieldsNaming?: boolean;
}

export interface Hook {
	target: string;
	composer: string;
	blocking?: boolean;
}
export interface HooksPlugin {
	beforeAll?: Omit<Hook, 'target'>;
}

export type OnFetchPlugin = {
	source: string;
	handler: string;
};

export interface MeshPlugin {
	/**
	 * @ignore
	 */
	prometheus?: PrometheusPlugin;
	/**
	 * @ignore
	 */
	newrelic?: NewRelicPlugin;
	/**
	 * @ignore
	 */
	httpDetailsExtensions?: object;
	hooks?: HooksPlugin;
	onFetch?: OnFetchPlugin[];
}

export enum MeshStatus {
	success = 'success',
	building = 'building',
	error = 'error',
	pending = 'pending',
	delete = 'delete',
}

export interface Features {
	imsOrgId: string;
	showCloudflareURL: boolean;
}

export type SchemaCoordinate = {
	ttl: number;
	coordinate: string;
};

export type ResponseCache = {
	globalTtl?: number;
	ttlPerSchemaCoordinate?: SchemaCoordinate[];
	includeExtensionMetadata?: boolean;
};

export interface RuntimeConfig {
	contextConfig?: RunTimeContextConfig;
}

export interface RunTimeContextConfig {
	fetchConfig?: FetchConfig;
	cacheConfig?: CacheConfig;
}

export interface FetchConfig {
	allowedDomains?: string[];
}

export interface CacheConfig {
	ttl?: number;
}

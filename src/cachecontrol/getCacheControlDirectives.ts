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

import { CustomSource, MappedHeader } from '../types/mesh';

/**
 * Returns the lowest common denominator on all the sources cache-control headers
 * @param responseHeaders Mapped response headers
 * @param queriedSources Source configurations used in the query
 * @returns Cache control directives
 */
export const getCacheControlDirectives = (
	responseHeaders: MappedHeader[],
	queriedSources: CustomSource[],
): { [k: string]: string } => {
	let ccDirectives: {
		[k: string]: string;
	} = {};

	// Collect whether each source has returned cache control headers
	const sourceReturnedCacheControl: { [k: string]: boolean } = {};

	// Get the cache-control directives from the response headers
	responseHeaders?.forEach(element => {
		if (element.name.toLowerCase() === 'cache-control') {
			// Flag source as having returned cache control
			if (!sourceReturnedCacheControl[element.source]) {
				sourceReturnedCacheControl[element.source] = true;
			}
			const currentCacheMap = parseCacheControl(element.values.toString());
			const standardizedCacheMap = Object.fromEntries(
				Object.entries(currentCacheMap).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
			);
			ccDirectives = resolveCacheDirectives(ccDirectives, standardizedCacheMap);
		}
	});

	// Get the cache config for the sources based on sources involved in query
	queriedSources.forEach(sourceConfig => {
		const sourceConfigCacheControl = sourceConfig?.responseConfig?.cache?.cacheControl;
		// If source used in query did not return cache control, consider the default for the source
		if (!sourceReturnedCacheControl[sourceConfig.name] && sourceConfigCacheControl) {
			const currentCacheMap = parseCacheControl(sourceConfigCacheControl);
			const standardizedCacheMap = Object.fromEntries(
				Object.entries(currentCacheMap).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
			);
			ccDirectives = resolveCacheDirectives(ccDirectives, standardizedCacheMap);
		}
	});

	return { 'cache-control': ccDirectivesToString(ccDirectives) };
};

/**
 * Parses out the cache-control headers into a map
 * @param directives
 * @returns
 */
function parseCacheControl(directives: string): { [k: string]: string } {
	//                     1: directive                                                  =   2: token                                              3: quoted-string
	 
	const regex =
		/(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g;

	const header: { [k: string]: string } = {};
	const err = directives.replace(regex, function ($0, $1, $2, $3) {
		const value = $2 || $3;
		header[$1] = value ? value.toLowerCase() : $1;
		return '';
	});

	return err ? {} : header;
}

/**
 * Runs a lowest common denominator algorithm on the current source cache-control header
 * @param lowestValuesCacheDirectives - object containing the lowest values of the cache-control headers
 * @param currentDirectives - current source cache-control headers
 * @returns lowestValuesCacheDirectives
 */
function resolveCacheDirectives(
	lowestValuesCacheDirectives: { [k: string]: string },
	currentDirectives: { [k: string]: string },
): { [k: string]: string } {
	//if any header contains no-store, we are done
	if (lowestValuesCacheDirectives['no-store']) {
		return lowestValuesCacheDirectives;
	}
	if (currentDirectives['no-store']) {
		lowestValuesCacheDirectives = {};
		lowestValuesCacheDirectives['no-store'] = 'no-store';
		return lowestValuesCacheDirectives;
	}
	//id min values for each of these directives
	const minDirectives = [
		'min-fresh',
		'max-age',
		'max-stale',
		's-maxage',
		'stale-if-error',
		'stale-while-revalidate',
	];
	minDirectives.forEach(element => {
		updateToMin(element, currentDirectives[element], lowestValuesCacheDirectives);
	});
	//add these directives, if they are not already present
	const otherDirectives = [
		'public',
		'private',
		'immutable',
		'no-cache',
		'no-transform',
		'must-revalidate',
		'proxy-revalidate',
		'must-understand',
	];

	Object.keys(currentDirectives).forEach(key => {
		if (otherDirectives.includes(key) && !lowestValuesCacheDirectives[key]) {
			lowestValuesCacheDirectives[key] = currentDirectives[key];
		}
	});

	// handle mutual exclusivity of public/private directives, opting for more restrictive
	if (lowestValuesCacheDirectives['private'] && lowestValuesCacheDirectives['public']) {
		delete lowestValuesCacheDirectives['public'];
	}

	// handle precedence of private over s-maxage, opting for more restrictive
	if (lowestValuesCacheDirectives['private'] && lowestValuesCacheDirectives['s-maxage']) {
		delete lowestValuesCacheDirectives['s-maxage'];
	}

	return lowestValuesCacheDirectives;
}

/**
 * Updates a cache-control header value to the lowest value if required
 * @param key
 * @param candidateMin
 * @param cachedHeaders
 * @returns
 */
function updateToMin(
	key: string,
	candidateMin: string,
	cachedHeaders: { [k: string]: string },
): { [k: string]: string } {
	//first check if both values exist and are not undefined
	if (cachedHeaders[key] && candidateMin) {
		//if the value to be replaced is not a number and the candidate is a number we do a direct replacement
		if (isNaN(Number(cachedHeaders[key])) && !isNaN(Number(candidateMin))) {
			cachedHeaders[key] = candidateMin;
		}
		//if both values are integers and the candidate is lower than the existing lowest value, replace the current value with the candidate
		else if (!isNaN(Number(cachedHeaders[key])) && !isNaN(Number(candidateMin))) {
			if (Number(cachedHeaders[key]) > Number(candidateMin)) {
				cachedHeaders[key] = candidateMin;
			}
		}
	}
	//do a direct in-place update of the existing array
	else if (candidateMin) {
		cachedHeaders[key] = candidateMin;
	}
	return cachedHeaders;
}

/**
 * Returns the cache-control headers as a string
 * @param directives
 * @returns
 */
function ccDirectivesToString(directives: { [k: string]: string }): string {
	const chStr: Array<string> = [];
	Object.keys(directives).forEach((key) => {
		if (directives[key] === key) {
			chStr.push(key);
		} else {
			chStr.push(key + '=' + directives[key]);
		}
	});
	return chStr.toString();
}

export default getCacheControlDirectives;

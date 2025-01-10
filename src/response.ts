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

/**
 * Update headers.
 * @param response Response.
 * @param processedResponseHeaders Processed response headers.
 */
function updateHeaders(
	response: Response,
	processedResponseHeaders: { [p: string]: string | string[] },
) {
	for (const header in processedResponseHeaders) {
		const headerValue = processedResponseHeaders[header];
		if (!headerValue) {
			continue;
		}
		if (Array.isArray(headerValue)) {
			headerValue.forEach(value => {
				if (!value) {
					return;
				}
				response.headers.append(header, value);
			});
		} else {
			response.headers.set(header, headerValue);
		}
	}
}

export { updateHeaders };

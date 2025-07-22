// import yaml from "js-yaml";
import type { SelectedEndpoints, OpenAPISpec } from '../../types/openapi';

interface Parameter {
  in: string;
  name: string;
}

/**
 * Generate application config YAML from OpenAPI spec and selected endpoints.
 * @param openApi The OpenAPI spec object
 * @param selectedEndpoints The selected endpoints with their attributes
 * @returns YAML string for the app config
 */
export function generateAppConfigYaml(openApi: OpenAPISpec | null, selectedEndpoints: SelectedEndpoints = {}): string {
  if (!openApi || Object.keys(selectedEndpoints).length === 0) {
    return '# Application config YAML will appear here\n';
  }
  
  // Build endpoints config from selected endpoints
  const endpoints: Record<string, unknown> = {};
  
  for (const [, endpointSelection] of Object.entries(selectedEndpoints)) {
    const { path, method } = endpointSelection;
    
    // Find the operation in the OpenAPI spec
    const methods = openApi.paths?.[path];
    if (!methods) continue;
    
    const details = methods[method.toLowerCase()];
    if (!details) continue;

    // Use 'Api' as default API name since tags are not available in the interface
    const apiName = 'Api';
    // Use operationId or method+path as EndpointName
    const endpointName = details.operationId || `${method.toUpperCase()}_${path.replace(/\W+/g, '_')}`;
    // Extract path params
    const pathParams = (details.parameters || []).filter((p: Parameter) => p.in === 'path').map((p: Parameter) => p.name);
    
    endpoints[`${apiName}/${endpointName}`] = {
      http: {
        method: method.toUpperCase(),
        url: {
          template: path,
          path_params: pathParams,
        },
      },
    };
  }
  
  const config = {
    version: 1,
    endpoints,
  };
  // Replace YAML output with JSON for now, or use another YAML serializer if needed
  return '---\n' + JSON.stringify(config, null, 2) + '\n';
} 
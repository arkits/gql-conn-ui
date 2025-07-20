import yaml from "js-yaml";
import type { SelectedEndpoints } from '../../types/openapi';

/**
 * Generate application config YAML from OpenAPI spec and selected endpoints.
 * @param openApi The OpenAPI spec object
 * @param selectedEndpoints The selected endpoints with their attributes
 * @returns YAML string for the app config
 */
export function generateAppConfigYaml(openApi: any, selectedEndpoints: SelectedEndpoints = {}): string {
  if (!openApi || Object.keys(selectedEndpoints).length === 0) {
    return '# Application config YAML will appear here\n';
  }
  
  // Build endpoints config from selected endpoints
  const endpoints: Record<string, any> = {};
  
  for (const [, endpointSelection] of Object.entries(selectedEndpoints)) {
    const { path, method } = endpointSelection;
    
    // Find the operation in the OpenAPI spec
    const methods = openApi.paths?.[path];
    if (!methods) continue;
    
    const details = methods[method.toLowerCase()];
    if (!details) continue;

    // Use tags[0] as ApiName if available, else fallback to 'Api'
    const apiName = Array.isArray(details.tags) && details.tags.length > 0 ? details.tags[0] : 'Api';
    // Use operationId or method+path as EndpointName
    const endpointName = details.operationId || `${method.toUpperCase()}_${path.replace(/\W+/g, '_')}`;
    // Extract path params
    const pathParams = (details.parameters || []).filter((p: any) => p.in === 'path').map((p: any) => p.name);
    
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
  return '---\n' + yaml.dump(config);
} 
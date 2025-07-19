import yaml from "js-yaml";

/**
 * Generate application config YAML from OpenAPI spec and selected attributes.
 * @param openApi The OpenAPI spec object
 * @param selectedAttrs The selected attributes per endpoint/type
 * @returns YAML string for the app config
 */
export function generateAppConfigYaml(openApi: any, selectedAttrs: Record<string, Record<string, boolean>>): string {
  if (!openApi || !selectedAttrs || Object.keys(selectedAttrs).length === 0) {
    return '# Application config YAML will appear here\n';
  }
  // Build endpoints config
  const endpoints: Record<string, any> = {};
  for (const [path, methods] of Object.entries(openApi.paths || {})) {
    for (const [method, details] of Object.entries(methods as any) as [string, any][]) {
      // Find the operationId/typeName for this endpoint's response
      const responses = details.responses || {};
      const successEntry = Object.entries(responses).find(([code]) => /^2\d\d$/.test(code));
      if (!successEntry) continue;
      const [code, resp] = successEntry;
      const respObj = resp as any;
      if (!respObj.content) continue;
      for (const [type, content] of Object.entries(respObj.content as any)) {
        const contentObj = content as any;
        if (type.includes('json') && contentObj.schema) {
          let typeName = '';
          if (contentObj.schema.$ref) {
            typeName = contentObj.schema.$ref.replace('#/components/schemas/', '');
          } else if (details.operationId) {
            typeName = details.operationId + '_' + code;
          } else {
            typeName = 'Type_' + code;
          }
          const selected = selectedAttrs[typeName];
          if (selected && Object.keys(selected).length > 0) {
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
        }
      }
    }
  }
  const config = {
    version: 1,
    endpoints,
  };
  return '---\n' + yaml.dump(config);
} 
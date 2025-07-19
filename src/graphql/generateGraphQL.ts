// Helper to generate partial GraphQL type from selected attributes
function generatePartialGraphQLType(name: string, schema: any, openApi: any, selected: Record<string, boolean>, path: string[] = [], typeMap: Record<string, string> = {}): string {
  if (!schema) return '';
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    if (typeMap[refName]) return refName;
    const resolved = openApi?.components?.schemas?.[refName];
    return generatePartialGraphQLType(refName, resolved, openApi, selected, path, typeMap);
  }
  if (schema.type === 'object') {
    let fields = '';
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const attrPath = [...path, key].join('.');
        if (selected[attrPath]) {
          const fieldType = generatePartialGraphQLType(key, propSchema, openApi, selected, [...path, key], typeMap);
          fields += `  ${key}: ${fieldType}\n`;
        }
      }
    }
    const typeDef = `type ${name} {\n${fields}}`;
    typeMap[name] = typeDef;
    return name;
  }
  if (schema.type === 'array') {
    const itemType = generatePartialGraphQLType(name + 'Item', schema.items, openApi, selected, [...path, '0'], typeMap);
    return `[${itemType}]`;
  }
  if (schema.type === 'string') return 'String';
  if (schema.type === 'integer') return 'Int';
  if (schema.type === 'number') return 'Float';
  if (schema.type === 'boolean') return 'Boolean';
  return 'String';
}

export function generateGraphQLSchemaFromSelections(openApi: any, selectedAttrs: Record<string, Record<string, boolean>>): string {
  if (!openApi) return '';
  const typeMap: Record<string, string> = {};
  const queryFields: string[] = [];
  const comments: string[] = [];

  function processOperation(path: string, method: string, details: any) {
    const operationId = details.operationId || `${method}_${path.replace(/\W+/g, '_')}`;
    const description = details.summary || details.description || '';
    const responses = details.responses || {};
    const successEntry = Object.entries(responses).find(([code]) => /^2\d\d$/.test(code));
    if (!successEntry) return;
    const [code, resp] = successEntry;
    const respObj = resp as any;
    if (!respObj.content) return;
    for (const [type, content] of Object.entries(respObj.content as any)) {
      const contentObj = content as any;
      if (type.includes('json') && contentObj.schema) {
        let typeName = '';
        if (contentObj.schema.$ref) {
          typeName = contentObj.schema.$ref.replace('#/components/schemas/', '');
        } else if (operationId) {
          typeName = operationId + '_' + code;
        } else {
          typeName = 'Type_' + code;
        }
        const selected = selectedAttrs[typeName];
        if (selected && Object.keys(selected).length > 0) {
          generatePartialGraphQLType(typeName, contentObj.schema, openApi, selected, [], typeMap);
          const queryName = operationId;
          const comment = `# Converted from OpenAPI: ${method.toUpperCase()} ${path}\n# ${description}`;
          comments.push(comment);
          queryFields.push(`  ${queryName}: ${typeName}`);
        }
      }
    }
  }

  for (const [path, methods] of Object.entries(openApi.paths || {})) {
    for (const [method, details] of Object.entries(methods as any)) {
      processOperation(path, method, details as any);
    }
  }

  let schema = '';
  if (Object.keys(typeMap).length > 0) {
    schema += Object.values(typeMap).join('\n\n') + '\n\n';
  }
  if (queryFields.length > 0) {
    schema += comments.join('\n') + '\n';
    schema += `type Query {\n${queryFields.join('\n')}\n}`;
  }
  return schema || '# GraphQL schema will appear here\n';
} 
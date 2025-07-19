import { useState, useEffect, useMemo } from 'react';
import type { OpenAPISpec, SelectedAttributes } from '../types/openapi';
import { generateGraphQLSchemaFromSelections } from '../lib/graphql/generateGraphQL';
import { generateAppConfigYaml } from '../lib/appConfig/configGenerator';

export function useGraphQLGeneration(openApi: OpenAPISpec | null, selectedAttrs: SelectedAttributes) {
  const [graphqlSchema, setGraphqlSchema] = useState<string>('# GraphQL schema will appear here\n');
  const [appConfigYaml, setAppConfigYaml] = useState<string>('# Application config YAML will appear here\n');

  const hasSelections = useMemo(() => {
    return Object.keys(selectedAttrs).some(typeName => 
      Object.keys(selectedAttrs[typeName] || {}).length > 0
    );
  }, [selectedAttrs]);

  useEffect(() => {
    if (openApi && hasSelections) {
      try {
        setGraphqlSchema(generateGraphQLSchemaFromSelections(openApi, selectedAttrs));
      } catch (error) {
        console.error('Error generating GraphQL schema:', error);
        setGraphqlSchema('# Error generating GraphQL schema\n');
      }
    } else {
      setGraphqlSchema('# GraphQL schema will appear here\n');
    }

    try {
      setAppConfigYaml(generateAppConfigYaml(openApi, selectedAttrs));
    } catch (error) {
      console.error('Error generating app config:', error);
      setAppConfigYaml('# Error generating application config\n');
    }
  }, [openApi, selectedAttrs, hasSelections]);

  return {
    graphqlSchema,
    appConfigYaml,
    hasSelections
  };
}
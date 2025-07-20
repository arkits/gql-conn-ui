import { useState, useEffect, useMemo, useRef } from 'react';
import type { OpenAPISpec, SelectedAttributes, SelectedEndpoints } from '../types/openapi';
import { generateGraphQLSchemaFromSelections } from '../lib/graphql/generateGraphQL';
import { generateAppConfigYaml } from '../lib/appConfig/configGenerator';
import { useSettings } from '../contexts/SettingsContext';

export function useGraphQLGeneration(
  openApi: OpenAPISpec | null, 
  selectedAttrs: SelectedAttributes,
  selectedEndpoints: SelectedEndpoints = {}
) {
  const [graphqlSchema, setGraphqlSchema] = useState<string>('# GraphQL schema will appear here\n');
  const [appConfigYaml, setAppConfigYaml] = useState<string>('# Application config YAML will appear here\n');
  const { requiredScopes } = useSettings();

  const hasSelections = useMemo(() => {
    return Object.keys(selectedEndpoints).length > 0;
  }, [selectedEndpoints]);

  // Use refs to track previous values
  const prevOpenApiRef = useRef<OpenAPISpec | null>(null);
  const prevSelectedEndpointsRef = useRef<SelectedEndpoints>({});

  // Effect for GraphQL schema generation
  useEffect(() => {
    if (openApi && hasSelections) {
      try {
        setGraphqlSchema(generateGraphQLSchemaFromSelections(openApi, selectedAttrs, selectedEndpoints, requiredScopes));
      } catch (error) {
        console.error('Error generating GraphQL schema:', error);
        setGraphqlSchema('# Error generating GraphQL schema\n');
      }
    } else {
      setGraphqlSchema('# GraphQL schema will appear here\n');
    }
  }, [openApi, selectedAttrs, selectedEndpoints, hasSelections, requiredScopes]);

  // Effect for app config generation - only when dependencies actually change
  useEffect(() => {
    const openApiChanged = JSON.stringify(openApi) !== JSON.stringify(prevOpenApiRef.current);
    const selectedEndpointsChanged = JSON.stringify(selectedEndpoints) !== JSON.stringify(prevSelectedEndpointsRef.current);
    
    // Always call on first render (when refs are null/empty)
    const isFirstRender = prevOpenApiRef.current === null && Object.keys(prevSelectedEndpointsRef.current).length === 0;
    
    if (isFirstRender || openApiChanged || selectedEndpointsChanged) {
      try {
        setAppConfigYaml(generateAppConfigYaml(openApi, selectedEndpoints));
      } catch (error) {
        console.error('Error generating app config:', error);
        setAppConfigYaml('# Error generating application config\n');
      }
      
      // Update refs
      prevOpenApiRef.current = openApi;
      prevSelectedEndpointsRef.current = selectedEndpoints;
    }
  }, [openApi, selectedEndpoints]);

  return {
    graphqlSchema,
    appConfigYaml,
    hasSelections
  };
}
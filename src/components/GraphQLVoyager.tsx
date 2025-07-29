import { Voyager } from 'graphql-voyager';
import { buildSchema, introspectionFromSchema } from 'graphql';
import { Box } from '@chakra-ui/react';

interface GraphQLVoyagerProps {
  graphqlSchema: string;
  darkMode: boolean;
}

export function GraphQLVoyager({ graphqlSchema, darkMode }: GraphQLVoyagerProps) {
  if (!graphqlSchema) {
    return <Box>No schema available</Box>;
  }

  let introspection;
  try {
    const schema = buildSchema(graphqlSchema);
    introspection = introspectionFromSchema(schema);
  } catch (error) {
    console.error('Error building schema or creating introspection:', error);
    return <Box>Error building schema. Please check the console for details.</Box>;
  }

  return (
    <Box
      h="100%"
      w="100%"
      className={darkMode ? 'voyager-dark' : 'voyager-light'}
      sx={{
        '.voyager-dark': {
          '--voyager-color-background': '#1a202c',
          '--voyager-color-text': '#e2e8f0',
          '--voyager-color-border': '#2d3748',
          '--voyager-color-primary': '#4299e1',
          '--voyager-color-secondary': '#9f7aea',
          '--voyager-color-success': '#48bb78',
          '--voyager-color-warn': '#ed8936',
          '--voyager-color-error': '#f56565',
          '--voyager-color-text-faded': '#a0aec0',
          '--voyager-color-text-hover': '#fff',
          '--voyager-color-field-name': '#e2e8f0',
          '--voyager-color-field-type': '#a0aec0',
          '--voyager-color-field-deprecated': '#f56565',
          '--voyager-color-keyword': '#4299e1',
          '--voyager-color-type-name': '#e2e8f0',
          '--voyager-color-type-mod': '#a0aec0',
        },
        '.voyager-light': {
          '--voyager-color-background': '#fff',
          '--voyager-color-text': '#2d3748',
          '--voyager-color-border': '#e2e8f0',
          '--voyager-color-primary': '#3182ce',
          '--voyager-color-secondary': '#805ad5',
          '--voyager-color-success': '#38a169',
          '--voyager-color-warn': '#dd6b20',
          '--voyager-color-error': '#c53030',
          '--voyager-color-text-faded': '#718096',
          '--voyager-color-text-hover': '#000',
          '--voyager-color-field-name': '#2d3748',
          '--voyager-color-field-type': '#718096',
          '--voyager-color-field-deprecated': '#c53030',
          '--voyager-color-keyword': '#3182ce',
          '--voyager-color-type-name': '#2d3748',
          '--voyager-color-type-mod': '#718096',
        }
      }}
    >
      <Voyager
        introspection={introspection}
        displayOptions={{
          hideDocs: false,
          hideSettings: false,
          skipRelay: true,
          sortByAlphabet: false,
          showLeafFields: true,
          hideRoot: false,
        }}
      />
    </Box>
  );
}

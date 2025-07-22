export interface OpenAPISpec {
  paths?: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
  };
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
}

export interface OpenAPIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: OpenAPISchema;
  description?: string;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, OpenAPIMediaType>;
}

export interface OpenAPIResponse {
  description?: string;
  content?: Record<string, OpenAPIMediaType>;
}

export interface OpenAPIMediaType {
  schema?: OpenAPISchema;
}

export interface OpenAPISchema {
  type?: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  $ref?: string;
  $$ref?: string;
  required?: string[];
  description?: string;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  content?: Record<string, { schema?: OpenAPISchema }>;
  format?: string;
  example?: unknown;
  enum?: unknown[];
  default?: unknown;
  xml?: {
    name?: string;
    wrapped?: boolean;
  };
}

export interface TreeNode {
  path: string;
  methods: TreeMethod[];
}

export interface TreeMethod {
  method: string;
  details: OpenAPIOperation;
}

export type SelectedAttributes = Record<string, Record<string, boolean>>;

export interface EndpointSelection {
  path: string;
  method: string;
  typeName: string;
  selectedAttrs: Record<string, boolean>;
}

export type SelectedEndpoints = Record<string, EndpointSelection>;

export interface GraphQLDirective {
  path: string;
  method: string;
  selection: string[];
}
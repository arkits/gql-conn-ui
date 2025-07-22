import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  type GraphQLFieldConfigMap,
  type GraphQLOutputType,
  type GraphQLInputType,
} from "graphql";
import type {
  OpenAPISchema,
  OpenAPISpec,
  SelectedAttributes,
} from "../../types/openapi";
import type { TypeMaps } from "./types";
import {
  hasRef,
  resolveRef,
  getRefName,
  getPreferredName,
  singularizeAndCapitalize,
} from "./utils";

export function buildObjectType(
  name: string,
  schema: OpenAPISchema,
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[] = [],
  typeMaps: TypeMaps
): GraphQLObjectType | GraphQLList<GraphQLObjectType> {
  if (!schema) {
    const typeName = name.endsWith("_Empty") ? name : name + "_Empty";
    return new GraphQLObjectType({ name: typeName, fields: {} });
  }

  console.log(`Building GraphQL type for: ${name}`, schema);

  if (schema.$ref) {
    const refName = getRefName(schema.$ref);
    if (typeMaps.output[refName]) return typeMaps.output[refName];
    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) {
      return new GraphQLObjectType({
        name: refName + "_Unresolved",
        fields: {},
      });
    }

    const nestedSelectedAttrs = enrichSelectedAttrsForRef(
      selectedAttrs,
      typeName,
      path,
      refName
    );
    const gqlType = buildObjectType(
      refName,
      resolved,
      openApi,
      nestedSelectedAttrs,
      refName,
      [],
      typeMaps
    );
    typeMaps.output[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }

  if (schema.type === "object") {
    const selected = selectedAttrs[typeName] || {};
    const fields: GraphQLFieldConfigMap<unknown, unknown> = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const attrPath = [...path, key].join(".");
        if (selected[attrPath]) {
          let nestedTypeName = key;
          if (propSchema) {
            const preferredName = getPreferredName(propSchema);
            if (preferredName) {
              nestedTypeName = preferredName;
            }
          }

          console.log(`Processing property: ${key} with type: ${nestedTypeName}`, propSchema);

          fields[key] = {
            type: mapToGraphQLOutputTypeInternal(
              propSchema,
              openApi,
              selectedAttrs,
              nestedTypeName,
              [...path, key],
              typeMaps
            ),
          };
        }
      }
    }

    const gqlType = new GraphQLObjectType({
      name,
      fields,
      description: schema.description,
    });
    typeMaps.output[name] = gqlType;
    return gqlType;
  }

  if (schema.type === "array") {
    let itemTypeName = singularizeAndCapitalize(typeName);
    if (schema.items) {
      const preferredName = getPreferredName(schema.items);
      if (preferredName) {
        itemTypeName = preferredName;
      }
    }
    
    // Normalize selectedAttrs for array item type: strip '0.' prefix from keys
    const parentSelected = selectedAttrs[typeName] || {};
    const itemSelectedAttrs: Record<string, boolean> = {};
    for (const key in parentSelected) {
      if (key.startsWith("0.")) {
        itemSelectedAttrs[key.slice(2)] = parentSelected[key];
      }
    }
    const normalizedSelectedAttrs = {
      ...selectedAttrs,
      [itemTypeName]: itemSelectedAttrs,
    };
    return new GraphQLList(
      buildObjectType(
        itemTypeName,
        schema.items || {},
        openApi,
        normalizedSelectedAttrs,
        itemTypeName,
        [...path, "0"],
        typeMaps
      ) as GraphQLObjectType
    );
  }

  return new GraphQLObjectType({ name: name + "_Scalar", fields: {} });
}

export function buildInputType(
  name: string,
  schema: OpenAPISchema,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps
): GraphQLInputObjectType {
  if (!schema) {
    const typeName = name.endsWith("_Empty") ? name : name + "_Empty";
    return new GraphQLInputObjectType({ name: typeName, fields: {} });
  }

  if (schema.$ref) {
    const refName = getRefName(schema.$ref) + "Input";
    if (typeMaps.input[refName]) return typeMaps.input[refName];

    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) {
      return new GraphQLInputObjectType({
        name: refName + "_Unresolved",
        fields: {},
      });
    }

    const gqlType = buildInputType(refName, resolved, openApi, typeMaps);
    typeMaps.input[refName] = gqlType;
    return gqlType;
  }

  if (schema.type === "object") {
    const fields: Record<string, { type: GraphQLInputType }> = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        fields[key] = {
          type: mapToGraphQLInputTypeInternal(
            propSchema,
            openApi,
            typeMaps,
            name + "_" + key
          ),
        };
      }
    }

    const gqlType = new GraphQLInputObjectType({ name, fields });
    typeMaps.input[name] = gqlType;
    return gqlType;
  }

  return new GraphQLInputObjectType({
    name: name + "_ScalarInput",
    fields: {},
  });
}

function enrichSelectedAttrsForRef(
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[],
  refName: string
): SelectedAttributes {
  let nestedSelectedAttrs = selectedAttrs[refName];

  if (!nestedSelectedAttrs || Object.keys(nestedSelectedAttrs).length === 0) {
    const parentSelected = selectedAttrs[typeName] || {};
    const prefix = path.length > 0 ? path.join(".") + "." : "";
    nestedSelectedAttrs = {};

    for (const attrPath in parentSelected) {
      if (attrPath.startsWith(prefix)) {
        const rest = attrPath.slice(prefix.length);
        if (rest && !rest.includes(".")) {
          nestedSelectedAttrs[rest] = true;
        } else if (rest) {
          const first = rest.split(".")[0];
          nestedSelectedAttrs[first] = true;
        }
      }
    }
  }

  return { ...selectedAttrs, [refName]: nestedSelectedAttrs };
}

function mapToGraphQLOutputTypeInternal(
  schema: OpenAPISchema | undefined,
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[] = [],
  typeMaps: TypeMaps
): GraphQLOutputType {
  if (!schema) return GraphQLString;

  if (schema.$ref) {
    const refName = getRefName(schema.$ref);
    if (typeMaps.output[refName]) return typeMaps.output[refName];

    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) return GraphQLString;

    const gqlType = buildObjectType(
      refName,
      resolved,
      openApi,
      selectedAttrs,
      refName,
      [],
      typeMaps
    );
    typeMaps.output[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }

  switch (schema.type) {
    case "object": {
      return buildObjectType(
        typeName,
        schema,
        openApi,
        selectedAttrs,
        typeName,
        path,
        typeMaps
      );
    }

    case "array": {
      let itemTypeName = singularizeAndCapitalize(typeName);
      if (schema.items) {
        const preferredName = getPreferredName(schema.items);
        if (preferredName) {
          itemTypeName = preferredName;
        }
      }
      // Normalize selectedAttrs for array item type: strip '0.' prefix from keys
      const parentSelected = selectedAttrs[typeName] || {};
      const itemSelectedAttrs: Record<string, boolean> = {};
      for (const key in parentSelected) {
        if (key.startsWith("0.")) {
          itemSelectedAttrs[key.slice(2)] = parentSelected[key];
        }
      }
      const normalizedSelectedAttrs = {
        ...selectedAttrs,
        [itemTypeName]: itemSelectedAttrs,
      };
      return new GraphQLList(
        mapToGraphQLOutputTypeInternal(
          schema.items,
          openApi,
          normalizedSelectedAttrs,
          itemTypeName,
          [...path, "0"],
          typeMaps
        )
      );
    }

    case "string":
      return GraphQLString;
    case "integer":
      return GraphQLInt;
    case "number":
      return GraphQLFloat;
    case "boolean":
      return GraphQLBoolean;
    default:
      return GraphQLString;
  }
}

function mapToGraphQLInputTypeInternal(
  schema: OpenAPISchema | undefined,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps,
  nameHint = "Input"
): GraphQLInputType {
  if (!schema) return GraphQLString;

  if (schema.$ref) {
    const refName = getRefName(schema.$ref) + nameHint;
    if (typeMaps.input[refName]) return typeMaps.input[refName];

    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) return GraphQLString;

    const gqlType = buildInputType(refName, resolved, openApi, typeMaps);
    typeMaps.input[refName] = gqlType;
    return gqlType;
  }

  switch (schema.type) {
    case "object": {
      return buildInputType(nameHint, schema, openApi, typeMaps);
    }

    case "array": {
      return new GraphQLList(
        mapToGraphQLInputTypeInternal(
          schema.items,
          openApi,
          typeMaps,
          nameHint + "Item"
        )
      );
    }

    case "string":
      return GraphQLString;
    case "integer":
      return GraphQLInt;
    case "number":
      return GraphQLFloat;
    case "boolean":
      return GraphQLBoolean;
    default:
      return GraphQLString;
  }
}

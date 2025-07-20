# OpenAPI → GraphQL Converter

A modern web app to convert OpenAPI (Swagger) specifications into GraphQL schemas and YAML app configs. Visualize, select, and transform REST endpoints into GraphQL operations with a beautiful, responsive UI.

## Features

- **OpenAPI Upload:** Supports `.json`, `.yaml`, and `.yml` OpenAPI specs.
- **Tree View:** Explore endpoints and schemas in an interactive tree. Select/deselect fields and endpoints.
- **Live GraphQL Schema:** Instantly generates a GraphQL schema based on your selections.
- **App Config YAML:** Generates a YAML app config alongside the schema.
- **Dark Mode:** Beautiful dark mode enabled by default.
- **Settings Drawer:** Configure advanced options and required scopes.
- **Help & Documentation:** Built-in help dialog for quick onboarding.
- **Error Boundaries:** Robust error handling for a smooth experience.

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
2. **Start the app:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
3. **Open in browser:**
   Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

4. **Upload an OpenAPI spec:**
   - Click the file input in the header to upload your `.json` or `.yaml` OpenAPI file.

5. **Explore and select:**
   - Use the left panel to browse endpoints and schemas. Select/deselect fields as needed.
   - Use "Select All" to quickly select/deselect all fields for a type.

6. **View generated output:**
   - The right panel has tabs for the GraphQL schema and YAML app config. Both update live as you make selections.

7. **Settings & Help:**
   - Use the menu button to open settings. Use the help button for documentation.

## Tech Stack

- **React** + **TypeScript** (with strict type safety)
- **Vite** for fast development
- **Chakra UI** for accessible, themeable components
- **Monaco Editor** for code and YAML editing
- **Lucide Icons** for modern iconography

## Development

- Code style: See `.eslintrc` and workspace rules for strict TypeScript and modern JS best practices.
- UI: Chakra UI with dark mode as default. Monaco Editor for all code editing.
- Types: No `any` or enums; strict types and utility types throughout.

## Contributing

Pull requests and issues are welcome! Please follow the code style and add tests for new features.

## License

MIT

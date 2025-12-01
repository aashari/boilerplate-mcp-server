# Boilerplate MCP Server

A production-ready foundation for developing custom Model Context Protocol (MCP) servers in TypeScript. Provides a complete layered architecture pattern, working example implementation, and comprehensive developer infrastructure to connect AI assistants with external APIs and data sources.

[![NPM Version](https://img.shields.io/npm/v/@aashari/boilerplate-mcp-server)](https://www.npmjs.com/package/@aashari/boilerplate-mcp-server)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **Dual Transport Support**: STDIO and Streamable HTTP transports with automatic fallback
- **5-Layer Architecture**: Clean separation between CLI, tools, controllers, services, and utilities
- **Type Safety**: Full TypeScript implementation with Zod v4 schema validation
- **TOON Output Format**: Token-Oriented Object Notation for 30-60% fewer tokens than JSON
- **JMESPath Filtering**: Extract only needed fields from responses to reduce token costs
- **Modern SDK**: Uses MCP SDK v1.23.0 with `registerTool` API pattern
- **Complete IP Address Example**: Tools, resources, and CLI commands for IP geolocation
- **Comprehensive Testing**: Unit and integration tests with coverage reporting
- **Production Tooling**: ESLint, Prettier, semantic-release, and MCP Inspector integration
- **Error Handling**: Structured error handling with contextual logging

## What is MCP?

Model Context Protocol (MCP) is an open standard for securely connecting AI systems to external tools and data sources. This boilerplate implements the MCP specification with a clean, layered architecture that can be extended to build custom MCP servers for any API or data source.

## Prerequisites

- **Node.js** (>=18.x): [Download](https://nodejs.org/)
- **Git**: For version control

## Quick Start

```bash
# Clone the repository
git clone https://github.com/aashari/boilerplate-mcp-server.git
cd boilerplate-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run in different modes:

# 1. CLI Mode - Execute commands directly
npm run cli -- get-ip-details 8.8.8.8
npm run cli -- get-ip-details              # Get your current IP
npm run cli -- get-ip-details 1.1.1.1 --include-extended-data
npm run cli -- get-ip-details 8.8.8.8 --jq "{ip: query, country: country}"  # JQ filter
npm run cli -- get-ip-details 8.8.8.8 --output-format json                   # JSON output

# 2. STDIO Transport - For AI assistant integration (Claude Desktop, Cursor)
npm run mcp:stdio

# 3. HTTP Transport - For web-based integrations
npm run mcp:http

# 4. Development with MCP Inspector
npm run mcp:inspect                         # Auto-opens browser with debugging UI
```

## Transport Modes

### STDIO Transport
- JSON-RPC communication via stdin/stdout
- Used by Claude Desktop, Cursor AI, and other local AI assistants
- Run with: `TRANSPORT_MODE=stdio node dist/index.js`

### Streamable HTTP Transport
- HTTP-based transport with Server-Sent Events (SSE)
- Supports multiple concurrent connections and web integrations
- Runs on port 3000 by default (configurable via `PORT` env var)
- MCP Endpoint: `http://localhost:3000/mcp`
- Health Check: `http://localhost:3000/` → Returns server version
- Run with: `TRANSPORT_MODE=http node dist/index.js`

## Output Formats

### TOON Format (Default)

TOON (Token-Oriented Object Notation) is a human-readable format optimized for LLMs, reducing token usage by 30-60% compared to JSON:

```
status: success
query: 8.8.8.8
country: United States
city: Ashburn
lat: 39.03
lon: -77.5
```

### JSON Format

Standard JSON output when `--output-format json` is specified:

```json
{
  "status": "success",
  "query": "8.8.8.8",
  "country": "United States",
  "city": "Ashburn"
}
```

### JMESPath Filtering

Use `--jq` to extract only needed fields, reducing token costs:

```bash
# Extract specific fields
npm run cli -- get-ip-details 8.8.8.8 --jq "{ip: query, country: country}"

# Output:
# ip: 8.8.8.8
# country: United States

# Nested structure
npm run cli -- get-ip-details 8.8.8.8 --jq "{location: {city: city, coords: {lat: lat, lon: lon}}}"
```

See [JMESPath documentation](https://jmespath.org) for more filter examples.

## Architecture Overview

<details>
<summary><b>Project Structure (Click to expand)</b></summary>

```
src/
├── cli/                    # Command-line interfaces
│   ├── index.ts            # CLI entry point with Commander setup
│   └── ipaddress.cli.ts    # IP address CLI commands
├── controllers/            # Business logic orchestration  
│   ├── ipaddress.controller.ts    # IP lookup business logic
│   └── ipaddress.formatter.ts     # Response formatting
├── services/               # External API interactions
│   ├── vendor.ip-api.com.service.ts  # ip-api.com service
│   └── vendor.ip-api.com.types.ts    # Service type definitions
├── tools/                  # MCP tool definitions (AI interface)
│   ├── ipaddress.tool.ts   # IP lookup tool for AI assistants
│   └── ipaddress.types.ts  # Tool argument schemas
├── resources/              # MCP resource definitions
│   └── ipaddress.resource.ts # IP lookup resource (URI: ip://address)
├── types/                  # Global type definitions
│   └── common.types.ts     # Shared interfaces (ControllerResponse, etc.)
├── utils/                  # Shared utilities
│   ├── logger.util.ts      # Contextual logging system
│   ├── error.util.ts       # MCP-specific error formatting
│   ├── error-handler.util.ts # Error handling utilities
│   ├── config.util.ts      # Environment configuration
│   ├── constants.util.ts   # Version and package constants
│   ├── formatter.util.ts   # Markdown formatting
│   ├── toon.util.ts        # TOON format encoding
│   ├── jq.util.ts          # JMESPath filtering
│   └── transport.util.ts   # HTTP transport utilities
└── index.ts                # Server entry point (dual transport)
```

</details>

## 5-Layer Architecture

The boilerplate follows a clean, layered architecture that promotes maintainability and clear separation of concerns:

### 1. CLI Layer (`src/cli/`)

- **Purpose**: Command-line interfaces for direct tool usage and testing
- **Implementation**: Commander-based argument parsing with contextual error handling
- **Example**: `get-ip-details [ipAddress] --include-extended-data --no-use-https`
- **Pattern**: Register commands → Parse arguments → Call controllers → Handle errors

### 2. Tools Layer (`src/tools/`)

- **Purpose**: MCP tool definitions that AI assistants can invoke
- **Implementation**: Zod schema validation with structured responses
- **Example**: `ip_get_details` tool with optional IP address and configuration options
- **Pattern**: Define schema → Validate args → Call controller → Format MCP response

### 3. Resources Layer (`src/resources/`)

- **Purpose**: MCP resources providing contextual data accessible via URIs
- **Implementation**: Uses `registerResource` API with `ResourceTemplate` for parameterized URIs
- **Example**: `ip://{ipAddress}` resource template providing IP geolocation data
- **Pattern**: Register URI template → Extract variables → Return formatted content

### 4. Controllers Layer (`src/controllers/`)

- **Purpose**: Business logic orchestration with comprehensive error handling
- **Implementation**: Options validation, fallback logic, response formatting
- **Example**: IP lookup with HTTPS fallback, test environment detection, API token validation
- **Pattern**: Validate inputs → Apply defaults → Call services → Format responses

### 5. Services Layer (`src/services/`)

- **Purpose**: Direct external API interactions with minimal business logic
- **Implementation**: HTTP transport utilities with structured error handling
- **Example**: ip-api.com API calls with authentication and field selection
- **Pattern**: Build requests → Make API calls → Validate responses → Return raw data

### 6. Utils Layer (`src/utils/`)

- **Purpose**: Shared functionality across all layers
- **Key Components**:
  - `logger.util.ts`: Contextual logging (file:method context)
  - `error.util.ts`: MCP-specific error formatting
  - `transport.util.ts`: HTTP/API utilities with retry logic
  - `config.util.ts`: Environment configuration management
  - `toon.util.ts`: TOON format encoding (token-efficient output)
  - `jq.util.ts`: JMESPath filtering for response transformation

## Developer Guide

### Development Scripts

```bash
# Build and Clean
npm run build               # Build TypeScript to dist/
npm run clean               # Remove dist/ and coverage/
npm run prepare             # Build + ensure executable permissions (for npm publish)

# CLI Testing
npm run cli -- get-ip-details 8.8.8.8                    # Test specific IP
npm run cli -- get-ip-details --include-extended-data    # Test with extended data
npm run cli -- get-ip-details --no-use-https             # Test with HTTP

# MCP Server Modes
npm run mcp:stdio           # STDIO transport for AI assistants
npm run mcp:http            # HTTP transport on port 3000
npm run mcp:inspect         # HTTP + auto-open MCP Inspector

# Development with Debugging
npm run dev:stdio           # STDIO with MCP Inspector integration
npm run dev:http            # HTTP with debug logging enabled

# Testing
npm test                    # Run all tests (Jest)
npm run test:coverage       # Generate coverage report
npm run test:cli            # Run CLI-specific tests

# Code Quality
npm run lint                # ESLint with TypeScript rules
npm run format              # Prettier formatting
npm run update:deps         # Update dependencies
```

### Environment Variables

#### Core Configuration
- `TRANSPORT_MODE`: Transport mode (`stdio` | `http`, default: `stdio`)  
- `PORT`: HTTP server port (default: `3000`)
- `DEBUG`: Enable debug logging (`true` | `false`, default: `false`)

#### IP API Configuration  
- `IPAPI_API_TOKEN`: API token for ip-api.com extended data (optional, free tier available)

#### Example `.env` File
```bash
# Basic configuration
TRANSPORT_MODE=http
PORT=3001
DEBUG=true

# Extended data (requires ip-api.com account)
IPAPI_API_TOKEN=your_token_here
```

### Debugging Tools

- **MCP Inspector**: Visual tool for testing your MCP tools
  - Run server with `npm run mcp:inspect`
  - Open the URL shown in terminal
  - Test your tools interactively

- **Debug Logging**: Enable with `DEBUG=true` environment variable

<details>
<summary><b>Configuration (Click to expand)</b></summary>

Create `~/.mcp/configs.json`:

```json
{
  "boilerplate": {
    "environments": {
      "DEBUG": "true",
      "TRANSPORT_MODE": "http",
      "PORT": "3000"
    }
  }
}
```

</details>

## Building Custom Tools

<details>
<summary><b>Step-by-Step Tool Implementation Guide (Click to expand)</b></summary>

### 1. Define Service Layer

Create a new service in `src/services/` following the vendor-specific naming pattern:

```typescript
// src/services/vendor.example-api.service.ts
import { Logger } from '../utils/logger.util.js';
import { fetchApi } from '../utils/transport.util.js';
import { ExampleApiResponse, ExampleApiRequestOptions } from './vendor.example-api.types.js';
import { createApiError, McpError } from '../utils/error.util.js';

const serviceLogger = Logger.forContext('services/vendor.example-api.service.ts');

async function get(
	param?: string,
	options: ExampleApiRequestOptions = {}
): Promise<ExampleApiResponse> {
	const methodLogger = serviceLogger.forMethod('get');
	methodLogger.debug(`Calling Example API with param: ${param}`);

	try {
		const url = `https://api.example.com/${param || 'default'}`;
		const rawData = await fetchApi<ExampleApiResponse>(url, {
			headers: options.apiKey ? { 'Authorization': `Bearer ${options.apiKey}` } : {}
		});

		methodLogger.debug('Received successful response from Example API');
		return rawData;
	} catch (error) {
		methodLogger.error('Service error fetching data', error);
		
		if (error instanceof McpError) {
			throw error;
		}
		
		throw createApiError(
			'Unexpected service error while fetching data',
			undefined,
			error
		);
	}
}

export default { get };
```

### 2. Create Controller

Add a controller in `src/controllers/` to handle business logic with error context:

```typescript
// src/controllers/example.controller.ts
import { Logger } from '../utils/logger.util.js';
import exampleService from '../services/vendor.example-api.service.js';
import { formatExample } from './example.formatter.js';
import { handleControllerError, buildErrorContext } from '../utils/error-handler.util.js';
import { ControllerResponse } from '../types/common.types.js';
import { config } from '../utils/config.util.js';

const logger = Logger.forContext('controllers/example.controller.ts');

export interface GetDataOptions {
	param?: string;
	includeMetadata?: boolean;
}

async function getData(
	options: GetDataOptions = {}
): Promise<ControllerResponse> {
	const methodLogger = logger.forMethod('getData');
	methodLogger.debug(`Getting data for param: ${options.param || 'default'}`, options);

	try {
		// Apply business logic and defaults
		const apiKey = config.get('EXAMPLE_API_TOKEN');
		
		// Call service layer
		const data = await exampleService.get(options.param, {
			apiKey,
			includeMetadata: options.includeMetadata ?? false
		});
		
		// Format response
		const formattedContent = formatExample(data);
		return { content: formattedContent };
		
	} catch (error) {
		throw handleControllerError(
			error,
			buildErrorContext(
				'ExampleData',
				'getData',
				'controllers/example.controller.ts@getData',
				options.param || 'default',
				{ options }
			)
		);
	}
}

export default { getData };
```

### 3. Implement MCP Tool

Create a tool definition in `src/tools/` following the registration pattern:

```typescript
// src/tools/example.tool.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../utils/logger.util.js';
import { formatErrorForMcpTool } from '../utils/error.util.js';
import exampleController from '../controllers/example.controller.js';

const logger = Logger.forContext('tools/example.tool.ts');

// Define Zod schema for tool arguments
const GetDataSchema = z.object({
	param: z.string().optional().describe('Optional parameter for the API call'),
	includeMetadata: z.boolean().optional().default(false)
		.describe('Whether to include additional metadata in the response')
});

async function handleGetData(args: Record<string, unknown>) {
	const methodLogger = logger.forMethod('handleGetData');
	
	try {
		methodLogger.debug('Tool example_get_data called', args);

		// Validate arguments with Zod
		const validatedArgs = GetDataSchema.parse(args);

		// Call controller
		const result = await exampleController.getData({
			param: validatedArgs.param,
			includeMetadata: validatedArgs.includeMetadata
		});

		// Return MCP-formatted response
		return {
			content: [
				{
					type: 'text' as const,
					text: result.content
				}
			]
		};
	} catch (error) {
		methodLogger.error('Tool example_get_data failed', error);
		return formatErrorForMcpTool(error);
	}
}

// Registration function using the modern registerTool API (SDK v1.22.0+)
function registerTools(server: McpServer) {
	const registerLogger = logger.forMethod('registerTools');
	registerLogger.debug('Registering example tools...');

	// SDK best practices: 'title' for UI display name, 'description' for detailed info
	server.registerTool(
		'example_get_data',
		{
			title: 'Get Example Data',  // Display name for UI (e.g., 'Get Example Data')
			description: `Gets data from the Example API with optional parameter.
Use this tool to fetch example data. Returns formatted data as Markdown.`,
			inputSchema: GetDataSchema,
		},
		handleGetData
	);

	registerLogger.debug('Example tools registered successfully');
}

export default { registerTools };
```

### 4. Add CLI Support

Create a CLI command in `src/cli/` following the Commander pattern:

```typescript
// src/cli/example.cli.ts
import { Command } from 'commander';
import { Logger } from '../utils/logger.util.js';
import exampleController from '../controllers/example.controller.js';
import { handleCliError } from '../utils/error.util.js';

const logger = Logger.forContext('cli/example.cli.ts');

function register(program: Command) {
	const methodLogger = logger.forMethod('register');
	methodLogger.debug('Registering example CLI commands...');

	program
		.command('get-data')
		.description('Gets data from the Example API')
		.argument('[param]', 'Optional parameter for the API call')
		.option('-m, --include-metadata', 'Include additional metadata in response')
		.action(async (param, options) => {
			const actionLogger = logger.forMethod('action:get-data');
			
			try {
				actionLogger.debug('CLI get-data called', { param, options });

				const result = await exampleController.getData({
					param,
					includeMetadata: options.includeMetadata || false
				});

				console.log(result.content);
			} catch (error) {
				handleCliError(error);
			}
		});

	methodLogger.debug('Example CLI commands registered successfully');
}

export default { register };
```

### 5. Register Components

Update the entry points to register your new components:

```typescript
// 1. Register CLI in src/cli/index.ts
import exampleCli from './example.cli.js';

export async function runCli(args: string[]) {
	// ... existing setup code ...
	
	// Register CLI commands
	exampleCli.register(program);  // Add this line
	
	// ... rest of function
}

// 2. Register Tools in src/index.ts
import exampleTools from './tools/example.tool.js';

// In the startServer function, after existing registrations:
exampleTools.registerTools(serverInstance);
```

### 6. Add MCP Resource (Optional)

Create a resource in `src/resources/` using the modern `registerResource` API:

```typescript
// src/resources/example.resource.ts
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.util.js';
import exampleController from '../controllers/example.controller.js';
import { formatErrorForMcpResource } from '../utils/error.util.js';

const logger = Logger.forContext('resources/example.resource.ts');

function registerResources(server: McpServer) {
	const registerLogger = logger.forMethod('registerResources');
	registerLogger.debug('Registering example resources...');

	// Use registerResource with ResourceTemplate for parameterized URIs (SDK v1.22.0+)
	server.registerResource(
		'example-data',
		new ResourceTemplate('example://{param}', { list: undefined }),
		{
			title: 'Example Data',  // Display name for UI
			description: 'Retrieve example data by parameter'
		},
		async (uri, variables) => {
			const methodLogger = logger.forMethod('exampleResource');
			try {
				// Extract parameter from template variables
				const param = variables.param as string | undefined;

				methodLogger.debug('Example resource called', { uri: uri.href, param });

				const result = await exampleController.getData({ param });

				return {
					contents: [
						{
							uri: uri.href,
							text: result.content,
							mimeType: 'text/markdown'
						}
					]
				};
			} catch (error) {
				methodLogger.error('Resource error', error);
				return formatErrorForMcpResource(error, uri.href);
			}
		}
	);

	registerLogger.debug('Example resources registered successfully');
}

export default { registerResources };
```

</details>

## IP Address Example Implementation

The boilerplate includes a complete IP address geolocation example demonstrating all layers:

### Available Tools & Commands

**CLI Commands:**
```bash
npm run cli -- get-ip-details                           # Get current public IP (TOON format)
npm run cli -- get-ip-details 8.8.8.8                   # Get details for specific IP
npm run cli -- get-ip-details 1.1.1.1 --include-extended-data   # With extended data
npm run cli -- get-ip-details 8.8.8.8 --no-use-https    # Force HTTP (for free tier)
npm run cli -- get-ip-details 8.8.8.8 --output-format json      # JSON output
npm run cli -- get-ip-details 8.8.8.8 --jq "{ip: query, country: country}"  # Filtered output
```

**MCP Tools:**
- `ip_get_details` - IP geolocation lookup for AI assistants
  - Supports `outputFormat`: "toon" (default) or "json"
  - Supports `jq`: JMESPath expression for filtering

**MCP Resources:**
- `ip://{ipAddress}` - IP details resource template (e.g., `ip://8.8.8.8`)

### Features Demonstrated

- **TOON Output**: Token-efficient format (30-60% fewer tokens than JSON)
- **JMESPath Filtering**: Extract only needed fields to reduce costs
- **Fallback Logic**: HTTPS → HTTP fallback for free tier users
- **Environment Detection**: Different behavior in test vs production
- **API Token Support**: Optional token for extended data (ASN, mobile detection, etc.)
- **Error Handling**: Structured errors for private/reserved IP addresses

### Configuration Options

```bash
# Optional - for extended data features
IPAPI_API_TOKEN=your_token_from_ip-api.com

# Development
DEBUG=true                    # Enable detailed logging
TRANSPORT_MODE=http          # Use HTTP transport
PORT=3001                    # Custom port
```

## Publishing Your MCP Server

1. **Customize Package Details:**
   ```json
   {
     "name": "your-mcp-server-name",
     "version": "1.0.0", 
     "description": "Your custom MCP server",
     "author": "Your Name",
     "keywords": ["mcp", "your-domain", "ai-integration"]
   }
   ```

2. **Update Documentation:** Replace IP address examples with your use case
3. **Test Thoroughly:**
   ```bash
   npm run build && npm test
   npm run cli -- your-command
   npm run mcp:stdio    # Test with MCP Inspector
   ```
4. **Publish:** `npm publish` (requires npm login)

## Testing Strategy

The boilerplate includes comprehensive testing infrastructure:

### Test Structure
```
tests/               # Not present - tests are in src/
src/
├── **/*.test.ts     # Co-located with source files
├── utils/           # Utility function tests
├── controllers/     # Business logic tests  
├── services/        # API integration tests
└── cli/             # CLI command tests
```

### Testing Best Practices

- **Unit Tests**: Test utilities and pure functions (`*.util.test.ts`)
- **Controller Tests**: Test business logic with mocked service calls
- **Service Tests**: Test API integration with real/mocked HTTP calls
- **CLI Tests**: Test command parsing and execution
- **Test Environment Detection**: Automatic test mode handling in controllers

### Running Tests

```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report  
npm run test:cli           # CLI-specific tests only
```

### Coverage Goals
- Target: >80% test coverage
- Focus on business logic (controllers) and utilities
- Mock external services appropriately

## License

[ISC License](https://opensource.org/licenses/ISC)

## Resources & Documentation

### MCP Protocol Resources
- [MCP Specification](https://modelcontextprotocol.io/specification) - Latest protocol specification
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript SDK v1.23.0+
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Visual debugging tool
- [MCP Concepts](https://modelcontextprotocol.io/docs/concepts) - Tools, resources, transports

### Implementation References
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers) - Community examples
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Your MCP Server Ecosystem
- [All @aashari MCP Servers](https://www.npmjs.com/~aashari) - NPM packages
- [GitHub Repositories](https://github.com/aashari?tab=repositories&q=mcp-server) - Source code
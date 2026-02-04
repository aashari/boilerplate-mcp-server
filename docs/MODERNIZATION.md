# Modernization Update - February 2026

## Overview

This document tracks the modernization of boilerplate-mcp-server to use the latest stable versions of dependencies and incorporate new best practices.

**Date**: February 4, 2026  
**Previous Version**: 1.17.0  
**Dependencies Updated**: All major dependencies to latest stable versions

---

## Dependency Updates

### Production Dependencies

| Package | From → To | Notable Changes |
|---------|-----------|----------------|
| `@modelcontextprotocol/sdk` | 1.23.0 → 1.25.3 | Bug fixes, improved stability |
| `zod` | 4.1.13 → 4.3.6 | Major feature release (see below) |
| `@toon-format/toon` | 2.0.1 → 2.1.0 | Performance improvements |
| `commander` | 14.0.2 → 14.0.3 | Minor bug fixes |
| `cors` | 2.8.5 → 2.8.6 | Security patches |
| `express` | 5.1.0 → 5.2.1 | Bug fixes, performance improvements |

### Development Dependencies

| Package | From → To | Notable Changes |
|---------|-----------|----------------|
| `@types/node` | 24.10.1 → 24.10.10 | Updated type definitions |

---

## Zod 4.3.x New Features

Zod 4.3 is a major feature release with several powerful additions. While the boilerplate currently doesn't utilize these features, they are available for future enhancements:

### New Schema Types

#### 1. **`z.fromJSONSchema()`** - JSON Schema Conversion
Convert JSON Schema definitions directly into Zod schemas:

```typescript
import * as z from "zod";

const schema = z.fromJSONSchema({
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0 },
  },
  required: ["name"],
});

schema.parse({ name: "Alice", age: 30 }); // ✅
```

**Use case**: Migrating from JSON Schema to Zod, integrating with OpenAPI specs.

#### 2. **`z.xor()`** - Exclusive Union
Requires exactly one option to match (unlike `z.union()` which passes if any match):

```typescript
const schema = z.xor([z.string(), z.number()]);

schema.parse("hello"); // ✅
schema.parse(42);      // ✅
schema.parse(true);    // ❌ zero matches
```

**Use case**: Form validation where exactly one authentication method must be provided.

#### 3. **`z.looseRecord()`** - Partial Record Validation
Only validates keys matching the key schema, passes through non-matching keys:

```typescript
const schema = z.looseRecord(z.string().regex(/^S_/), z.string());

schema.parse({ S_name: "John", other: 123 });
// ✅ { S_name: "John", other: 123 }
// only S_name is validated, "other" passes through
```

**Use case**: API responses where you only care about specific fields.

#### 4. **`.exactOptional()`** - Strict Optional Properties
Makes a property key-optional but does not accept `undefined` as explicit value:

```typescript
const schema = z.object({
  a: z.string().optional(),      // accepts `undefined`
  b: z.string().exactOptional(), // does not accept `undefined`
});

schema.parse({});                  // ✅
schema.parse({ a: undefined });    // ✅
schema.parse({ b: undefined });    // ❌
```

**Use case**: TypeScript `exactOptionalPropertyTypes` compliance.

### Method Enhancements

#### 5. **`.apply()`** - Schema Composition
Apply arbitrary transformations for cleaner schema composition:

```typescript
const setCommonChecks = <T extends z.ZodNumber>(schema: T) => {
  return schema.min(0).max(100);
};

const schema = z.number().apply(setCommonChecks).nullable();
```

**Use case**: Reusable validation patterns across schemas.

#### 6. **`.with()`** - Readable Alias for `.check()`
More semantic than `.check()` for composing validations:

```typescript
z.string().with(
  z.minLength(5),
  z.toLowerCase()
);
```

**Use case**: Clearer intent when chaining multiple checks.

#### 7. **Type Predicates on `.refine()`**
Narrow output types with type predicates:

```typescript
const schema = z.string().refine((s): s is "a" => s === "a");

type Input = z.input<typeof schema>;   // string
type Output = z.output<typeof schema>; // "a"
```

**Use case**: Type-safe refinements that narrow the output type.

#### 8. **`z.slugify()`** - URL-Friendly Slugs
Transform strings into URL-friendly slugs:

```typescript
z.string().slugify().parse("Hello World"); // "hello-world"

// Or with .with()
z.string().with(z.slugify()).parse("Hello World"); // "hello-world"
```

**Use case**: Generating URL slugs from titles/names.

### Bug Fixes (Breaking Changes)

⚠️ **Important**: These are soundness fixes that may break code relying on unsound behavior:

#### 1. **`.pick()` and `.omit()` Disallowed on Schemas with Refinements**
```typescript
const schema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword);

schema.pick({ password: true });
// 4.2: refinement silently dropped ⚠️
// 4.3: throws error ❌
```

**Migration**:
```typescript
const newSchema = z.object(schema.shape).pick({ ... })
```

#### 2. **Stricter `.extend()` on Schemas with Refinements**
Use `.safeExtend()` to preserve refinements:
```typescript
const schema = z.object({ a: z.string() }).refine(/* ... */);

schema.safeExtend({ 
  a: z.string().min(5).max(10) 
}); // ✅ allows overwrite, preserves refinement
```

#### 3. **Stricter Object Masking Methods**
```typescript
const schema = z.object({ a: z.string() });
schema.pick({ nonexistent: true });
// 4.3: throws error for unrecognized keys ❌
```

### Additional Features

- **ZodMap Methods**: `.min()`, `.max()`, `.nonempty()`, `.size()` now available
- **Brand Cardinality**: Control whether brand applies to input, output, or both
- **More Ergonomic Intersections**: Keys recognized by either side pass validation
- **New Locales**: Armenian (`am`), Uzbek (`uz`)

---

## MCP SDK 1.25.3

The MCP SDK update brings stability improvements and bug fixes. The project is already using modern patterns (v1.23.0+):

- ✅ Using `registerTool()` instead of deprecated `tool()`
- ✅ Using `ResourceTemplate` for parameterized URIs
- ✅ Providing both `name` and `title` in registrations
- ✅ Using `isError: true` for tool failures

**No code changes required** - the project is already following v1.x best practices.

---

## MCP SDK v2 (Pre-Alpha)

⚠️ **Note**: MCP SDK v2 is in active development (expected stable Q1 2026). Key changes:

### Package Split
v2 splits into separate packages:
- `@modelcontextprotocol/server` - build MCP servers
- `@modelcontextprotocol/client` - build MCP clients
- Optional middleware packages (Express, Hono, Node.js HTTP)

### Migration Timeline
- **Now (v1.25.3)**: Continue using the unified `@modelcontextprotocol/sdk`
- **Q1 2026**: v2 stable release
- **Post-v2**: v1.x receives 6 months of bug fixes/security updates

### Preparation
The current boilerplate structure is compatible with v2 patterns. When v2 is stable:

1. Update imports:
   ```typescript
   // v1
   import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   
   // v2
   import { McpServer } from '@modelcontextprotocol/server';
   ```

2. Update peer dependencies:
   ```json
   {
     "peerDependencies": {
       "@modelcontextprotocol/server": "^2.0.0",
       "zod": "^4.3.0"
     }
   }
   ```

3. Consider middleware packages if using Express:
   ```bash
   npm install @modelcontextprotocol/express
   ```

---

## Recommendations for New Features

While the boilerplate maintains backward compatibility, consider these enhancements:

### 1. Add JSON Schema Conversion Tool
```typescript
// src/tools/jsonschema.tool.ts
import { z } from 'zod';

// Convert JSON Schema API specs to Zod for validation
const apiSchema = z.fromJSONSchema({
  // Your JSON Schema here
});
```

### 2. Use `.with()` for Clearer Validation Chains
```typescript
// Current pattern is fine, but consider .with() for new features:
const schema = z.string().with(
  z.minLength(5),
  z.slugify()
);
```

### 3. Add `.exactOptional()` for Strict TypeScript Projects
Projects using `exactOptionalPropertyTypes` can benefit:
```typescript
const schema = z.object({
  requiredField: z.string(),
  optionalField: z.string().exactOptional(),
});
```

### 4. Consider `z.xor()` for Exclusive Validation
For tools requiring exactly one authentication method:
```typescript
const authSchema = z.xor([
  z.object({ apiKey: z.string() }),
  z.object({ token: z.string() }),
]);
```

---

## Testing Verification

After modernization, verify:

1. ✅ Build succeeds: `npm run build`
2. ✅ Tests pass: `npm test`
3. ✅ CLI works: `npm run cli -- get-ip-details 8.8.8.8`
4. ✅ STDIO transport: `npm run mcp:stdio`
5. ✅ HTTP transport: `npm run mcp:http`
6. ✅ MCP Inspector: `npm run mcp:inspect`

---

## Breaking Changes

**None** - This is a drop-in update. All existing functionality preserved.

The Zod 4.3 breaking changes only affect:
- Using `.pick()`/`.omit()` on schemas with refinements
- Using `.extend()` to overwrite properties on schemas with refinements
- Using `.pick()`/`.omit()` with non-existent keys

The boilerplate doesn't use these patterns, so no changes needed.

---

## Security Notes

The npm audit shows 11 vulnerabilities in dev dependencies (semantic-release packages). These affect:
- **Development/CI only** - Not production code
- **Automated release tooling** - Not runtime functionality

**Action**: Consider updating semantic-release to v2x when stable, or accept the risk as it's dev-only.

---

## Next Steps

1. Monitor MCP SDK v2 progress: https://github.com/modelcontextprotocol/typescript-sdk
2. Consider adopting new Zod 4.3 features in new tools
3. Plan for MCP SDK v2 migration when stable (Q1 2026)
4. Update documentation examples to showcase new capabilities

---

## References

- [MCP SDK Releases](https://github.com/modelcontextprotocol/typescript-sdk/releases)
- [MCP SDK v2 Branch](https://github.com/modelcontextprotocol/typescript-sdk/tree/main)
- [Zod 4.3 Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.3.0)
- [Zod Documentation](https://zod.dev/)

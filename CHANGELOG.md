# [3.1.0](https://github.com/aashari/boilerplate-mcp-server/compare/v3.0.0...v3.1.0) (2026-02-17)


### Features

* modernize HTTP transport and standardize MCP tool contracts ([615b373](https://github.com/aashari/boilerplate-mcp-server/commit/615b3732c10ad2c607a899de0f6632221b6f7bc3))

# [3.0.0](https://github.com/aashari/boilerplate-mcp-server/compare/v2.0.0...v3.0.0) (2026-02-04)


### Features

* migrate to OIDC trusted publishing for npm (long-term solution) ([b7c36e3](https://github.com/aashari/boilerplate-mcp-server/commit/b7c36e31688e68a38cfd21977c938dc48d1bb380))


### BREAKING CHANGES

* Requires one-time OIDC configuration on npmjs.com
See docs/OIDC-TRUSTED-PUBLISHING-SETUP.md for complete migration guide

# [2.0.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.17.0...v2.0.0) (2026-02-04)


### Bug Fixes

* disable npm publishing in semantic-release ([7bef842](https://github.com/aashari/boilerplate-mcp-server/commit/7bef84256a953919a711a1ee132be3b2397d8aa4))


### Features

* add security hardening, prompts support, and ResourceLink pattern ([02a89c2](https://github.com/aashari/boilerplate-mcp-server/commit/02a89c2aa55db3ce52fbcb5ccb693b833f1e5e9d))


### BREAKING CHANGES

* none
Security: DNS rebinding protection, localhost binding
Testing: 47 unit tests + 15 integration tests passing (100%)

# [1.19.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.18.0...v1.19.0) (2026-02-04)

### Security 🔒

* **security:** implement DNS rebinding protection with Origin header validation ([src/index.ts](src/index.ts))
  - Validates Origin header on all HTTP requests
  - Prevents malicious websites from accessing localhost MCP server
  - Allows localhost/127.0.0.1 origins only
  - Returns 403 Forbidden for invalid origins

* **security:** add explicit localhost-only binding ([src/index.ts](src/index.ts))
  - Server explicitly binds to 127.0.0.1 (not 0.0.0.0)
  - Prevents network exposure and remote attacks
  - Ensures server only accepts local connections

* **security:** add comprehensive security documentation ([SECURITY.md](SECURITY.md))
  - Complete threat model and mitigation strategies
  - Authentication implementation guides (Bearer, API Key, OAuth, mTLS)
  - Security checklists for dev/staging/production
  - Best practices for input validation, rate limiting, logging

* **security:** publish security audit report ([docs/AUDIT-2025-01-13.md](docs/AUDIT-2025-01-13.md))
  - Independent audit against MCP best practices
  - 70% compliance rating with clear improvement roadmap
  - All critical security gaps addressed in this release

### Features ✨

* **mcp:** add `isError: true` field to tool error responses ([src/utils/error.util.ts](src/utils/error.util.ts))
  - Follows MCP best practices for error signaling
  - Enables clients to reliably detect error states
  - Maintains backward compatibility with metadata

* **mcp:** add ResourceLink pattern example ([src/tools/ipaddress-link.tool.ts](src/tools/ipaddress-link.tool.ts))
  - New `ip_get_details_link` tool demonstrates ResourceLink pattern
  - Returns resource references instead of inline content
  - Reduces token usage for large responses
  - Shows pattern for cacheable, reusable data

* **mcp:** add prompt registration support ([src/prompts/analysis.prompt.ts](src/prompts/analysis.prompt.ts))
  - New `ip-analysis` prompt generates structured IP analysis requests
  - Supports multiple focus modes (security, geolocation, network, comprehensive)
  - Demonstrates all three MCP primitives (tools, resources, prompts)
  - Provides template for AI-driven analysis workflows

* **architecture:** add prompts layer to 7-layer architecture
  - Clean separation of prompt templates from tools/resources
  - Type-safe prompt argument schemas with Zod
  - Registered in index.ts alongside tools and resources

### Documentation 📖

* **readme:** update README with security section and new features
  - Add security badges and protection summary
  - Document ResourceLink pattern and prompt examples
  - Update architecture overview to 7 layers
  - Add references to SECURITY.md and audit report

* **docs:** update project structure in README
  - Add prompts/ directory
  - Add ipaddress-link.tool.ts
  - Update layer descriptions

### Testing ✅

All tests passing after security and feature additions:
- ✅ 6 test suites, 47 tests passed
- ✅ Build successful with TypeScript compilation
- ✅ DNS rebinding protection tested
- ✅ Localhost binding verified
- ✅ New tools and prompts functional

### Breaking Changes

**None** - All changes are backward compatible additions.

---

# [1.18.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.17.0...v1.18.0) (2026-02-04)

### Features

* **deps:** modernize all dependencies to latest stable versions ([#TBD](https://github.com/aashari/boilerplate-mcp-server/issues/TBD))
  - Update MCP SDK from 1.23.0 to 1.25.3 (stability improvements)
  - Update Zod from 4.1.13 to 4.3.6 (major feature release)
  - Update @toon-format/toon from 2.0.1 to 2.1.0
  - Update Express from 5.1.0 to 5.2.1
  - Update Commander from 14.0.2 to 14.0.3
  - Update CORS from 2.8.5 to 2.8.6
  - Update @types/node from 24.10.1 to 24.10.10

### Documentation

* **modernization:** add comprehensive modernization guide ([MODERNIZATION.md](MODERNIZATION.md))
  - Document new Zod 4.3 features (z.fromJSONSchema, z.xor, z.looseRecord, .exactOptional)
  - Add MCP SDK v2 preparation guide
  - Include migration timeline and recommendations
  - Provide code examples for new features

* **readme:** update README with latest versions and v2 preparation notes

### Zod 4.3 New Features Available

While maintaining backward compatibility, the following new Zod features are now available:

- `z.fromJSONSchema()` - Convert JSON Schema to Zod schemas
- `z.xor()` - Exclusive union validation (exactly one must match)
- `z.looseRecord()` - Partial record validation
- `.exactOptional()` - Strict optional properties
- `.apply()` - Schema composition helper
- `.with()` - Readable alias for `.check()`
- Type predicates on `.refine()`
- `z.slugify()` - URL-friendly slug transformation

### MCP SDK v2 Preparation

- Confirmed compatibility with v2 patterns (no code changes needed)
- Added v2 migration guide and timeline
- Project already uses modern v1.x APIs (registerTool, ResourceTemplate, etc.)

### Testing

All tests pass with updated dependencies:
- ✅ 6 test suites, 47 tests passed
- ✅ CLI functionality verified
- ✅ HTTPS to HTTP fallback working correctly

### Breaking Changes

**None** - This is a drop-in update maintaining full backward compatibility.

# [1.17.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.16.1...v1.17.0) (2025-12-03)


### Bug Fixes

* regenerate package-lock.json to sync with package.json ([aeb3d63](https://github.com/aashari/boilerplate-mcp-server/commit/aeb3d63234a2deaa1257f17a3db6a6538d5345b1))


### Features

* add raw response logging with truncation for large API responses ([3ed7b19](https://github.com/aashari/boilerplate-mcp-server/commit/3ed7b191fc51ff2562f9f5ad2d6dc46ff0a22714))

## [1.16.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.16.0...v1.16.1) (2025-12-01)


### Bug Fixes

* **deps:** resolve security vulnerabilities in body-parser and js-yaml ([abd1c08](https://github.com/aashari/boilerplate-mcp-server/commit/abd1c08d9c777ffb04dc851c3c14eeb8a4a09e1c))

# [1.16.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.15.0...v1.16.0) (2025-12-01)


### Bug Fixes

* regenerate package-lock.json to fix CI dependency resolution ([a0225a8](https://github.com/aashari/boilerplate-mcp-server/commit/a0225a8f9bb0bb5b27a436099d0b131fa47e8cbc))


### Features

* modernize SDK usage and update dependencies ([#127](https://github.com/aashari/boilerplate-mcp-server/issues/127)) ([a36c9f6](https://github.com/aashari/boilerplate-mcp-server/commit/a36c9f644d842e9c5360d4ed2f207ada18d97ebd))

# [1.15.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.14.0...v1.15.0) (2025-12-01)


### Bug Fixes

* update tests for TOON output format ([6054be3](https://github.com/aashari/boilerplate-mcp-server/commit/6054be313fd54c6678b39da214c13e17b04ec4a6))


### Features

* add TOON output format with JMESPath filtering support ([#126](https://github.com/aashari/boilerplate-mcp-server/issues/126)) ([2b3d8d8](https://github.com/aashari/boilerplate-mcp-server/commit/2b3d8d8a6811a1296475b6971d840b9392ceff08))

# [1.14.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.13.5...v1.14.0) (2025-09-09)


### Features

* modernize dependencies and enhance testing infrastructure ([#67](https://github.com/aashari/boilerplate-mcp-server/issues/67)) ([a74f114](https://github.com/aashari/boilerplate-mcp-server/commit/a74f1145b7e80615a9a0c907b9d19eb5e4fbd2e8))

## [1.13.5](https://github.com/aashari/boilerplate-mcp-server/compare/v1.13.4...v1.13.5) (2025-08-02)


### Bug Fixes

* allow Gemini to run even if build fails to catch PR issues ([c7b31b3](https://github.com/aashari/boilerplate-mcp-server/commit/c7b31b33674b4ef458d6d201aa22673f13a5247a))

## [1.13.4](https://github.com/aashari/boilerplate-mcp-server/compare/v1.13.3...v1.13.4) (2025-08-02)


### Bug Fixes

* remove debug logging from Gemini workflow ([6f176fe](https://github.com/aashari/boilerplate-mcp-server/commit/6f176feef9a047d3a1fda99983cf1fafb01e93ad))

## [1.13.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.13.2...v1.13.3) (2025-08-02)


### Bug Fixes

* add GEMINI_API_KEY to Execute Gemini CLI step env ([b4a7959](https://github.com/aashari/boilerplate-mcp-server/commit/b4a7959fa7dba467d77d9576c9d4cdb729620ac4))

## [1.13.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.13.1...v1.13.2) (2025-08-02)


### Bug Fixes

* debug GEMINI_API_KEY availability in workflow ([20581bd](https://github.com/aashari/boilerplate-mcp-server/commit/20581bdde13d0b8306c665c2619f5f6dccccfb5a))

## [1.13.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.13.0...v1.13.1) (2025-08-02)


### Bug Fixes

* pass GEMINI_API_KEY to gemini CLI command ([a9dd9d7](https://github.com/aashari/boilerplate-mcp-server/commit/a9dd9d7300e6a9171e52dd11eba551c60ec95c04))

# [1.13.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.12.0...v1.13.0) (2025-08-02)


### Bug Fixes

* apply prettier formatting to index.ts ([b416d81](https://github.com/aashari/boilerplate-mcp-server/commit/b416d81f62e307371615b382aa997d52cd8903b8))


### Features

* implement Gemini CLI autonomous MCP engineer ([cb632bd](https://github.com/aashari/boilerplate-mcp-server/commit/cb632bd8be5ce84425743da6250c4b45816c76be))

# [1.12.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.11.4...v1.12.0) (2025-08-02)


### Features

* add startup logging with package name and version ([cb09d0f](https://github.com/aashari/boilerplate-mcp-server/commit/cb09d0f1fa7ffc252f7c4370553f448e7fbfc44e))

## [1.11.4](https://github.com/aashari/boilerplate-mcp-server/compare/v1.11.3...v1.11.4) (2025-08-02)


### Bug Fixes

* revert zod to v3.25.67 for consistency across MCP projects ([6d6ed1c](https://github.com/aashari/boilerplate-mcp-server/commit/6d6ed1ccdac15eb8595fffd4eb14162a998e183c))

## [1.11.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.11.2...v1.11.3) (2025-08-02)


### Bug Fixes

* resolve TypeScript compilation errors and improve compatibility ([873c3f6](https://github.com/aashari/boilerplate-mcp-server/commit/873c3f63c4ec384ffa13adf94b54f6b6bb4fdbdc))
* resolve TypeScript/ESLint version conflict and linting issues ([fa0486a](https://github.com/aashari/boilerplate-mcp-server/commit/fa0486adb67fa449fa038937fb56521f877d4ad4))

## [1.11.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.11.1...v1.11.2) (2025-06-22)


### Bug Fixes

* change default transport from HTTP to STDIO for proper MCP client integration ([05027b8](https://github.com/aashari/boilerplate-mcp-server/commit/05027b8320ea52926527b030a085fc2f754149eb))

## [1.11.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.11.0...v1.11.1) (2025-06-22)


### Bug Fixes

* update dependencies ([fcd9de0](https://github.com/aashari/boilerplate-mcp-server/commit/fcd9de082f648db2bb6e74a04e91c0595f1bb28a))

# [1.11.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.10.5...v1.11.0) (2025-06-22)


### Features

* add Streamable HTTP transport support alongside STDIO ([aa04e01](https://github.com/aashari/boilerplate-mcp-server/commit/aa04e011b2f80ced3de024050e36ef09d3ed7b18))

## [1.10.5](https://github.com/aashari/boilerplate-mcp-server/compare/v1.10.4...v1.10.5) (2025-06-02)


### Bug Fixes

* replace Unix-specific chmod with cross-platform ensure-executable script ([6733798](https://github.com/aashari/boilerplate-mcp-server/commit/6733798669eead4766627193d5ef9f1f0cf1582a))

## [1.10.4](https://github.com/aashari/boilerplate-mcp-server/compare/v1.10.3...v1.10.4) (2025-06-02)


### Bug Fixes

* update dependencies ([374094d](https://github.com/aashari/boilerplate-mcp-server/commit/374094d252c5fe008ac09421b303cdc08837872e))

## [1.10.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.10.2...v1.10.3) (2025-05-21)


### Bug Fixes

* Refactor IP address controller to accept args as a single object ([acb7ea2](https://github.com/aashari/boilerplate-mcp-server/commit/acb7ea2a148e9673a4bf2aa703f8ca988dc05c93))
* update dependencies ([02c42fa](https://github.com/aashari/boilerplate-mcp-server/commit/02c42fa6ef66be461444d1780b013860b455cbff))

## [1.10.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.10.1...v1.10.2) (2025-05-21)


### Bug Fixes

* update dependencies ([1340085](https://github.com/aashari/boilerplate-mcp-server/commit/1340085d8476f92e72e7afe248a86f50e0b4ff84))

## [1.10.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.10.0...v1.10.1) (2025-05-20)


### Bug Fixes

* update dependencies ([88fa27c](https://github.com/aashari/boilerplate-mcp-server/commit/88fa27c0e67d97a83d780f0aa99255979e139bb7))

# [1.10.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.9.0...v1.10.0) (2025-05-19)


### Features

* update dependencies ([3f61427](https://github.com/aashari/boilerplate-mcp-server/commit/3f614270f136e03548d05a4d2dfff24769798ff6))

# [1.9.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.8.0...v1.9.0) (2025-05-18)


### Features

* refactor services to use live API tests and remove timeout parameter ([3c483b4](https://github.com/aashari/boilerplate-mcp-server/commit/3c483b4379dfcdf47d29cd94903265393b831187))

# [1.8.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.7.0...v1.8.0) (2025-05-18)


### Features

* refactor ControllerResponse to only include content field ([68118c7](https://github.com/aashari/boilerplate-mcp-server/commit/68118c75e4fcbe759140807a8d65e583e85b9535))

# [1.7.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.6.0...v1.7.0) (2025-05-17)


### Features

* improve ip_get_details tool description and CLI usability with short options ([895feeb](https://github.com/aashari/boilerplate-mcp-server/commit/895feeb7ef23252ba32023cde658feaa9fd382d8))

# [1.6.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.10...v1.6.0) (2025-05-15)


### Features

* enhanced error handling across the application ([75aa905](https://github.com/aashari/boilerplate-mcp-server/commit/75aa90528e615d1c1a9a411ddd1bf1931edfde61))

## [1.5.10](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.9...v1.5.10) (2025-05-14)


### Bug Fixes

* remove Dockerfile and smithery.yaml ([582e9f9](https://github.com/aashari/boilerplate-mcp-server/commit/582e9f9e66087fd2211d6fcf1aaa79c9ee54a123))

## [1.5.9](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.8...v1.5.9) (2025-05-13)


### Bug Fixes

* update dependencies ([e211b19](https://github.com/aashari/boilerplate-mcp-server/commit/e211b19e18ae40123d0f609aaac854f4fb325800))

## [1.5.8](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.7...v1.5.8) (2025-05-07)


### Performance Improvements

* Update dependencies ([ee33a4c](https://github.com/aashari/boilerplate-mcp-server/commit/ee33a4cc170750594cb0c9417898a29030029943))

## [1.5.7](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.6...v1.5.7) (2025-05-06)


### Performance Improvements

* Update dependencies ([469a400](https://github.com/aashari/boilerplate-mcp-server/commit/469a4002b7af8f6f3750b55e2b076d8ef7a2ab6e))

## [1.5.6](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.5...v1.5.6) (2025-05-06)


### Performance Improvements

* Update dependencies ([585fe31](https://github.com/aashari/boilerplate-mcp-server/commit/585fe31c667c51b93f2f11a50a4b438815603f1a))

## [1.5.5](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.4...v1.5.5) (2025-05-06)


### Bug Fixes

* Revert back the index.ts and package.json ([74c6e08](https://github.com/aashari/boilerplate-mcp-server/commit/74c6e08c058d09f6e885134197cbf90d47e0ccc7))

## [1.5.4](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.3...v1.5.4) (2025-05-05)


### Bug Fixes

* improve signal handling for npx support ([72634a8](https://github.com/aashari/boilerplate-mcp-server/commit/72634a85fea332e4551dd273d29df8217f24309d))

## [1.5.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.2...v1.5.3) (2025-05-05)


### Bug Fixes

* standardize index.ts entrypoint logic and package bin ([7f9aaf0](https://github.com/aashari/boilerplate-mcp-server/commit/7f9aaf051cf3d4d92971892e21e32e23820be90b))


### Reverts

* Revert "fix(test): Skip invalid IP test assertion on CI due to rate limits" ([be8c766](https://github.com/aashari/boilerplate-mcp-server/commit/be8c766d738c82d8e228b14da70f2ae844ad49e6))

## [1.5.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.1...v1.5.2) (2025-05-05)


### Bug Fixes

* Manually set version to 1.6.1 to resolve release conflict ([a96c37b](https://github.com/aashari/boilerplate-mcp-server/commit/a96c37b4ee599b1847237cba5bb8947265c563fa))
* **test:** Skip invalid IP test assertion on CI due to rate limits ([258d2e7](https://github.com/aashari/boilerplate-mcp-server/commit/258d2e79d4f426f4264abfae3c3a65c61dbc1a06))


### Reverts

* Revert "Revert "chore: Manually set version to 1.6.0 to resolve release conflict"" ([e4d071e](https://github.com/aashari/boilerplate-mcp-server/commit/e4d071ea51f1db934298085cdfb53125c5c28915))

## [1.5.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.0...v1.5.1) (2025-05-05)


### Bug Fixes

* Add comment to force version bump ([0a24ecd](https://github.com/aashari/boilerplate-mcp-server/commit/0a24ecdbbbda914a24188b6665d6c15d4c026245))
* Improve cross-platform compatibility for npx execution ([d840c51](https://github.com/aashari/boilerplate-mcp-server/commit/d840c51cc94ad3d54e5c38670b774cdb7d52b8a7))
* Log package name and version on startup ([b4534db](https://github.com/aashari/boilerplate-mcp-server/commit/b4534db227ba0e3dd7cc6b82207457b98c7030d0))


### Performance Improvements

* Update dependencies ([cbc63fe](https://github.com/aashari/boilerplate-mcp-server/commit/cbc63fe692f563a3e1b68bb136b8f567408fbf9c))

## [1.5.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.0...v1.5.1) (2025-05-05)


### Bug Fixes

* Add comment to force version bump ([0a24ecd](https://github.com/aashari/boilerplate-mcp-server/commit/0a24ecdbbbda914a24188b6665d6c15d4c026245))
* Improve cross-platform compatibility for npx execution ([d840c51](https://github.com/aashari/boilerplate-mcp-server/commit/d840c51cc94ad3d54e5c38670b774cdb7d52b8a7))
* Log package name and version on startup ([b4534db](https://github.com/aashari/boilerplate-mcp-server/commit/b4534db227ba0e3dd7cc6b82207457b98c7030d0))


### Performance Improvements

* Update dependencies ([cbc63fe](https://github.com/aashari/boilerplate-mcp-server/commit/cbc63fe692f563a3e1b68bb136b8f567408fbf9c))

## [1.5.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.0...v1.5.1) (2025-05-05)


### Bug Fixes

* Add comment to force version bump ([0a24ecd](https://github.com/aashari/boilerplate-mcp-server/commit/0a24ecdbbbda914a24188b6665d6c15d4c026245))
* Improve cross-platform compatibility for npx execution ([d840c51](https://github.com/aashari/boilerplate-mcp-server/commit/d840c51cc94ad3d54e5c38670b774cdb7d52b8a7))
* Log package name and version on startup ([b4534db](https://github.com/aashari/boilerplate-mcp-server/commit/b4534db227ba0e3dd7cc6b82207457b98c7030d0))


### Performance Improvements

* Update dependencies ([cbc63fe](https://github.com/aashari/boilerplate-mcp-server/commit/cbc63fe692f563a3e1b68bb136b8f567408fbf9c))

## [1.5.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.5.0...v1.5.1) (2025-05-05)


### Bug Fixes

* Improve cross-platform compatibility for npx execution ([d840c51](https://github.com/aashari/boilerplate-mcp-server/commit/d840c51cc94ad3d54e5c38670b774cdb7d52b8a7))
* Log package name and version on startup ([b4534db](https://github.com/aashari/boilerplate-mcp-server/commit/b4534db227ba0e3dd7cc6b82207457b98c7030d0))


### Performance Improvements

* Update dependencies ([cbc63fe](https://github.com/aashari/boilerplate-mcp-server/commit/cbc63fe692f563a3e1b68bb136b8f567408fbf9c))

# [1.5.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.9...v1.5.0) (2025-05-05)


### Features

* **boilerplate:** add standard pagination utils and formatPagination ([cb1e004](https://github.com/aashari/boilerplate-mcp-server/commit/cb1e004fcb33eef61605983b74cf8a373018830b))

## [1.4.9](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.8...v1.4.9) (2025-05-04)


### Performance Improvements

* Update dependencies ([d5653b8](https://github.com/aashari/boilerplate-mcp-server/commit/d5653b8e31581e3bffe9d5b1d891afd58dee6f3b))

## [1.4.8](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.7...v1.4.8) (2025-05-04)


### Bug Fixes

* Refactor types using Zod and restore resources ([4965bd2](https://github.com/aashari/boilerplate-mcp-server/commit/4965bd2d4c301baf6a5c10b40893f7028b849a7e))

## [1.4.7](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.6...v1.4.7) (2025-05-04)


### Bug Fixes

* Remove unused exports identified by ts-prune ([c9fdc7d](https://github.com/aashari/boilerplate-mcp-server/commit/c9fdc7d8cb58cd79d83346655d9f8cf29a10fc27))

## [1.4.6](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.5...v1.4.6) (2025-05-02)


### Bug Fixes

* trigger release ([9abd0cc](https://github.com/aashari/boilerplate-mcp-server/commit/9abd0cc8fb28f9d8c430edb76833db2b4c825b3f))

## [1.4.5](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.4...v1.4.5) (2025-05-02)


### Bug Fixes

* Remove re-exports from index.ts ([5175dcf](https://github.com/aashari/boilerplate-mcp-server/commit/5175dcfa2870bc5971a3d28da237aafb640b3b31))

## [1.4.4](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.3...v1.4.4) (2025-05-02)


### Performance Improvements

* Update dependencies ([b35601d](https://github.com/aashari/boilerplate-mcp-server/commit/b35601d40e70384fb0c1743a09831a7e1ea704e5))

## [1.4.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.2...v1.4.3) (2025-05-01)


### Bug Fixes

* Align CLI options and descriptions with style guide ([0f5f490](https://github.com/aashari/boilerplate-mcp-server/commit/0f5f4901f69ea80d03688b289b0cd59599957740))
* align README tool example with concise description style ([b8126a4](https://github.com/aashari/boilerplate-mcp-server/commit/b8126a4b4f8286cfefeb9c50f53aaea7e9f90982))

## [1.4.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.1...v1.4.2) (2025-05-01)


### Bug Fixes

* align ipaddress CLI descriptions with tool/schema ([1eeaeeb](https://github.com/aashari/boilerplate-mcp-server/commit/1eeaeeb8ee4bd425abe135cb4d2717278e7aa617))

## [1.4.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.4.0...v1.4.1) (2025-04-30)


### Performance Improvements

* Update dependencies ([b0c4046](https://github.com/aashari/boilerplate-mcp-server/commit/b0c4046f29d3ec31a1b9c40734c683065525bf56))

# [1.4.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.3.5...v1.4.0) (2025-04-30)


### Features

* Support multiple keys for global config lookup ([49c26f1](https://github.com/aashari/boilerplate-mcp-server/commit/49c26f16d6f8c1baa29097c213e6fcfc65f5c809))

## [1.3.5](https://github.com/aashari/boilerplate-mcp-server/compare/v1.3.4...v1.3.5) (2025-04-25)


### Bug Fixes

* rename IP tool to 'ip_get_details' for naming consistency ([fb2a5c6](https://github.com/aashari/boilerplate-mcp-server/commit/fb2a5c6df0766f608e5e06f6f13326a4821e6760))
* unify tool description for clarity and consistency ([006460b](https://github.com/aashari/boilerplate-mcp-server/commit/006460bacd1413b3254e45c6085b07f27a468898))

## [1.3.4](https://github.com/aashari/boilerplate-mcp-server/compare/v1.3.3...v1.3.4) (2025-04-22)


### Performance Improvements

* Update dependencies ([6f6ed3e](https://github.com/aashari/boilerplate-mcp-server/commit/6f6ed3ea73059594bda242910ca7d3b361d7e690))

## [1.3.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.3.2...v1.3.3) (2025-04-20)


### Bug Fixes

* Update dependencies and fix related type errors ([dfdec0a](https://github.com/aashari/boilerplate-mcp-server/commit/dfdec0a1e314b96fa76000058bc7d48efd2c9dee))

## [1.3.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.3.1...v1.3.2) (2025-04-09)


### Bug Fixes

* **deps:** update dependencies to latest versions ([97baabe](https://github.com/aashari/boilerplate-mcp-server/commit/97baabeb2477fe8ce5e815fa55d8873f44e3ca11))

## [1.3.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.3.0...v1.3.1) (2025-04-04)


### Bug Fixes

* update function references from register to registerTools and registerResources ([393cff2](https://github.com/aashari/boilerplate-mcp-server/commit/393cff298f7ddafb6a927b882d5731aa924df783))

# [1.3.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.2.2...v1.3.0) (2025-04-03)


### Features

* **logging:** add file logging with session ID to ~/.mcp/data/ ([0448918](https://github.com/aashari/boilerplate-mcp-server/commit/0448918908b6bd3d56cec94fdf768d2410973631))

## [1.2.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.2.1...v1.2.2) (2025-04-03)


### Bug Fixes

* **logging:** ensure consistent logger implementation across projects ([253323e](https://github.com/aashari/boilerplate-mcp-server/commit/253323e4d351a82ac3358140441c77b9d9b540bd))

## [1.2.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.2.0...v1.2.1) (2025-04-03)


### Bug Fixes

* **logger:** ensure consistent logger implementation across all projects ([ec37c74](https://github.com/aashari/boilerplate-mcp-server/commit/ec37c74ec75cc3eaf09042e51213c27145cf8f44))

# [1.2.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.1.3...v1.2.0) (2025-04-03)


### Features

* **boilerplate:** improve version handling and module exports ([faa1713](https://github.com/aashari/boilerplate-mcp-server/commit/faa17138ccb1b943197ae91b37a54527481ffbca))

## [1.1.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.1.2...v1.1.3) (2025-03-28)


### Bug Fixes

* correct TypeScript errors in transport utility ([573a7e6](https://github.com/aashari/boilerplate-mcp-server/commit/573a7e63e1985aa5aefd806c0902462fa34c14d7))

## [1.1.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.1.1...v1.1.2) (2025-03-28)


### Performance Improvements

* **ipaddress:** enhance formatter output and optimize service implementation ([f1ccdbf](https://github.com/aashari/boilerplate-mcp-server/commit/f1ccdbf58cb2518ca979363369904255e5de275b))

## [1.1.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.1.0...v1.1.1) (2025-03-27)


### Performance Improvements

* **core:** refactor code structure to align with Atlassian MCP patterns ([090fd56](https://github.com/aashari/boilerplate-mcp-server/commit/090fd5653ab62d70eb75c49828a9876f54cee6fc))
* **standards:** align codebase with Atlassian MCP server patterns ([8b8eb13](https://github.com/aashari/boilerplate-mcp-server/commit/8b8eb13fd4ce18158e83c4f8c7044ce06287f23e))
* **tests:** add CLI test infrastructure and ipaddress tests ([ccee308](https://github.com/aashari/boilerplate-mcp-server/commit/ccee308a86e076a67756e9113b481aa3848f40b7))
* **utils:** implement standardized core utilities and error handling ([6c14a2f](https://github.com/aashari/boilerplate-mcp-server/commit/6c14a2f83397f79cc39f0b7ec70b40e9d9755b9c))

# [1.1.0](https://github.com/aashari/boilerplate-mcp-server/compare/v1.0.3...v1.1.0) (2025-03-23)


### Features

* improve development workflow and update documentation ([4458957](https://github.com/aashari/boilerplate-mcp-server/commit/445895777be6287a624cb19b8cd8a12590a28c7b))

## [1.0.3](https://github.com/aashari/boilerplate-mcp-server/compare/v1.0.2...v1.0.3) (2025-03-23)


### Bug Fixes

* handle empty strings properly in greet function ([546d3a8](https://github.com/aashari/boilerplate-mcp-server/commit/546d3a84209e1065af46b2213053f589340158df))

## [1.0.2](https://github.com/aashari/boilerplate-mcp-server/compare/v1.0.1...v1.0.2) (2025-03-23)

### Bug Fixes

- improve error logging with IP address details ([121f516](https://github.com/aashari/boilerplate-mcp-server/commit/121f51655517ddbea7d25968372bd6476f1b3e0f))

## [1.0.1](https://github.com/aashari/boilerplate-mcp-server/compare/v1.0.0...v1.0.1) (2025-03-23)

### Bug Fixes

- ensure executable permissions for bin script ([395f1dc](https://github.com/aashari/boilerplate-mcp-server/commit/395f1dcb5f3b5efee99048d1b91e3b083e9e544f))

# 1.0.0 (2025-03-22)

### Bug Fixes

- add workflows permission to semantic-release workflow ([de3a335](https://github.com/aashari/boilerplate-mcp-server/commit/de3a33510bd447af353444db1fcb58e1b1aa02e4))
- improve GitHub Packages publishing with a more robust approach ([fd2aec9](https://github.com/aashari/boilerplate-mcp-server/commit/fd2aec9926cf99d301cbb2b5f5ca961a6b6fec7e))
- improve GitHub Packages publishing with better error handling and debugging ([db25f04](https://github.com/aashari/boilerplate-mcp-server/commit/db25f04925e884349fcf3ab85316550fde231d1f))
- improve GITHUB_OUTPUT syntax in semantic-release workflow ([6f154bc](https://github.com/aashari/boilerplate-mcp-server/commit/6f154bc43f42475857e9256b0a671c3263dc9708))
- improve version detection for global installations ([97a95dc](https://github.com/aashari/boilerplate-mcp-server/commit/97a95dca61d8cd7a86c81bde4cb38c509b810dc0))
- make publish workflow more resilient against version conflicts ([ffd3705](https://github.com/aashari/boilerplate-mcp-server/commit/ffd3705bc064ee9135402052a0dc7fe32645714b))
- remove invalid workflows permission ([c012e46](https://github.com/aashari/boilerplate-mcp-server/commit/c012e46a29070c8394f7ab596fe7ba68c037d3a3))
- remove type module to fix CommonJS compatibility ([8b1f00c](https://github.com/aashari/boilerplate-mcp-server/commit/8b1f00c37467bc676ad8ec9ab672ba393ed084a9))
- resolve linter errors in version detection code ([5f1f33e](https://github.com/aashari/boilerplate-mcp-server/commit/5f1f33e88ae843b7a0d708899713be36fcd2ec2e))
- update examples to use correct API (greet instead of sayHello) ([7c062ca](https://github.com/aashari/boilerplate-mcp-server/commit/7c062ca42765c659f018f990f4b1ec563d1172d3))
- update release workflow to ensure correct versioning in compiled files ([a365394](https://github.com/aashari/boilerplate-mcp-server/commit/a365394b8596defa33ff5a44583d52e2c43f0aa3))
- update version display in CLI ([2b7846c](https://github.com/aashari/boilerplate-mcp-server/commit/2b7846cbfa023f4b1a8c81ec511370fa8f5aaf33))

### Features

- add automated dependency management ([efa1b62](https://github.com/aashari/boilerplate-mcp-server/commit/efa1b6292e0e9b6efd0d43b40cf7099d50769487))
- add CLI usage examples for both JavaScript and TypeScript ([d5743b0](https://github.com/aashari/boilerplate-mcp-server/commit/d5743b07a6f2afe1c6cb0b03265228cba771e657))
- add support for custom name in greet command ([be48a05](https://github.com/aashari/boilerplate-mcp-server/commit/be48a053834a1d910877864608a5e9942d913367))
- add version update script and fix version display ([ec831d3](https://github.com/aashari/boilerplate-mcp-server/commit/ec831d3a3c966d858c15972365007f9dfd6115b8))
- implement review recommendations ([a23cbc0](https://github.com/aashari/boilerplate-mcp-server/commit/a23cbc0608a07e202396b3cd496c1f2078e304c1))
- implement testing, linting, and semantic versioning ([1d7710d](https://github.com/aashari/boilerplate-mcp-server/commit/1d7710dfa11fd1cb04ba3c604e9a2eb785652394))
- improve CI workflows with standardized Node.js version, caching, and dual publishing ([0dc9470](https://github.com/aashari/boilerplate-mcp-server/commit/0dc94705c81067d7ff63ab978ef9e6a6e3f75784))
- improve package structure and add better examples ([bd66891](https://github.com/aashari/boilerplate-mcp-server/commit/bd668915bde84445161cdbd55ff9da0b0af51944))

### Reverts

- restore simple version handling ([bd0fadf](https://github.com/aashari/boilerplate-mcp-server/commit/bd0fadfa8207b4a7cf472c3b9f4ee63d8e36189d))

# [1.8.0](https://github.com/aashari/boilerplate-npm-package/compare/v1.7.2...v1.8.0) (2025-03-22)

### Features

- add CLI usage examples for both JavaScript and TypeScript ([d5743b0](https://github.com/aashari/boilerplate-npm-package/commit/d5743b07a6f2afe1c6cb0b03265228cba771e657))

## [1.7.2](https://github.com/aashari/boilerplate-npm-package/compare/v1.7.1...v1.7.2) (2025-03-22)

### Bug Fixes

- update release workflow to ensure correct versioning in compiled files ([a365394](https://github.com/aashari/boilerplate-npm-package/commit/a365394b8596defa33ff5a44583d52e2c43f0aa3))

## [1.7.1](https://github.com/aashari/boilerplate-npm-package/compare/v1.7.0...v1.7.1) (2025-03-22)

### Bug Fixes

- update examples to use correct API (greet instead of sayHello) ([7c062ca](https://github.com/aashari/boilerplate-npm-package/commit/7c062ca42765c659f018f990f4b1ec563d1172d3))

# [1.7.0](https://github.com/aashari/boilerplate-npm-package/compare/v1.6.1...v1.7.0) (2025-03-22)

### Features

- improve package structure and add better examples ([bd66891](https://github.com/aashari/boilerplate-npm-package/commit/bd668915bde84445161cdbd55ff9da0b0af51944))

## [1.6.1](https://github.com/aashari/boilerplate-npm-package/compare/v1.6.0...v1.6.1) (2025-03-22)

### Bug Fixes

- improve GitHub Packages publishing with better error handling and debugging ([db25f04](https://github.com/aashari/boilerplate-npm-package/commit/db25f04925e884349fcf3ab85316550fde231d1f))

# [1.6.0](https://github.com/aashari/boilerplate-npm-package/compare/v1.5.2...v1.6.0) (2025-03-22)

### Features

- add support for custom name in greet command ([be48a05](https://github.com/aashari/boilerplate-npm-package/commit/be48a053834a1d910877864608a5e9942d913367))

## [1.5.2](https://github.com/aashari/boilerplate-npm-package/compare/v1.5.1...v1.5.2) (2025-03-22)

### Bug Fixes

- add workflows permission to semantic-release workflow ([de3a335](https://github.com/aashari/boilerplate-npm-package/commit/de3a33510bd447af353444db1fcb58e1b1aa02e4))
- improve GITHUB_OUTPUT syntax in semantic-release workflow ([6f154bc](https://github.com/aashari/boilerplate-npm-package/commit/6f154bc43f42475857e9256b0a671c3263dc9708))
- make publish workflow more resilient against version conflicts ([ffd3705](https://github.com/aashari/boilerplate-npm-package/commit/ffd3705bc064ee9135402052a0dc7fe32645714b))
- remove invalid workflows permission ([c012e46](https://github.com/aashari/boilerplate-npm-package/commit/c012e46a29070c8394f7ab596fe7ba68c037d3a3))

## [1.5.2](https://github.com/aashari/boilerplate-npm-package/compare/v1.5.1...v1.5.2) (2025-03-22)

### Bug Fixes

- make publish workflow more resilient against version conflicts ([ffd3705](https://github.com/aashari/boilerplate-npm-package/commit/ffd3705bc064ee9135402052a0dc7fe32645714b))

## [1.5.1](https://github.com/aashari/boilerplate-npm-package/compare/v1.5.0...v1.5.1) (2025-03-22)

### Bug Fixes

- improve GitHub Packages publishing with a more robust approach ([fd2aec9](https://github.com/aashari/boilerplate-npm-package/commit/fd2aec9926cf99d301cbb2b5f5ca961a6b6fec7e))

# [1.5.0](https://github.com/aashari/boilerplate-npm-package/compare/v1.4.7...v1.5.0) (2025-03-22)

### Features

- improve CI workflows with standardized Node.js version, caching, and dual publishing ([0dc9470](https://github.com/aashari/boilerplate-npm-package/commit/0dc94705c81067d7ff63ab978ef9e6a6e3f75784))

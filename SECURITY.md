# Security Documentation

## Overview

This document outlines the security measures implemented in boilerplate-mcp-server and provides guidance for secure deployment.

---

## Implemented Security Measures

### 1. DNS Rebinding Protection ✅

**Implementation:** Origin header validation middleware ([src/index.ts](src/index.ts))

```typescript
// Validates Origin header on all HTTP requests
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow requests without Origin (direct API calls)
    if (!origin) {
        return next();
    }
    
    // Validate Origin matches localhost patterns
    const allowedOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        'https://localhost',
        'https://127.0.0.1',
    ];
    
    const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || origin.startsWith(`${allowed}:`)
    );
    
    if (!isAllowed) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    
    next();
});
```

**What it prevents:**
- DNS rebinding attacks where malicious websites attempt to make requests to your localhost MCP server
- Cross-origin requests from untrusted domains
- Remote exploitation via browser-based attacks

**Configuration:**
To allow additional origins (e.g., development environments), modify the `allowedOrigins` array in [src/index.ts](src/index.ts).

---

### 2. Localhost-Only Binding ✅

**Implementation:** Explicit hostname binding ([src/index.ts](src/index.ts))

```typescript
const HOST = '127.0.0.1'; // Explicit localhost binding
app.listen(PORT, HOST, () => {
    serverLogger.info(`HTTP transport listening on http://${HOST}:${PORT}`);
});
```

**What it prevents:**
- Network exposure - server is NOT accessible from other machines
- Accidental exposure on public networks (coffee shops, etc.)
- Remote attacks even if firewall is misconfigured

**Note:** The server will ONLY accept connections from the local machine. This is the recommended configuration for MCP servers.

---

### 3. Secure Error Handling ✅

**Implementation:** Typed error responses with `isError` field ([src/utils/error.util.ts](src/utils/error.util.ts))

```typescript
export function formatErrorForMcpTool(error: unknown): {
    content: Array<{ type: 'text'; text: string }>;
    isError: true;  // Explicit error flag
    metadata?: {
        errorType: ErrorType;
        statusCode?: number;
        errorDetails?: unknown;
    };
}
```

**What it provides:**
- MCP clients can reliably detect error states
- Prevents sensitive error details from leaking
- Structured error context for debugging

---

## Authentication & Authorization

### Current State: No Authentication (Localhost-Only)

The boilerplate does **not implement authentication** by default because:
1. Server binds to `127.0.0.1` (localhost-only)
2. DNS rebinding protection prevents browser-based attacks
3. MCP clients on the same machine are trusted

**This is secure for local development and personal use.**

---

### When Authentication is Required

Implement authentication if:
- ❌ You expose the server to a network (beyond localhost)
- ❌ Multiple users share the same machine
- ❌ You deploy to a remote server
- ❌ You handle sensitive data or privileged operations

---

### Authentication Implementation Options

#### Option 1: Bearer Token (Simple)

**Use case:** Single-user remote deployment

```typescript
// Add to src/index.ts before other middleware
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.MCP_AUTH_TOKEN;
    
    if (!expectedToken) {
        // Authentication disabled
        return next();
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    if (token !== expectedToken) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    next();
});
```

**Configuration:**
```bash
# .env.local
MCP_AUTH_TOKEN=your-secret-token-here
```

**Client configuration:**
```json
{
    "mcpServers": {
        "boilerplate": {
            "url": "http://localhost:3000/mcp",
            "headers": {
                "Authorization": "Bearer your-secret-token-here"
            }
        }
    }
}
```

---

#### Option 2: API Key (Multi-User)

**Use case:** Multiple users with different permissions

```typescript
// API key validation middleware
app.use(async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    
    // Validate against database or key store
    const user = await validateApiKey(apiKey);
    if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Attach user to request for authorization checks
    req.user = user;
    next();
});
```

---

#### Option 3: OAuth 2.0 (Enterprise)

**Use case:** Integration with existing identity providers

```typescript
import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth2';

// Configure OAuth strategy
passport.use(new OAuth2Strategy({
    authorizationURL: process.env.OAUTH_AUTH_URL,
    tokenURL: process.env.OAUTH_TOKEN_URL,
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Validate user
    return done(null, profile);
}));

// Protect routes
app.use('/mcp', passport.authenticate('oauth2'), mcpHandler);
```

---

#### Option 4: mTLS (Mutual TLS)

**Use case:** Cryptographic authentication for production systems

```typescript
import https from 'https';
import fs from 'fs';

const options = {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-cert.pem'),
    ca: fs.readFileSync('ca-cert.pem'),
    requestCert: true,
    rejectUnauthorized: true
};

https.createServer(options, app).listen(PORT, HOST);
```

---

## Security Checklist

### For Local Development ✅
- [x] Server binds to localhost (127.0.0.1)
- [x] DNS rebinding protection enabled
- [x] CORS configured for localhost
- [x] Error handling doesn't leak sensitive info
- [ ] Authentication: **NOT REQUIRED** (localhost-only)

### For Network Deployment ⚠️
- [ ] Implement authentication (Bearer/API Key/OAuth)
- [ ] Use HTTPS/TLS encryption
- [ ] Configure firewall rules
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Set up monitoring and alerting
- [ ] Review and restrict tool permissions
- [ ] Validate and sanitize all inputs

### For Production Deployment 🔐
- [ ] Use mTLS or OAuth 2.0
- [ ] Deploy behind reverse proxy (Nginx/Caddy)
- [ ] Implement comprehensive audit logging
- [ ] Set up intrusion detection
- [ ] Configure automated security scanning
- [ ] Establish incident response procedures
- [ ] Regular security audits and penetration testing
- [ ] Secrets management (AWS Secrets Manager, Vault, etc.)

---

## Security Best Practices

### 1. Environment Variables
Never commit secrets to version control:
```bash
# .env.local (gitignored)
MCP_AUTH_TOKEN=secret-token
API_KEY=api-key-value
DATABASE_URL=mongodb://...
```

### 2. Input Validation
Always validate tool inputs with Zod:
```typescript
const ToolSchema = z.object({
    param: z.string().min(1).max(100),
    number: z.number().int().positive(),
});
```

### 3. Rate Limiting
Prevent abuse with rate limiting:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/mcp', limiter);
```

### 4. Logging & Monitoring
Log authentication failures and suspicious activity:
```typescript
logger.warn('Failed authentication attempt', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
});
```

### 5. Regular Updates
Keep dependencies up-to-date:
```bash
npm outdated
npx npm-check-updates
```

---

## Threat Model

### Threats Mitigated ✅
1. **DNS Rebinding Attacks** - Origin header validation
2. **Network Exposure** - Localhost-only binding
3. **Error Information Disclosure** - Structured error handling
4. **CORS Attacks** - Explicit CORS configuration

### Threats Requiring Additional Measures ⚠️
1. **DoS/DDoS** - Add rate limiting
2. **Brute Force** - Add authentication + rate limiting
3. **Man-in-the-Middle** - Use HTTPS/TLS for network deployment
4. **Privilege Escalation** - Implement authorization checks
5. **Injection Attacks** - Validate inputs with Zod schemas

---

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public GitHub issue
2. Email security concerns privately to the maintainer
3. Include detailed reproduction steps
4. Allow time for patching before public disclosure

---

## References

- [MCP Transport Security](https://modelcontextprotocol.io/docs/concepts/transports)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/concepts/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** February 4, 2026  
**Security Review:** Recommended quarterly

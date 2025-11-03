# CLI Quick Reference

## 🚀 Common Commands

### Initialize Project
```bash
# Create TypeScript config
ldesign init

# Create JavaScript config
ldesign init --type js

# Create JSON config
ldesign init --type json

# Force overwrite existing config
ldesign init --force
```

### Build Project
```bash
# Production build
ldesign build

# Development build
ldesign build --mode development

# With source maps
ldesign build --sourcemap

# Watch mode
ldesign build --watch

# Bundle analysis
ldesign build --analyze

# All options
ldesign build src/index.ts \
  --mode production \
  --sourcemap \
  --minify \
  --analyze
```

### Development Server
```bash
# Start dev server
ldesign dev

# Custom port
ldesign dev --port 8080

# Bind to all interfaces
ldesign dev --host 0.0.0.0

# HTTPS
ldesign dev --https

# Auto open browser
ldesign dev --open

# All options
ldesign dev \
  --port 3000 \
  --host localhost \
  --https \
  --open \
  --hmr \
  --cors
```

### UI Management
```bash
# Start UI server
ldesign ui

# Custom ports
ldesign ui --port 8080

# Debug mode
ldesign ui --debug

# Don't auto-open browser
ldesign ui --no-open
```

---

## 🔧 Global Options

All commands support these global options:

```bash
--debug      # Enable debug output
--verbose    # Enable verbose output (includes performance metrics)
--silent     # Suppress all output except errors
--config     # Specify config file path
--cwd        # Set working directory
```

### Examples

```bash
# Debug mode with performance metrics
ldesign build --debug --verbose

# Silent mode
ldesign build --silent

# Custom config file
ldesign build --config my-config.ts

# Custom working directory
ldesign build --cwd /path/to/project
```

---

## 📊 Performance Monitoring

### Enable Performance Profiling

```bash
# Show basic timing
ldesign build --debug

# Show detailed performance metrics
ldesign build --verbose

# Example output:
# 📊 Command Loading Stats:
#   - Loaded: 1
#   - Pending: 15
#   - Total: 16
#
# ⏱️  Total execution time: 245ms
#
# 📊 Performance Summary:
# ────────────────────────────────────────────────────────────
#
# config-loading:
#   Duration: 12.34ms
#   Memory: 45.67 MB / 128.00 MB
#
# cli-creation:
#   Duration: 5.67ms
#   Memory: 46.12 MB / 128.00 MB
#
# command-execution:
#   Duration: 225.43ms
#   Memory: 52.34 MB / 128.00 MB
```

---

## 🎯 Command Aliases

Some commands have short aliases:

```bash
ldesign b          # Same as 'build'
ldesign d          # Same as 'dev'
```

---

## 📝 Configuration File

### Create Config

```bash
ldesign init
```

### Config File Structure

```typescript
// ldesign.config.ts
import { defineConfig } from '@ldesign/cli'

export default defineConfig({
  // Log level
  logLevel: 'info',  // 'debug' | 'info' | 'warn' | 'error' | 'silent'

  // Build configuration
  build: {
    mode: 'production',
    sourcemap: true,
    analyze: false
  },

  // Dev server configuration
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
    https: false
  },

  // UI configuration
  ui: {
    server: {
      port: 3000,
      host: '127.0.0.1'
    },
    web: {
      port: 5173
    },
    open: true
  }
})
```

### Config Priority

1. Command line options (highest)
2. Config file (`ldesign.config.ts`)
3. Default values (lowest)

```bash
# Config says port: 3000
# Command line overrides to 8080
ldesign dev --port 8080  # Uses 8080
```

---

## ❌ Error Handling

### Common Errors and Solutions

#### Invalid Port Number
```bash
$ ldesign dev --port 99999
❌ Invalid port: 99999. Must be between 1 and 65535.
   Field: port

Solution: Use a valid port number (1-65535)
```

#### File Not Found
```bash
$ ldesign build nonexistent.ts
❌ Entry file not found: nonexistent.ts
   Field: entry
   Details: {
     "suggestion": "Check if the file path is correct"
   }

Solution: Verify the file exists and path is correct
```

#### Invalid Build Mode
```bash
$ ldesign build --mode invalid
❌ Invalid mode: invalid. Must be one of: development, production
   Field: mode

Solution: Use 'development' or 'production'
```

#### Port Already in Use
```bash
$ ldesign dev --port 3000
⚠️  Port 3000 is commonly used by other services

Solution: Use a different port or stop the conflicting service
```

---

## 🔍 Validation

All command options are validated before execution:

### Port Validation
- Range: 1-65535
- Warns about common service ports (22, 80, 443, 3306, etc.)

### Path Validation
- Checks file existence
- Validates path format
- No wildcards in directory paths

### Enum Validation
- Build mode: `development` | `production`
- Config type: `ts` | `js` | `json`
- Log level: `debug` | `info` | `warn` | `error` | `silent`

### Host Validation
- Valid hostname or IP address
- Supports: localhost, 0.0.0.0, 127.0.0.1, domain names

---

## 🐛 Debugging

### Enable Debug Mode

```bash
# Show debug information
ldesign build --debug

# Show verbose output with performance
ldesign build --verbose

# Stack traces in errors
DEBUG=1 ldesign build
```

### Debug Output Examples

```bash
$ ldesign build --debug

[15:30:45] [DEBUG] [CommandRegistry] Starting to register 16 commands
[15:30:45] [DEBUG] [CommandRegistry] Command "build" registered (lazy)
[15:30:45] [DEBUG] [LazyCommandRegistry] Loading command: build
[15:30:45] [BUILD] Starting build...
[15:30:45] [BUILD] Mode: production
[15:30:45] [BUILD] Output directory: dist
[15:30:45] [BUILD] Features: source maps, minification
```

---

## 💡 Tips and Tricks

### 1. Combine Options
```bash
ldesign build --mode production --sourcemap --analyze --debug
```

### 2. Use Config Files
Create a config file to avoid typing options repeatedly:
```bash
ldesign init --type ts
# Edit ldesign.config.ts
ldesign build  # Uses config automatically
```

### 3. Performance Profiling
Always use `--verbose` to see where time is spent:
```bash
ldesign build --verbose
```

### 4. Silent CI Builds
For CI/CD, use silent mode:
```bash
ldesign build --silent || exit 1
```

### 5. Development Workflow
```bash
# Terminal 1: Dev server
ldesign dev --port 3000

# Terminal 2: UI server
ldesign ui --port 8080
```

---

## 📚 Further Reading

- [Full Documentation](./INDEX.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Command Enhancement Summary](../COMMAND_ENHANCEMENT_SUMMARY.md)
- [Troubleshooting](./archive/TROUBLESHOOTING.md)

---

## 🆘 Getting Help

```bash
# General help
ldesign --help

# Command-specific help
ldesign build --help
ldesign dev --help
ldesign init --help

# Version information
ldesign --version
```

---

**Last Updated**: 2025-11-03  
**CLI Version**: 1.0.0

# Quick Start Guide

## Installation

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build
```

## Usage

### Available Commands

```bash
# Show all commands
ldesign --help
ld --help  # Short alias

# Show command-specific help
ldesign build --help
ldesign ui --help
```

### Common Commands

#### Build Project
```bash
ldesign build           # Production build
ldesign b              # Using alias
ldesign build --mode development
ldesign build --watch --sourcemap
```

#### Development Server
```bash
ldesign dev            # Start dev server
ldesign d              # Using alias
ldesign dev --port 8080 --open
```

#### Generate Code
```bash
ldesign generate component Button
ldesign g service AuthService    # Using alias
ldesign g component Card --template material
```

#### Run Tests
```bash
ldesign test           # Run all tests
ldesign t              # Using alias
ldesign test --watch --coverage
ldesign test **/*.spec.ts
```

#### UI Management Interface
```bash
ldesign ui             # Start server + web (opens browser)
ldesign ui --dev       # Dev mode (no build)
ldesign ui --no-open   # Don't open browser
ldesign ui --server-port 4000 --web-port 8080
ldesign ui --server-only       # Only server
ldesign ui --web-only          # Only web
```

### New Commands

#### Changelog
```bash
ldesign changelog              # Generate changelog
ldesign cl --version 2.0.0     # Using alias
```

#### Code Formatting
```bash
ldesign format src/
ldesign fmt --fix              # Using alias
ldesign format . --check
```

#### Dependency Management
```bash
ldesign deps --check
ldesign deps --update
ldesign deps --outdated
```

#### Git Operations
```bash
ldesign git --commit -m "feat: add feature"
ldesign git --tag v1.0.0
```

#### Monitoring
```bash
ldesign monitor ./dist
ldesign mon --interval 1000    # Using alias
```

#### Performance Analysis
```bash
ldesign perf http://localhost:3000
ldesign perf --runs 5 --output report.json
```

#### Publishing
```bash
ldesign publish
ldesign pub --tag beta --dry-run  # Using alias
```

#### Security Audit
```bash
ldesign security --audit
ldesign sec --fix              # Using alias
```

#### Documentation
```bash
ldesign docs --input src/ --output docs/
ldesign docs --watch
```

#### Internationalization
```bash
ldesign i18n --source en.json --target zh.json
ldesign i18n --locale fr
```

### Global Options

```bash
# Debug mode
ldesign build --debug

# Verbose output
ldesign test --verbose

# Silent mode (only errors)
ldesign build --silent
```

## Configuration File

Create `ldesign.config.ts` in your project root:

```typescript
import { defineConfig } from '@ldesign/cli'

export default defineConfig({
  logLevel: 'info',
  
  ui: {
    server: {
      port: 3000,
      path: './server',
    },
    web: {
      port: 5173,
      path: './web',
    },
    open: true,
  },
  
  build: {
    mode: 'production',
    sourcemap: true,
  },
  
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
  },
})
```

## Tips

1. **Use Aliases**: Most commands have short aliases (b, d, g, t, etc.)
2. **Tab Completion**: Use `<Tab>` to autocomplete commands
3. **Help**: Add `--help` to any command for detailed options
4. **Global Options**: Use `--debug`, `--verbose`, `--silent` for log control

## Troubleshooting

### Command not found
```bash
# Make sure dependencies are installed
pnpm install

# Rebuild the CLI
pnpm build

# Check if CLI is built
ls dist/
```

### UI command fails
```bash
# Check if server and web directories exist
ls ../server
ls ../web

# Try dev mode (skips build)
ldesign ui --dev

# Check specific ports
ldesign ui --server-port 3001 --web-port 5174
```

### Permission errors
```bash
# On Unix systems, you might need to make bin executable
chmod +x bin/cli.js
```

## Next Steps

- Read [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed changes
- Explore each command with `--help`
- Set up your `ldesign.config.ts`
- Integrate with your @ldesign/* packages

# GitHub Copilot Instructions

## Project Context
This is a Node.js ESM project called "docs-lm" using Yarn 4.6.0 as package manager.

## Development Guidelines

### Code Standards
- Use ES modules syntax (import/export)
- Follow conventional commit format with commitizen
- Use ESLint for code linting
- Target Node.js version 20 or higher

### Project Structure
```
docs-lm/
├── src/
│   └── main.js          # Main entry point
├── package.json         # Project configuration
├── yarn.lock           # Dependency lock file
└── README.md           # Project documentation
```

### Available Scripts
- `yarn dev` - Start development server
- `yarn install` - Install dependencies
- `npx eslint .` - Lint code

### Key Dependencies
- **dotenv**: For environment variable management
- **commitizen**: For conventional commit formatting
- **eslint**: For code quality enforcement

### Coding Preferences
1. Always use ES module syntax (import/export, not require)
2. Use async/await for asynchronous operations
3. Follow conventional commit message format
4. Ensure code passes ESLint checks
5. Use environment variables via dotenv for configuration
6. Maintain compatibility with Node.js 20+

### File Naming
- Use kebab-case for files and directories
- Use .js extension for JavaScript files
- Place main application code in src/ directory

### Environment Setup
- Load environment variables using dotenv
- Ensure Node.js >=20.0.0 compatibility
- Use Yarn 4.6.0 for package management

### Documentation
- All code should be documented in English
- Do not add code documentation like JSDoc or similar
- Do not add new Readme files without asking
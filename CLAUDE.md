# Claude Configuration

## Project Overview
- **Name**: docs-lm
- **Type**: Node.js ESM project
- **Package Manager**: Yarn 4.6.0
- **Node Version**: >=20.0.0

## Development Commands
```bash
# Start development server
yarn dev

# Install dependencies
yarn install

# Lint code
npx eslint .
```

## Project Structure
```
docs-lm/
├── src/
│   └── main.js          # Main entry point
├── package.json         # Project configuration
├── yarn.lock           # Dependency lock file
└── README.md           # Project documentation
```

## Key Dependencies
- **dotenv**: Environment variable management
- **commitizen**: Conventional commit formatting
- **eslint**: Code linting

## Coding Standards
- Use ES modules (type: "module")
- Follow conventional commit format
- Use ESLint for code quality
- Node.js version 20 or higher required

## Environment Setup
- Ensure Node.js >=20.0.0 is installed
- Use Yarn 4.6.0 as package manager
- Configure environment variables in .env file (loaded via dotenv)
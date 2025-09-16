# TypeScript Hello World with Docker

A simple TypeScript Hello World application with Docker support.

## Prerequisites

- Node.js (LTS version recommended)
- pnpm
- Docker (for containerization)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
APP_NAME=tx-benchmark
PORT=3000

# Environment
NODE_ENV=development

# Add other environment variables as needed
API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Run in development mode:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

4. Run in production mode:
```bash
pnpm start
```

## Docker Support

1. Build the Docker image:
```bash
docker build -t tx-benchmark .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env tx-benchmark
```

## Project Structure

```
.
├── src/
│   └── index.ts
├── dist/           (generated after build)
├── Dockerfile
├── .dockerignore
├── .env            (create this file locally)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
``` 
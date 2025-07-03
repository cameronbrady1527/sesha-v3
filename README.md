# Frontend 2

A Next.js application with environment-specific configurations for main and experiment deployments.

## Prerequisites

Make sure you have [pnpm](https://pnpm.io/) installed:

```bash
npm install -g pnpm
```

## Installation

Install dependencies:

```bash
pnpm install
```

## Environment Setup

This project supports multiple environments with different configurations:

- **Main Environment**: Uses `.env.main` configuration
- **Experiment Environment**: Uses `.env.experiment` configuration

Create and configure your environment files:

- `.env.main` - Configuration for your main environment
- `.env.experiment` - Configuration for your experiment environment

Each environment file should contain the environment variables specific to that deployment target.

## Development

### Main Environment
Run the development server with main environment configuration:

```bash
pnpm dev:main
```

### Experiment Environment
Run the development server with experiment environment configuration:

```bash
pnpm dev:experiment
```

### Default Development
Run the development server with default Next.js configuration:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building & Production

### Main Environment
Build and start the main environment:

```bash
# Build for production
pnpm build:main

# Start production server
pnpm start:main
```

### Experiment Environment
Build and start the experiment environment:

```bash
# Build for production
pnpm build:experiment

# Start production server
pnpm start:experiment
```

### Default Production
Build and start with default configuration:

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:main` | Start development server with main environment |
| `pnpm dev:experiment` | Start development server with experiment environment |
| `pnpm dev` | Start development server with default configuration |
| `pnpm build:main` | Build for production with main environment |
| `pnpm build:experiment` | Build for production with experiment environment |
| `pnpm build` | Build for production with default configuration |
| `pnpm start:main` | Start production server with main environment |
| `pnpm start:experiment` | Start production server with experiment environment |
| `pnpm start` | Start production server with default configuration |

## How It Works

The environment-specific scripts work by copying the appropriate `.env` file to `.env.local` before running Next.js commands:

- `dev:main` copies `.env.main` to `.env.local` then runs `next dev`
- `dev:experiment` copies `.env.experiment` to `.env.local` then runs `next dev`

This allows you to easily switch between different configurations for different deployment targets or testing scenarios.

## Development Notes

- The page entry point is located at `app/page.tsx`
- The project uses Next.js App Router
- Hot reloading is enabled during development
- Environment variables are automatically loaded from `.env.local`

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [pnpm Documentation](https://pnpm.io/motivation) - learn about pnpm package manager
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

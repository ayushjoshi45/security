# Frontend Dashboard

Vite + React frontend for the Security Scanner project.

## Run

1. Install dependencies:

	 npm install

2. Start development server:

	 npm run dev

3. Build for production:

	 npm run build

## Environment

Optionally set backend URL with:

- VITE_API_BASE_URL=http://localhost:5000

If not set, the app defaults to http://localhost:5000.

## Architecture

The project is organized for easy page expansion:

- src/app:
	- Router and route definitions
- src/layouts:
	- Shared shell layout
- src/pages:
	- Route-level pages (Dashboard, Track Scan, Realtime Logs)
- src/components:
	- Reusable UI blocks by feature area
- src/services:
	- API clients and domain services
- src/hooks:
	- Reusable stateful logic (tracked scan polling, realtime logs)

## Adding New Pages

1. Create page component in src/pages.
2. Add route entry in src/app/routes.jsx.
3. Route will automatically appear in sidebar navigation.

# Debex

Project Debex — a simple e-commerce sample with a Node.js backend and static frontend pages.

## Features
- REST API backend for users, products, and orders (see [backend/server.js](backend/server.js#L1)).
- SMS service integration for notifications ([backend/services/smsService.js](backend/services/smsService.js#L1)).
- Static frontend pages for browsing and checkout in the `frontend/` folder.

## Repository structure

- `backend/` — Node.js server, controllers, models, routes, and services.
	- See [backend/controllers/userController.js](backend/controllers/userController.js#L1) and related files.
- `frontend/` — static HTML pages (home, product categories, checkout, admin).
- `SMS_MIGRATION_SUMMARY.md` — notes and migration steps for SMS integration.
- `SMS_SETUP_GUIDE.md` — setup and configuration guide for SMS provider credentials.

## Requirements
- Node.js 14+ (or later)
- npm (for installing backend dependencies)

## Quick start

1. Install backend dependencies

```bash
cd backend
npm install
```

2. Configure environment (create a `.env` or set env vars):

- `PORT` — port for the server (default 3000)
- `DB_URL` — database connection string (if used)
- SMS provider keys as described in [SMS_SETUP_GUIDE.md](SMS_SETUP_GUIDE.md#L1)

3. Run the server

```bash
cd backend
node server.js
```

4. Open the frontend

Open any of the files in the `frontend/` folder in your browser (for example, [frontend/index.html](frontend/index.html#L1)). For local API calls, host the frontend from a simple static server or enable CORS in the backend.

## SMS migration and setup

Read [SMS_MIGRATION_SUMMARY.md](SMS_MIGRATION_SUMMARY.md#L1) for migration notes and [SMS_SETUP_GUIDE.md](SMS_SETUP_GUIDE.md#L1) for configuration steps to connect your SMS provider.

## Useful files

- API entry: [backend/server.js](backend/server.js#L1)
- DB config: [backend/config/db.js](backend/config/db.js#L1)
- SMS service: [backend/services/smsService.js](backend/services/smsService.js#L1)
- Controllers: [backend/controllers/](backend/controllers/)

## Contributing

Feel free to open issues or submit pull requests. For changes related to SMS integration, consult the migration summary and setup guide first.

## License

This project does not include a license file. Add one if you intend to publish the code.

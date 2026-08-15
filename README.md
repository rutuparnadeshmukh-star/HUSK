# HUSK — Banking, Invest & Pay

A professional demo banking web app with **Personal** and **Business** modes, PIN-first security, expense tracking, simulated investing with candlestick charts, price comparison, and business access controls.

> All data is simulated. This is a presentation-ready demo application.

## Features

### Personal mode
- Dashboard with balance, daily spend limit bar, linked banks and recent transactions
- **Expense tracking** — a single donut chart breakdown by category (plus add-expense form)
- **Invest** — market watch, simulated candlestick charts, portfolio performance line chart, buy/sell with Payment PIN
- **Price comparison** — mock products and prices across retailers with best-price highlighting
- **Bank linking** — fully simulated secure connection to mock banks
- **Add money** — simulated Razorpay gateway flow (webhook signature verified server-side)

### Business mode
- Owner dashboard, employee management, spend limits, full audit log
- **Instant employee revocation** — kills all sessions immediately
- Employee accounts with server-side enforced limits and owner-only protections

### Security (Section 8)
- PINs hashed with **bcrypt** (never plain text)
- **Rate-limited** login/PIN/payment attempts, auto-lock after 5 failures
- **Short-lived JWT** sessions with refresh rotation
- **PIN always required** — biometrics never override the PIN (two-step login when enabled)
- Changing your login PIN **logs out all other sessions**
- **Payment PIN required for every transaction**, always separate from login PIN
- Server-side amount/limit/balance verification — client values are never trusted
- Razorpay webhook **HMAC-SHA256 signature verification**
- CORS restricted to the app's own domains
- Input sanitization & validation on every endpoint
- Owner/Employee permissions enforced **server-side** on every request
- Full timestamped **audit log** of every access grant/revoke

## Tech stack

- **Backend:** Node.js, Express, bcryptjs, jsonwebtoken, express-rate-limit
- **Frontend:** React 18, Vite, React Router (custom SVG charts — no heavy chart deps)
- **Storage:** JSON file store (`backend/data/db.json`, auto-created)

## Getting started

```bash
# Install dependencies
npm run setup

# Build the frontend and start the server (port 3001)
npm start
```

Open http://localhost:3001

### Development (Vite + proxy)

```bash
cd frontend && npm run dev   # Vite on :5173, proxies /api -> :3001
cd backend && npm run dev    # API on :3001
```

## Configuration

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 3001) |
| `JWT_ACCESS_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs refresh tokens |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies webhook signatures |
| `APP_ORIGINS` | Allowed CORS origins (comma-separated) |
| `ACCESS_TOKEN_TTL` | Access token lifetime (minutes) |
| `REFRESH_TOKEN_TTL` | Refresh token lifetime (days) |

## Security notes for production

- Replace the default secrets in `.env` before going live
- Enforce HTTPS at the reverse proxy/load balancer
- API keys and secrets live **only** in server-side environment variables, never in frontend code
- The webhook secret used to sign Razorpay callbacks must match your Razorpay dashboard

## API overview

- `POST /api/auth/register|login|refresh|logout|change-pin|...`
- `GET/POST /api/personal/*` — dashboard, expenses, transactions, invest, products, banks
- `GET/POST /api/business/*` — dashboard, employees, limits, audit log
- `POST /api/webhooks/razorpay` — signature-verified webhook
- `POST /api/payments/*` — mock gateway order/simulate

## Demo accounts

Create an account from the register page (Personal or Business). For a Business owner, use the shown **join code** to create employee accounts.

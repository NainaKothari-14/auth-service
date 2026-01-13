# Auth Service

An independent authentication service built with Node.js, Express, PostgreSQL, and React. Supports multiple authentication methods and integrates easily with any Node + React project.

## Features

- **Email/Password** – Standard authentication
- **OTP via Email** – Email verification & password reset
- **OTP via WhatsApp** – Password reset via WhatsApp
- **OAuth2** – Google & GitHub login
- **SSO** – Single sign-on for multiple apps

## Project Structure

```
auth-service/
├── backend/          # Node.js + Express
│   └── .env.example      
├── frontend/         # React (Vite)
├── client-app-1/     # Example app 1
└── client-app-2/     # Example app 2
```

## Getting Started

### Installation

Clone the repository and install dependencies for both backend and frontend.

### Configuration

Create a `.env` file in `/backend` based on `.env.example` with your credentials:
- Database configuration (PostgreSQL)
- JWT and cookie secrets
- Email service (Resend API)
- Twilio for WhatsApp OTP
- OAuth credentials (Google, GitHub)

### Running the Application

Start the backend server (runs on port 5000) and frontend development server (runs on port 5173).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Google OAuth |
| `GET` | `/auth/github` | GitHub OAuth |
| `GET` | `/sso/login` | SSO login page |
| `POST` | `/sso/login` | SSO authentication |
| `GET` | `/sso/verify` | Verify JWT token |

## Integration

To integrate with your application, redirect users to the SSO login endpoint with your callback URL. After successful authentication, users will be redirected back with a JWT token in the query parameters.

## Important Notes

- WhatsApp OTP requires an active Twilio account
- OAuth requires valid credentials from Google and GitHub
- Never commit `.env` files with real secrets
- Use HTTPS in production environments

## Author

**Naina Kothari** – [GitHub](https://github.com/NainaKothari-14)

---

If you find this project helpful, please star the repository!

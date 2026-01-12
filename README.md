# 🔐 Auth Service

An independent authentication service built with Node.js, Express, PostgreSQL, and React. Supports multiple authentication methods and integrates easily with any Node + React project.

## ✨ Features

- **📧 Email/Password** – Standard authentication
- **🔢 OTP via Email** – Email verification & password reset
- **💬 OTP via WhatsApp** – Password reset via WhatsApp
- **🌐 OAuth2** – Google & GitHub login
- **🎫 SSO** – Single sign-on for multiple apps

## 📁 Structure

```
auth-service/
├── backend/          # Node.js + Express
├── frontend/         # React (Vite)
├── client-app-1/     # Example app 1
├── client-app-2/     # Example app 2
└── .env.example
```

## 🚀 Quick Start

### Install

```bash
git clone https://github.com/NainaKothari-14/auth-service.git
cd auth-service

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Configure

Create `.env` in `/backend`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
GOOGLE_CLIENT_ID=your_google_id
GITHUB_CLIENT_ID=your_github_id
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASS=your_db_password
```

### Run

```bash
# Backend
cd backend && npm run dev
# → http://localhost:5000

# Frontend
cd frontend && npm run dev
# → http://localhost:5173
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Google OAuth |
| `GET` | `/auth/github` | GitHub OAuth |
| `GET` | `/sso/login` | SSO login page |
| `POST` | `/sso/login` | SSO authentication |
| `GET` | `/sso/verify` | Verify JWT token |

## 🔗 Integration

```html
<button onclick="loginWithSSO()">Login</button>

<script>
  function loginWithSSO() {
    window.location.href = 'http://localhost:5000/sso/login?redirect=' + 
                           encodeURIComponent(window.location.origin);
  }
</script>
```

After login, get token from URL and store it:

```javascript
const token = new URLSearchParams(window.location.search).get('token');
localStorage.setItem('authToken', token);
```

## ⚠️ Notes

- WhatsApp OTP requires Twilio account
- OAuth needs Google/GitHub credentials
- Never commit `.env` with real secrets
- Use HTTPS in production

## 👩‍💻 Author

**Naina Kothari** – [@NainaKothari-14](https://github.com/NainaKothari-14)

---

⭐ Star this repo if you find it helpful!

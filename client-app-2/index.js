import express from "express";

const app = express();
const PORT = 3001;

app.get("/", (req, res) => {
  res.send(`
    <h1>Client App 2</h1>
    <a href="http://localhost:5000/sso/login?redirect=http://localhost:3001/callback">
      Login with SSO
    </a>
  `);
});

app.get("/callback", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.send("No token received");
  }

  res.send(`
    <h2>Logged in via SSO 🎉</h2>
    <p>Token:</p>
    <pre>${token}</pre>
  `);
});

app.listen(PORT, () =>
  console.log(`Client App 2 running on http://localhost:${PORT}`)
);

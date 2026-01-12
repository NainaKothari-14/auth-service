import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send(`
    <h1>Client App 1</h1>
    <a href="http://localhost:5000/sso/login?redirect=http://localhost:3000/callback">
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
  console.log(`Client App 1 running on http://localhost:${PORT}`)
);

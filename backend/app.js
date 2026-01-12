import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";

dotenv.config();
import "./config/passport.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(express.json());
app.use(cors());


app.use(passport.initialize());


app.use("/auth", authRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));

export default app;

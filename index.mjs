import express, { json, urlencoded } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import apiRoutes from "./routes/apiRoutes.mjs";
import authRoutes from "./routes/authRoutes.mjs";

app.use(json());
app.use(urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: "Internal Server Error" });
});

const startServer = (port) => {
  const serverPort = port || process.env.PORT || 5000;
  return new Promise((resolve, reject) => {
    const server = app
      .listen(serverPort, () => {
        console.log(`Server is running on PORT ${serverPort}`);
        resolve(server);
      })
      .on("error", reject);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app, startServer };

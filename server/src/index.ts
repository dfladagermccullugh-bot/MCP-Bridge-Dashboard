import express from "express";
import cors from "cors";
import systemRoutes from "./routes/system.js";
import configRoutes from "./routes/config.js";
import serverRoutes from "./routes/servers.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/system", systemRoutes);
app.use("/api/config", configRoutes);
app.use("/api/servers", serverRoutes);

app.listen(PORT, () => {
  console.log(`MCP Bridge Dashboard server running on http://localhost:${PORT}`);
});

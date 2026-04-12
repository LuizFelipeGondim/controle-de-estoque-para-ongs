import fastify from "fastify";
import cookie from "@fastify/cookie";
import { authRoutes } from "./routes/auth.js";
import { batchRoutes } from "./routes/batch.js"
import { itemTypeRoutes } from "./routes/item-types.js";
import { donationRoutes } from "./routes/donations.js";
import { dashboardRoutes } from "./routes/dashboard.js";

export const app = fastify();

app.register(cookie);

// Registro modular das rotas
app.register(authRoutes, { prefix: "auth" });
app.register(batchRoutes, { prefix: "batch" });
app.register(itemTypeRoutes, { prefix: "items" });
app.register(donationRoutes, { prefix: "donations" });
app.register(dashboardRoutes, { prefix: "dashboard" });
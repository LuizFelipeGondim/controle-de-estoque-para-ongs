import fastify from "fastify";
import cookie from "@fastify/cookie";
import { authRoutes } from "./routes/auth.js";
import { batchRoutes } from "./routes/batch.js"
import { itemTypeRoutes } from "./routes/item-types.js";
import { donationItemsRoutes } from "./routes/donation-items.js";
import { donationPacketRoutes } from "./routes/donation-packets.js";

export const app = fastify();

app.register(cookie);

// Registro modular das rotas
app.register(authRoutes, { prefix: "auth" });
app.register(batchRoutes, { prefix: "batch" });
app.register(itemTypeRoutes, { prefix: "items" });
app.register(donationItemsRoutes, { prefix: "donation-items" });
app.register(donationPacketRoutes, { prefix: "donation-packets" });
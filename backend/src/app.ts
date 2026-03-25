import fastify from "fastify";
import cookie from "@fastify/cookie";
import { batchRoutes } from "./routes/batch.js"

export const app = fastify();

app.register(cookie)
app.register(batchRoutes, {
    prefix: "batch"
});
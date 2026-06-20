import { beforeAll, afterAll } from "vitest";
import { db } from "../src/database.js";
import { execSync } from "node:child_process";

beforeAll(async () => {
  execSync("npm run knex -- migrate:rollback --all", { 
    env: { ...process.env, NODE_ENV: "test" },
    stdio: "ignore"
  });
  execSync("npm run knex -- migrate:latest", { 
    env: { ...process.env, NODE_ENV: "test" },
    stdio: "ignore"
  });
});

afterAll(async () => {
  execSync("npm run knex -- migrate:rollback --all", { 
    env: { ...process.env, NODE_ENV: "test" },
    stdio: "ignore"
  });
  await db.destroy();
});

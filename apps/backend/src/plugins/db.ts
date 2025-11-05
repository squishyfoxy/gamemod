import fp from "fastify-plugin";
import { Pool } from "pg";

import { env } from "../env";

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
  }
}

export default fp(async (fastify) => {
  if (!env.DATABASE_URL) {
    fastify.log.warn(
      "DATABASE_URL is not set. Database-dependent features are disabled."
    );
    return;
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    ssl:
      env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined
  });

  fastify.decorate("db", pool);

  fastify.addHook("onClose", async (instance, done) => {
    await instance.db.end();
    done();
  });
});

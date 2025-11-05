import type { FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./health";
import { registerTicketRoutes } from "./v1/tickets";
import { registerTopicRoutes } from "./v1/topics";
import { registerStaffRoutes } from "./v1/staff";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);

  await app.register(
    async (v1) => {
      await registerTicketRoutes(v1);
      await registerTopicRoutes(v1);
      await registerStaffRoutes(v1);
    },
    { prefix: "/v1" }
  );
}

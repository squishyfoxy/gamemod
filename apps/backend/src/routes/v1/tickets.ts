import { randomUUID } from "node:crypto";

import { FastifyInstance } from "fastify";
import { z } from "zod";

const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  playerId: z.string().min(1, "Player identifier is required"),
  category: z.string().optional()
});

const ticketIdParamsSchema = z.object({
  id: z.string().uuid("Ticket id must be a UUID")
});

export async function registerTicketRoutes(app: FastifyInstance) {
  app.post("/tickets", async (request) => {
    const parsed = createTicketSchema.safeParse(request.body);

    if (!parsed.success) {
      throw app.httpErrors.badRequest(parsed.error.message);
    }

    const ticket = {
      id: randomUUID(),
      ...parsed.data,
      status: "open" as const,
      createdAt: new Date().toISOString()
    };

    return {
      ticket,
      message:
        "Ticket received. Persistence is not yet implemented in this stub."
    };
  });

  app.get("/tickets/:id", async (request) => {
    const parsed = ticketIdParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      throw app.httpErrors.badRequest(parsed.error.message);
    }

    return {
      ticket: {
        id: parsed.data.id,
        status: "open" as const,
        resolution: null,
        lastUpdate: new Date().toISOString()
      },
      message: "Data persistence not yet implemented. This is a placeholder."
    };
  });
}

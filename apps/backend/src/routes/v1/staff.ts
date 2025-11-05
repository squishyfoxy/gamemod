import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "../../env";

const themeSchema = z.object({
  primary: z.string(),
  surface: z.string(),
  surfaceMuted: z.string(),
  surfaceSubtle: z.string(),
  backgroundAccentOne: z.string(),
  backgroundAccentTwo: z.string()
});

const siteSchema = z.object({
  brandLabel: z.string(),
  brandHeading: z.string(),
  headerNote: z.string(),
  headerGreeting: z.string(),
  guildName: z.string(),
  showGuildCard: z.boolean(),
  showTopicsPanel: z.boolean()
});

type ThemeSettings = z.infer<typeof themeSchema>;
type SiteSettings = z.infer<typeof siteSchema>;

const defaultTheme: ThemeSettings = {
  primary: "#6366f1",
  surface: "#101225",
  surfaceMuted: "#1b1e3b",
  surfaceSubtle: "#2a2e5c",
  backgroundAccentOne: "#1f2353",
  backgroundAccentTwo: "#2f347a"
};

const defaultSite: SiteSettings = {
  brandLabel: "GameMod",
  brandHeading: "Control Center",
  headerNote: "Operations Checkpoint",
  headerGreeting: "Welcome back, Commander Vega",
  guildName: "NovaWatch",
  showGuildCard: true,
  showTopicsPanel: true
};

async function getOrCreateSettings(app: FastifyInstance) {
  const existing = await app.db.query<{
    theme: ThemeSettings;
    site: SiteSettings;
  }>(
    `SELECT theme, site
     FROM staff_settings
     WHERE id = 1`
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  await app.db.query(
    `INSERT INTO staff_settings (id, theme, site)
     VALUES (1, $1::jsonb, $2::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(defaultTheme), JSON.stringify(defaultSite)]
  );

  return {
    theme: defaultTheme,
    site: defaultSite
  };
}

export async function registerStaffRoutes(app: FastifyInstance) {
  app.get("/staff/settings", async () => {
    const settings = await getOrCreateSettings(app);
    return settings;
  });

  app.put("/staff/settings", async (request) => {
    if (!env.ADMIN_PASSWORD) {
      request.log.error("ADMIN_PASSWORD must be set to update staff settings.");
      throw app.httpErrors.internalServerError("Staff settings are not configured");
    }

    const adminKey =
      request.headers["x-admin-key"] ??
      request.headers["X-Admin-Key" as keyof typeof request.headers];

    if (typeof adminKey !== "string" || adminKey !== env.ADMIN_PASSWORD) {
      throw app.httpErrors.unauthorized("Staff credentials required");
    }

    const payloadSchema = z
      .object({
        theme: themeSchema.optional(),
        site: siteSchema.optional()
      })
      .refine(
        (value) => Boolean(value.theme) || Boolean(value.site),
        "Provide theme and/or site settings to update."
      );

    const parsed = payloadSchema.parse(request.body ?? {});

    const current = await getOrCreateSettings(app);

    const nextTheme = parsed.theme ?? current.theme;
    const nextSite = parsed.site ?? current.site;

    await app.db.query(
      `INSERT INTO staff_settings (id, theme, site, updated_at)
       VALUES (1, $1::jsonb, $2::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET theme = EXCLUDED.theme,
                     site = EXCLUDED.site,
                     updated_at = NOW()`,
      [JSON.stringify(nextTheme), JSON.stringify(nextSite)]
    );

    return {
      theme: nextTheme,
      site: nextSite
    };
  });
}

CREATE TABLE IF NOT EXISTS staff_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  theme JSONB NOT NULL,
  site JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO staff_settings (id, theme, site)
VALUES (
  1,
  '{
    "primary": "#6366f1",
    "surface": "#101225",
    "surfaceMuted": "#1b1e3b",
    "surfaceSubtle": "#2a2e5c",
    "backgroundAccentOne": "#1f2353",
    "backgroundAccentTwo": "#2f347a"
  }',
  '{
    "brandLabel": "GameMod",
    "brandHeading": "Control Center",
    "headerNote": "Operations Checkpoint",
    "headerGreeting": "Welcome back, Commander Vega",
    "guildName": "NovaWatch",
    "showGuildCard": true,
    "showTopicsPanel": true
  }'
)
ON CONFLICT (id) DO NOTHING;

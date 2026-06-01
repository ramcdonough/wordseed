-- Run this in the Supabase SQL editor:
-- https://app.supabase.com → your project → SQL editor → New query

-- ── Words ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.words (
  id                TEXT PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word              TEXT NOT NULL,
  definition        TEXT DEFAULT '',
  part_of_speech    TEXT DEFAULT '',
  example_sentence  TEXT DEFAULT '',
  pronunciation     TEXT DEFAULT '',
  audio_url         TEXT DEFAULT '',
  synonyms          JSONB DEFAULT '[]',
  antonyms          JSONB DEFAULT '[]',
  collections       JSONB DEFAULT '[]',
  notes             TEXT DEFAULT '',
  is_archived       BOOLEAN DEFAULT FALSE,
  date_added        BIGINT DEFAULT 0,
  last_reviewed     BIGINT,
  next_review_date  BIGINT,
  interval          INTEGER DEFAULT 0,
  ease_factor       DECIMAL DEFAULT 2.5,
  repetitions       INTEGER DEFAULT 0,
  times_seen        INTEGER DEFAULT 0,
  times_correct     INTEGER DEFAULT 0,
  times_incorrect   INTEGER DEFAULT 0,
  mastery_score     INTEGER DEFAULT 0,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Collections ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collections (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  color        TEXT DEFAULT '#818cf8',
  icon         TEXT DEFAULT '📚',
  date_created BIGINT DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily stats ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_stats (
  date              TEXT NOT NULL,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  words_reviewed    INTEGER DEFAULT 0,
  correct_answers   INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  quiz_sessions     INTEGER DEFAULT 0,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, user_id)
);

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.words       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Words policies
CREATE POLICY "words: users own their rows"
  ON public.words FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "collections: users own their rows"
  ON public.collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily stats policies
CREATE POLICY "stats: users own their rows"
  ON public.daily_stats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Real-time ────────────────────────────────────────────────────────────────
-- Enable real-time on words so other devices get instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.words;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;

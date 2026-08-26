-- Table for custom decks created by teachers
CREATE TABLE taboo_custom_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- The short code to join (e.g. FEN-1234)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for cards belonging to custom decks
CREATE TABLE taboo_custom_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID REFERENCES taboo_custom_decks(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    forbidden_words JSONB NOT NULL,
    ai_descriptions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for asynchronous duels
CREATE TABLE taboo_duels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenger_score INTEGER NOT NULL,
    challenger_combo INTEGER NOT NULL,
    category TEXT, -- The category or deck code played
    seed TEXT NOT NULL, -- Random seed so both players get the same words
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE taboo_custom_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE taboo_custom_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE taboo_duels ENABLE ROW LEVEL SECURITY;

-- Custom Decks RLS
-- Anyone can read custom decks (needed for students joining via code)
CREATE POLICY "Public can read custom decks"
    ON taboo_custom_decks FOR SELECT
    USING (true);

-- Only teachers can insert their own decks
CREATE POLICY "Teachers can insert their own decks"
    ON taboo_custom_decks FOR INSERT
    WITH CHECK (auth.uid() = teacher_id);

-- Custom Cards RLS
-- Anyone can read custom cards (needed for students to play)
CREATE POLICY "Public can read custom cards"
    ON taboo_custom_cards FOR SELECT
    USING (true);

-- Only teachers can insert their own cards
CREATE POLICY "Teachers can insert cards for their decks"
    ON taboo_custom_cards FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT teacher_id FROM taboo_custom_decks WHERE id = deck_id)
    );

-- Duels RLS
-- Anyone can read duels (so friends can see the challenge)
CREATE POLICY "Public can read duels"
    ON taboo_duels FOR SELECT
    USING (true);

-- Anyone logged in can create a duel challenge
CREATE POLICY "Users can create duels"
    ON taboo_duels FOR INSERT
    WITH CHECK (auth.uid() = challenger_id);

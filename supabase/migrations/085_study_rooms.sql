-- Migration for Study Rooms feature

CREATE TYPE public.study_room_status AS ENUM ('active', 'closed');
CREATE TYPE public.study_room_type AS ENUM ('voice', 'silent');

CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  room_type public.study_room_type NOT NULL DEFAULT 'voice',
  status public.study_room_status NOT NULL DEFAULT 'active',
  max_participants INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS study_rooms_status_idx ON public.study_rooms (status);

CREATE TABLE IF NOT EXISTS public.study_room_participants (
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_participants ENABLE ROW LEVEL SECURITY;

-- Allow all users to read active rooms
CREATE POLICY "Allow read active rooms" ON public.study_rooms
  FOR SELECT USING (status = 'active');

-- Allow authenticated users to create rooms
CREATE POLICY "Allow insert own rooms" ON public.study_rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Allow room host to update their room
CREATE POLICY "Allow update own rooms" ON public.study_rooms
  FOR UPDATE USING (auth.uid() = host_id);

-- Allow reading participants
CREATE POLICY "Allow read participants" ON public.study_room_participants
  FOR SELECT USING (true);

-- Allow authenticated users to join/leave rooms
CREATE POLICY "Allow insert own participation" ON public.study_room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update own participation" ON public.study_room_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- End of migration

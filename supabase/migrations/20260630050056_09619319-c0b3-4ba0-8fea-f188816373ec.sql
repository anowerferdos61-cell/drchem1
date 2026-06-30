
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  video_platform TEXT NOT NULL DEFAULT 'youtube',
  video_id TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read videos" ON public.videos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage videos" ON public.videos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX videos_chapter_idx ON public.videos(chapter_number, sort_order);

CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read notes" ON public.notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage notes" ON public.notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX notes_chapter_idx ON public.notes(chapter_number, sort_order);
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.videos (chapter_number, title, video_platform, video_id, is_premium, sort_order) VALUES
  (4, 'পর্যায় সারণি পরিচিতি', 'youtube', 'jl07hSejuvA', false, 1),
  (10, 'এসিড, ক্ষারক ও লবণ — পরিচিতি', 'youtube', 'jl07hSejuvA', false, 1),
  (3, 'পরমাণুর গঠন ও ইলেকট্রন বিন্যাস', 'youtube', 'jl07hSejuvA', true, 1),
  (5, 'রাসায়নিক বন্ধন — আয়নিক ও সমযোজী', 'youtube', 'jl07hSejuvA', true, 1);

INSERT INTO public.notes (chapter_number, title, content, is_premium, sort_order) VALUES
  (10, 'এসিড, ক্ষারক ও লবণ — মূল ধারণা',
'# এসিড, ক্ষারক ও লবণ

## সংজ্ঞা
- **এসিড**: যে যৌগ জলীয় দ্রবণে H⁺ আয়ন দান করে।
- **ক্ষারক**: যে যৌগ জলীয় দ্রবণে OH⁻ আয়ন দান করে।
- **লবণ**: এসিড ও ক্ষারকের প্রশমন বিক্রিয়ায় উৎপন্ন যৌগ।

## সাধারণ বিক্রিয়া
HCl + NaOH → NaCl + H₂O

## pH স্কেল
- 0–6 : অম্লীয়
- 7   : প্রশম
- 8–14 : ক্ষারীয়

> মনে রাখো: pH = -log[H⁺]', false, 1),
  (4, 'পর্যায় সারণি — মূল ধারণা',
'# পর্যায় সারণি

মৌলগুলোকে পারমাণবিক সংখ্যার ক্রমে সাজানো একটি ছক।

## গুরুত্বপূর্ণ বৈশিষ্ট্য
- **পর্যায়** (Period): অনুভূমিক সারি — ৭টি
- **গ্রুপ** (Group): উল্লম্ব কলাম — ১৮টি

## ট্রেন্ড
- পর্যায় বরাবর বাঁ থেকে ডানে গেলে পারমাণবিক ব্যাসার্ধ **কমে**।
- গ্রুপ বরাবর উপর থেকে নিচে গেলে পারমাণবিক ব্যাসার্ধ **বাড়ে**।', true, 1),
  (3, 'পরমাণুর গঠন',
'# পরমাণুর গঠন

পরমাণু তিনটি মৌলিক কণিকা দ্বারা গঠিত:
- **প্রোটন** (+)
- **নিউট্রন** (নিরপেক্ষ)
- **ইলেকট্রন** (−)

## ইলেকট্রন বিন্যাস (Bohr)
K(2), L(8), M(18), N(32) ...

উদাহরণ: Na (11) → 2, 8, 1', true, 1);

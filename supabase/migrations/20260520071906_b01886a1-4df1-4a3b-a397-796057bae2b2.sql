ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS category text;
ALTER TYPE public.medicine_unit ADD VALUE IF NOT EXISTS 'injection';
ALTER TYPE public.medicine_unit ADD VALUE IF NOT EXISTS 'syrup';
ALTER TYPE public.medicine_unit ADD VALUE IF NOT EXISTS 'ointment';
ALTER TYPE public.medicine_unit ADD VALUE IF NOT EXISTS 'ampoule';
ALTER TYPE public.medicine_unit ADD VALUE IF NOT EXISTS 'tube';
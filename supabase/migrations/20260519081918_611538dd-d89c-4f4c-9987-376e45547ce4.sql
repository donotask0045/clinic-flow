
ALTER TABLE public.shortages DROP CONSTRAINT IF EXISTS sh_med_fk;
ALTER TABLE public.diagnoses_suggestions DROP CONSTRAINT IF EXISTS ds_med_fk;
ALTER TABLE public.inventory_counts DROP CONSTRAINT IF EXISTS ic_med_fk;
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS sm_med_fk;
ALTER TABLE public.uploaded_files DROP CONSTRAINT IF EXISTS uf_patient_fk;
ALTER TABLE public.uploaded_files DROP CONSTRAINT IF EXISTS uf_visit_fk;

DO $$ BEGIN
  CREATE TYPE public.medicine_form AS ENUM ('tablet','ointment','syrup','injection','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS form public.medicine_form NOT NULL DEFAULT 'tablet';

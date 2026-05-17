
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'pharmacist');
CREATE TYPE public.visit_status AS ENUM ('pending','in_progress','partially_dispensed','dispensed','not_available','closed');
CREATE TYPE public.visit_priority AS ENUM ('high','medium','low');
CREATE TYPE public.medicine_unit AS ENUM ('box','strip','pill');
CREATE TYPE public.medicine_status AS ENUM ('available','low_stock','out_of_stock','expired');
CREATE TYPE public.stock_movement_type AS ENUM ('in','out','adjustment','count');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Role check function (SECURITY DEFINER, avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_any_role()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============ PATIENTS ============
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  military_number text UNIQUE NOT NULL,
  other_diseases text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_patients_military ON public.patients(military_number);
CREATE INDEX idx_patients_name ON public.patients(full_name);

-- ============ MEDICINES ============
CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commercial_name text,
  barcode text UNIQUE,
  description text,
  expiry_date date,
  minimum_pills integer NOT NULL DEFAULT 0,
  pills_per_strip integer NOT NULL DEFAULT 1,
  strips_per_box integer NOT NULL DEFAULT 1,
  total_pills integer NOT NULL DEFAULT 0,
  status public.medicine_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_medicines_barcode ON public.medicines(barcode);
CREATE INDEX idx_medicines_expiry ON public.medicines(expiry_date);

CREATE OR REPLACE FUNCTION public.recalc_medicine_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.total_pills <= 0 THEN
    NEW.status := 'out_of_stock';
  ELSIF NEW.total_pills <= NEW.minimum_pills THEN
    NEW.status := 'low_stock';
  ELSE
    NEW.status := 'available';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_medicine_status BEFORE INSERT OR UPDATE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.recalc_medicine_status();

-- ============ STOCK MOVEMENTS ============
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  pills_delta integer NOT NULL,
  reason text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ============ VISITS ============
CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id),
  diagnosis text,
  notes text,
  priority public.visit_priority NOT NULL DEFAULT 'medium',
  status public.visit_status NOT NULL DEFAULT 'pending',
  closed_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_visits_patient ON public.visits(patient_id);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_visits_created ON public.visits(created_at DESC);

-- ============ PRESCRIPTIONS ============
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES public.medicines(id),
  unit public.medicine_unit NOT NULL DEFAULT 'pill',
  quantity integer NOT NULL CHECK (quantity > 0),
  dispensed_pills integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- ============ SHORTAGES ============
CREATE TABLE public.shortages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  missing_pills integer NOT NULL DEFAULT 0,
  request_count integer NOT NULL DEFAULT 1,
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shortages ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role public.app_role,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ ACTIVITY LOGS ============
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============ AUDIT LOGS (immutable) ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prevent_audit_changes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit_logs are immutable'; END;
$$;
CREATE TRIGGER trg_audit_immutable_u BEFORE UPDATE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_changes();
CREATE TRIGGER trg_audit_immutable_d BEFORE DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_changes();

-- ============ FILES ============
CREATE TABLE public.uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- ============ ARCHIVED VISITS ============
CREATE TABLE public.archived_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.archived_visits ENABLE ROW LEVEL SECURITY;

-- ============ INVENTORY COUNTS ============
CREATE TABLE public.inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  counted_pills integer NOT NULL,
  previous_pills integer NOT NULL,
  performed_by uuid REFERENCES auth.users(id),
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;

-- ============ DIAGNOSIS SUGGESTIONS ============
CREATE TABLE public.diagnoses_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease text NOT NULL,
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (disease, medicine_id)
);
ALTER TABLE public.diagnoses_suggestions ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============
-- profiles: every signed-in user can read; users update own; admins all
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: select self or admin; only admin writes
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- patients: any clinic role can read; doctor/admin write
CREATE POLICY "patients_read" ON public.patients FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "patients_write" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'doctor') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "patients_update" ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'doctor') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "patients_delete_admin" ON public.patients FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- medicines: all roles read; pharmacist/admin write
CREATE POLICY "medicines_read" ON public.medicines FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "medicines_write" ON public.medicines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'pharmacist') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'pharmacist') OR public.has_role(auth.uid(),'admin'));

-- stock_movements
CREATE POLICY "stock_read" ON public.stock_movements FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "stock_write" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'pharmacist') OR public.has_role(auth.uid(),'admin'));

-- visits
CREATE POLICY "visits_read" ON public.visits FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "visits_insert" ON public.visits FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'doctor') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "visits_update" ON public.visits FOR UPDATE TO authenticated
  USING (public.current_user_has_any_role());

-- prescriptions
CREATE POLICY "rx_read" ON public.prescriptions FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "rx_write" ON public.prescriptions FOR ALL TO authenticated
  USING (public.current_user_has_any_role()) WITH CHECK (public.current_user_has_any_role());
CREATE POLICY "rxi_read" ON public.prescription_items FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "rxi_write" ON public.prescription_items FOR ALL TO authenticated
  USING (public.current_user_has_any_role()) WITH CHECK (public.current_user_has_any_role());

-- shortages
CREATE POLICY "shortages_read" ON public.shortages FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "shortages_write" ON public.shortages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'pharmacist') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'pharmacist') OR public.has_role(auth.uid(),'admin'));

-- notifications: own
CREATE POLICY "notif_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR target_role = public.get_current_role() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_any_role());

-- logs: admin read, system insert allowed for authenticated
CREATE POLICY "activity_read" ON public.activity_logs FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "activity_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_read_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- files
CREATE POLICY "files_read" ON public.uploaded_files FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "files_write" ON public.uploaded_files FOR ALL TO authenticated
  USING (public.current_user_has_any_role()) WITH CHECK (public.current_user_has_any_role());

-- archive
CREATE POLICY "archive_read" ON public.archived_visits FOR SELECT TO authenticated USING (public.current_user_has_any_role());

-- inventory counts
CREATE POLICY "ic_read" ON public.inventory_counts FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "ic_insert" ON public.inventory_counts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'pharmacist') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ic_update_admin" ON public.inventory_counts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- suggestions
CREATE POLICY "sugg_read" ON public.diagnoses_suggestions FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "sugg_write_admin" ON public.diagnoses_suggestions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_patients BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_visits BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescription_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shortages;

-- ============ Storage bucket for uploaded files ============
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-files','patient-files',false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "pf_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-files' AND public.current_user_has_any_role());
CREATE POLICY "pf_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-files' AND public.current_user_has_any_role());
CREATE POLICY "pf_delete_admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(),'admin'));

-- ============ SEED ADMIN ============
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@clinic.local';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'admin@clinic.local', crypt('admin123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"username":"admin"}',
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, jsonb_build_object('sub', v_user_id::text, 'email','admin@clinic.local'), 'email', v_user_id::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, username, full_name, is_active)
  VALUES (v_user_id, 'admin', 'System Administrator', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
  ON CONFLICT DO NOTHING;
END $$;

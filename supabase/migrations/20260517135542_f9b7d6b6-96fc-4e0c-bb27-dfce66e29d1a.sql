
-- Bind existing functions to triggers
CREATE TRIGGER trg_medicines_recalc_status
BEFORE INSERT OR UPDATE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.recalc_medicine_status();

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_changes();

-- touch updated_at on key tables
CREATE TRIGGER trg_patients_touch BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_visits_touch BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Excel import tracking
CREATE TABLE public.excel_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by uuid,
  entity_type text NOT NULL,
  file_name text,
  total_rows integer NOT NULL DEFAULT 0,
  success_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  errors jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.excel_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imports_read" ON public.excel_imports FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "imports_write" ON public.excel_imports FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pharmacist'));

-- App-wide settings
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read" ON public.app_settings FOR SELECT TO authenticated USING (public.current_user_has_any_role());
CREATE POLICY "settings_write_admin" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_settings_touch BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime for additional tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER TABLE public.patients REPLICA IDENTITY FULL;
ALTER TABLE public.visits REPLICA IDENTITY FULL;
ALTER TABLE public.medicines REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.shortages REPLICA IDENTITY FULL;

-- Foreign keys for integrity
ALTER TABLE public.visits ADD CONSTRAINT visits_patient_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.prescriptions ADD CONSTRAINT rx_visit_fk FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;
ALTER TABLE public.prescription_items ADD CONSTRAINT rxi_rx_fk FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;
ALTER TABLE public.prescription_items ADD CONSTRAINT rxi_med_fk FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE RESTRICT;
ALTER TABLE public.stock_movements ADD CONSTRAINT sm_med_fk FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;
ALTER TABLE public.shortages ADD CONSTRAINT sh_med_fk FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_counts ADD CONSTRAINT ic_med_fk FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;
ALTER TABLE public.diagnoses_suggestions ADD CONSTRAINT ds_med_fk FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;
ALTER TABLE public.uploaded_files ADD CONSTRAINT uf_patient_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
ALTER TABLE public.uploaded_files ADD CONSTRAINT uf_visit_fk FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;
ALTER TABLE public.archived_visits ADD CONSTRAINT av_visit_fk FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT ur_unique UNIQUE (user_id, role);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON public.medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_status ON public.medicines(status);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id) WHERE is_read = false;

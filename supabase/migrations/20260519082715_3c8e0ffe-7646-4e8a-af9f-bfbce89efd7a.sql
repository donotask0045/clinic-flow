
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_before jsonb;
  v_after jsonb;
  v_entity_id uuid;
BEGIN
  BEGIN
    v_actor := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
    BEGIN v_entity_id := (NEW).id; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    BEGIN v_entity_id := (NEW).id; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
  ELSIF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
    BEGIN v_entity_id := (OLD).id; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (v_actor, lower(TG_OP), TG_TABLE_NAME, v_entity_id, v_before, v_after);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Attach to all relevant tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'patients','visits','prescriptions','prescription_items',
    'medicines','shortages','stock_movements','inventory_counts',
    'profiles','user_roles','app_settings','diagnoses_suggestions','uploaded_files'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trg ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audit_trg AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()', t);
  END LOOP;
END $$;

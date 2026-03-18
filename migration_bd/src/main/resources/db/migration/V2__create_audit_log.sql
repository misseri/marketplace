CREATE TABLE IF NOT EXISTS public.app_audit_log (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_time timestamptz NOT NULL DEFAULT now(),
    actor varchar(100),
    action varchar(100) NOT NULL,
    details text
);

CREATE INDEX IF NOT EXISTS app_audit_log_event_time_idx
    ON public.app_audit_log (event_time);

-- Enable Row Level Security on all public tables.
-- The app uses service_role key which bypasses RLS, so no existing functionality is affected.
-- With RLS enabled and no policies, direct access via anon/authenticated key is denied by default.

ALTER TABLE public.requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

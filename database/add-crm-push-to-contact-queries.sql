-- "Push lead to CRM" on the Contact Queries page: remember which CRM lead a
-- query became so it is never pushed twice and the reference can be shown.

ALTER TABLE public.contact_queries
  ADD COLUMN IF NOT EXISTS crm_lead_reference text,
  ADD COLUMN IF NOT EXISTS crm_assignee_name  text,
  ADD COLUMN IF NOT EXISTS pushed_to_crm_at   timestamptz;

COMMENT ON COLUMN public.contact_queries.crm_lead_reference IS
  'CRM lead reference (e.g. website-contact-2026-184729) this query was pushed into.';

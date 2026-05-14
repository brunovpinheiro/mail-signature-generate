CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name    TEXT        NOT NULL,
  requester_email   TEXT        NOT NULL,
  company_domain    TEXT,
  type              TEXT        NOT NULL CHECK (type IN ('single', 'bulk')),
  signature_items   JSONB       NOT NULL,
  data_hash         TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'awaiting_approval'
                                CHECK (status IN ('awaiting_approval', 'approved', 'rejected', 'expired')),
  decision_by       TEXT,
  decision_reason   TEXT,
  decided_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approval_tokens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID        NOT NULL REFERENCES requests(id),
  manager_email   TEXT        NOT NULL,
  token           TEXT        NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  invalidated_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        REFERENCES requests(id),
  event       TEXT        NOT NULL,
  actor_email TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_tokens_token      ON approval_tokens(token);
CREATE INDEX idx_approval_tokens_request_id ON approval_tokens(request_id);
CREATE INDEX idx_audit_logs_request_id      ON audit_logs(request_id);
CREATE INDEX idx_requests_requester_email   ON requests(requester_email);
CREATE INDEX idx_requests_status            ON requests(status);
CREATE INDEX idx_requests_company_domain    ON requests(company_domain);

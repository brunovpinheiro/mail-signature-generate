ALTER TABLE requests ADD COLUMN company_domain TEXT;

CREATE INDEX idx_requests_company_domain ON requests(company_domain);

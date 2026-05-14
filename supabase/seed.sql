-- Seed data para desenvolvimento local
-- Simula os principais estados de uma solicitação de assinatura

-- Solicitação 1: aguardando aprovação (single)
INSERT INTO requests (id, requester_name, requester_email, type, signature_items, data_hash, status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Ana Silva',
  'ana.silva@taclashopping.com.br',
  'single',
  '[{"name":"Ana Silva","jobTitle":"Analista de Marketing","email":"ana.silva@taclashopping.com.br","phone":"(41) 99999-1111","website":"taclashopping.com.br"}]',
  'hash-ana-001',
  'awaiting_approval',
  now() - interval '2 hours'
);

INSERT INTO approval_tokens (id, request_id, manager_email, token, expires_at, created_at)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'gestor@taclashopping.com.br',
  'token-dev-aguardando-aprovacao',
  now() + interval '70 hours',
  now() - interval '2 hours'
);

INSERT INTO audit_logs (request_id, event, actor_email, metadata, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'request_created', 'ana.silva@taclashopping.com.br', '{"type":"single"}', now() - interval '2 hours'),
  ('a1000000-0000-0000-0000-000000000001', 'token_sent', NULL, '{"manager":"gestor@taclashopping.com.br"}', now() - interval '2 hours');

-- Solicitação 2: aprovada
INSERT INTO requests (id, requester_name, requester_email, type, signature_items, data_hash, status, decision_by, decided_at, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'Carlos Mendes',
  'carlos.mendes@taclashopping.com.br',
  'single',
  '[{"name":"Carlos Mendes","jobTitle":"Coordenador de TI","email":"carlos.mendes@taclashopping.com.br","phone":"(41) 99999-2222","website":"taclashopping.com.br"}]',
  'hash-carlos-002',
  'approved',
  'gestor@taclashopping.com.br',
  now() - interval '1 day',
  now() - interval '2 days'
);

INSERT INTO approval_tokens (id, request_id, manager_email, token, expires_at, used_at, created_at)
VALUES (
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'gestor@taclashopping.com.br',
  'token-dev-aprovado',
  now() + interval '70 hours',
  now() - interval '1 day',
  now() - interval '2 days'
);

INSERT INTO audit_logs (request_id, event, actor_email, metadata, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000002', 'request_created', 'carlos.mendes@taclashopping.com.br', '{"type":"single"}', now() - interval '2 days'),
  ('a1000000-0000-0000-0000-000000000002', 'token_sent', NULL, '{"manager":"gestor@taclashopping.com.br"}', now() - interval '2 days'),
  ('a1000000-0000-0000-0000-000000000002', 'approved', 'gestor@taclashopping.com.br', '{}', now() - interval '1 day');

-- Solicitação 3: rejeitada
INSERT INTO requests (id, requester_name, requester_email, type, signature_items, data_hash, status, decision_by, decision_reason, decided_at, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'Beatriz Costa',
  'beatriz.costa@taclashopping.com.br',
  'single',
  '[{"name":"BEATRIZ COSTA","jobTitle":"GERENTE","email":"beatriz.costa@taclashopping.com.br","phone":"(41) 99999-3333","website":"taclashopping.com.br"}]',
  'hash-beatriz-003',
  'rejected',
  'gestor@taclashopping.com.br',
  'Nome e cargo devem estar em letras normais, não em caixa alta.',
  now() - interval '3 hours',
  now() - interval '1 day'
);

INSERT INTO audit_logs (request_id, event, actor_email, metadata, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000003', 'request_created', 'beatriz.costa@taclashopping.com.br', '{"type":"single"}', now() - interval '1 day'),
  ('a1000000-0000-0000-0000-000000000003', 'rejected', 'gestor@taclashopping.com.br', '{"reason":"Nome e cargo devem estar em letras normais, não em caixa alta."}', now() - interval '3 hours');

-- Solicitação 4: bulk (múltiplas assinaturas)
INSERT INTO requests (id, requester_name, requester_email, type, signature_items, data_hash, status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'Fernanda Lima',
  'fernanda.lima@taclashopping.com.br',
  'bulk',
  '[
    {"name":"Fernanda Lima","jobTitle":"Diretora de RH","email":"fernanda.lima@taclashopping.com.br","phone":"(41) 99999-4444","website":"taclashopping.com.br"},
    {"name":"Ricardo Souza","jobTitle":"Analista de RH","email":"ricardo.souza@taclashopping.com.br","phone":"(41) 99999-4445","website":"taclashopping.com.br"},
    {"name":"Patrícia Rocha","jobTitle":"Assistente de RH","email":"patricia.rocha@taclashopping.com.br","phone":"(41) 99999-4446","website":"taclashopping.com.br"}
  ]',
  'hash-bulk-004',
  'awaiting_approval',
  now() - interval '30 minutes'
);

INSERT INTO approval_tokens (id, request_id, manager_email, token, expires_at, created_at)
VALUES (
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000004',
  'gestor@taclashopping.com.br',
  'token-dev-bulk-aguardando',
  now() + interval '71 hours',
  now() - interval '30 minutes'
);

INSERT INTO audit_logs (request_id, event, actor_email, metadata, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000004', 'request_created', 'fernanda.lima@taclashopping.com.br', '{"type":"bulk","count":3}', now() - interval '30 minutes');

-- Solicitação 5: token expirado
INSERT INTO requests (id, requester_name, requester_email, type, signature_items, data_hash, status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'Marcos Pereira',
  'marcos.pereira@taclashopping.com.br',
  'single',
  '[{"name":"Marcos Pereira","jobTitle":"Consultor","email":"marcos.pereira@taclashopping.com.br","phone":"(41) 99999-5555","website":"taclashopping.com.br"}]',
  'hash-marcos-005',
  'expired',
  now() - interval '5 days'
);

INSERT INTO approval_tokens (id, request_id, manager_email, token, expires_at, invalidated_at, created_at)
VALUES (
  'b1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000005',
  'gestor@taclashopping.com.br',
  'token-dev-expirado',
  now() - interval '2 days',
  now() - interval '2 days',
  now() - interval '5 days'
);

INSERT INTO audit_logs (request_id, event, actor_email, metadata, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000005', 'request_created', 'marcos.pereira@taclashopping.com.br', '{"type":"single"}', now() - interval '5 days');

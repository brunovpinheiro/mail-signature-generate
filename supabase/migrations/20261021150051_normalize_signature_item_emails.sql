-- "Minhas solicitações" encontra as assinaturas geradas para um e-mail por
-- contenção JSONB (signature_items @> '[{"email": "..."}]'), que só bate com o
-- e-mail já normalizado. A API passou a normalizar na gravação; aqui ficam
-- normalizados os itens já gravados (sem espaços nas pontas e em minúsculas).
-- O \u00a0 cobre o espaço não separável que vem de planilha e que o trim() do JS remove.
-- O data_hash não é recalculado: hoje ele só é gravado, nunca conferido.

UPDATE requests r
SET signature_items = (
  SELECT jsonb_agg(
           CASE
             WHEN jsonb_typeof(t.item -> 'email') = 'string'
               THEN jsonb_set(
                      t.item,
                      '{email}',
                      to_jsonb(lower(regexp_replace(t.item ->> 'email', '^[\s\u00a0]+|[\s\u00a0]+$', '', 'g')))
                    )
             ELSE t.item
           END
           ORDER BY t.ord
         )
  FROM jsonb_array_elements(r.signature_items) WITH ORDINALITY AS t(item, ord)
)
WHERE jsonb_typeof(r.signature_items) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(r.signature_items) AS e(item)
    WHERE jsonb_typeof(e.item -> 'email') = 'string'
      AND e.item ->> 'email' <> lower(regexp_replace(e.item ->> 'email', '^[\s\u00a0]+|[\s\u00a0]+$', '', 'g'))
  );

-- jsonb_path_ops: menor e mais rápido, e atende ao operador @> usado na busca.
CREATE INDEX idx_requests_signature_items ON requests USING GIN (signature_items jsonb_path_ops);

// Cliente Supabase falso, em memória, para os testes dos handlers HTTP.
// Implementa só o pedaço do query builder que as rotas usam, com a mesma
// semântica do PostgREST (inclusive a contenção JSONB de `contains`).

type Row = Record<string, unknown>
type Filter = (row: Row) => boolean

function jsonContains(container: unknown, contained: unknown): boolean {
  if (Array.isArray(contained)) {
    return (
      Array.isArray(container) &&
      contained.every((c) => container.some((item) => jsonContains(item, c)))
    )
  }
  if (contained !== null && typeof contained === 'object') {
    if (container === null || typeof container !== 'object' || Array.isArray(container)) return false
    return Object.entries(contained).every(([key, value]) =>
      jsonContains((container as Row)[key], value)
    )
  }
  return container === contained
}

class Query implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Filter[] = []
  private sort: { column: string; ascending: boolean } | null = null
  private max: number | null = null
  private mode: 'many' | 'single' = 'many'
  private inserted: Row[] | null = null
  private failure: { message: string } | null = null

  constructor(private readonly table: Row[]) {}

  select() {
    return this
  }

  insert(values: Row | Row[]) {
    const rows = (Array.isArray(values) ? values : [values]).map((v) => ({
      id: crypto.randomUUID(),
      ...structuredClone(v),
    }))
    this.table.push(...rows)
    this.inserted = rows
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value)
    return this
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value)
    return this
  }

  // Como no supabase-js: string vai como está (JSON para colunas jsonb), objeto
  // vira JSON, mas array vira literal de array do Postgres (`{a,b}`), que o
  // PostgREST recusa numa coluna jsonb — como todas as que este falso guarda.
  contains(column: string, value: unknown) {
    if (Array.isArray(value)) {
      this.failure = { message: `invalid input syntax for type json: {${value.join(',')}}` }
      return this
    }
    let parsed: unknown = value
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value)
      } catch {
        this.failure = { message: `invalid input syntax for type json: ${value}` }
        return this
      }
    }
    this.filters.push((row) => jsonContains(row[column], parsed))
    return this
  }

  order(column: string, opts: { ascending?: boolean } = {}) {
    this.sort = { column, ascending: opts.ascending ?? true }
    return this
  }

  limit(n: number) {
    this.max = n
    return this
  }

  single() {
    this.mode = 'single'
    return this
  }

  private run(): { data: unknown; error: unknown } {
    if (this.failure) return { data: null, error: this.failure }
    let rows = this.inserted ?? this.table.filter((row) => this.filters.every((f) => f(row)))
    if (this.sort) {
      const { column, ascending } = this.sort
      rows = [...rows].sort((a, b) => {
        const cmp = String(a[column]).localeCompare(String(b[column]))
        return ascending ? cmp : -cmp
      })
    }
    if (this.max !== null) rows = rows.slice(0, this.max)
    rows = rows.map((r) => structuredClone(r))

    if (this.mode === 'single') {
      return rows.length === 1
        ? { data: rows[0], error: null }
        : { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned' } }
    }
    return { data: rows, error: null }
  }

  then<T1 = { data: unknown; error: unknown }, T2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected)
  }
}

export function createFakeSupabase() {
  const tables: Record<string, Row[]> = {}
  const table = (name: string) => (tables[name] ??= [])

  return {
    tables,
    reset() {
      for (const name of Object.keys(tables)) delete tables[name]
    },
    seed(name: string, rows: Row[]) {
      table(name).push(...rows.map((r) => structuredClone(r)))
    },
    client: {
      from: (name: string) => new Query(table(name)),
    },
  }
}

/** Instância única compartilhada pelo mock do módulo `_lib/supabase`. */
export const fakeDb = createFakeSupabase()

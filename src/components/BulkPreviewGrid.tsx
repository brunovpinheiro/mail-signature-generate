import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BulkSignatureItem } from '@/types/export'
import type { TemplateDefinition } from '@/lib/templates'

interface BulkPreviewGridProps {
  items: BulkSignatureItem[]
  template: TemplateDefinition | undefined
}

export function BulkPreviewGrid({ items, template }: BulkPreviewGridProps) {
  const previews = useMemo(() => {
    if (!template) return []
    return items.map((item) => ({
      ...item,
      html: template.render(item.data),
    }))
  }, [items, template])

  if (previews.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Preview</h3>
        <Badge variant="secondary">{previews.length} assinaturas</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {previews.map((preview) => (
          <Card key={preview.index} className="overflow-hidden">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {preview.data.name}
              </p>
              <div
                className="bg-white rounded border p-2 overflow-hidden"
                style={{ transform: 'scale(0.6)', transformOrigin: 'top left', height: '120px' }}
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

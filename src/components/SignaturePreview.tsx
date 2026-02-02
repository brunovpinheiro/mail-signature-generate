import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SignaturePreviewProps {
  html: string
}

export function SignaturePreview({ html }: SignaturePreviewProps) {
  if (!html) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Preencha os campos obrigatórios para ver o preview
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="rounded-md border p-4 bg-white"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  )
}

import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

interface QualitySliderProps {
  value: number
  onChange: (value: number) => void
}

const PRESETS = [
  { label: 'Baixa', value: 60 },
  { label: 'Média', value: 80 },
  { label: 'Alta', value: 92 },
  { label: 'Máxima', value: 100 },
]

export function QualitySlider({ value, onChange }: QualitySliderProps) {
  const displayValue = Math.round(value * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Qualidade JPEG</span>
        <span className="text-sm text-muted-foreground">{displayValue}%</span>
      </div>
      <Slider
        value={[displayValue]}
        onValueChange={([v]) => onChange(v / 100)}
        min={10}
        max={100}
        step={5}
      />
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={displayValue === preset.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(preset.value / 100)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

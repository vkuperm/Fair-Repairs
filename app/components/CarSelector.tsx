import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { YEARS, MAKES, MAKES_MODELS } from '~/lib/carData'

interface Props {
  year: string
  make: string
  model: string
  onChange: (field: 'carYear' | 'carMake' | 'carModel', value: string) => void
}

export default function CarSelector({ year, make, model, onChange }: Props) {
  const models = make ? (MAKES_MODELS[make] ?? []) : []

  return (
    <div className="space-y-4">
      {/* Year */}
      <div className="space-y-2">
        <Label>Year *</Label>
        <Select value={year} onValueChange={v => { onChange('carYear', v); onChange('carMake', ''); onChange('carModel', '') }}>
          <SelectTrigger><SelectValue placeholder="— Select Year —" /></SelectTrigger>
          <SelectContent>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Make */}
      {year && (
        <div className="space-y-2 animate-fade-in">
          <Label>Make *</Label>
          <Select value={make} onValueChange={v => { onChange('carMake', v); onChange('carModel', '') }}>
            <SelectTrigger><SelectValue placeholder="— Select Make —" /></SelectTrigger>
            <SelectContent>
              {MAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Model */}
      {year && make && (
        <div className="space-y-2 animate-fade-in">
          <Label>Model *</Label>
          <Select value={model} onValueChange={v => onChange('carModel', v)}>
            <SelectTrigger><SelectValue placeholder="— Select Model —" /></SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Breadcrumb */}
      {(year || make || model) && (
        <div className="flex items-center gap-1.5 text-sm bg-muted/50 rounded-lg px-3 py-2 flex-wrap">
          <span className="text-muted-foreground">Selected:</span>
          {year && <span className="font-medium">{year}</span>}
          {make && <><span className="text-muted-foreground">›</span><span className="font-medium">{make}</span></>}
          {model && <><span className="text-muted-foreground">›</span><span className="font-bold text-primary">{model}</span></>}
        </div>
      )}
    </div>
  )
}

'use client'

/**
 * Selector reutilizable de vecinos/viviendas: buscador en tiempo real,
 * checkbox por fila, y checkbox superior "Seleccionar todos".
 * Se relaciona con AsignarPagoForm.tsx y con el endpoint
 * /api/pagos/asignar/crear (determina MASIVO/GRUPO/INDIVIDUAL según
 * cuántos IDs se seleccionen).
 * Existe para reutilizar la misma lógica de selección múltiple en
 * cualquier lugar del admin que necesite elegir viviendas.
 */
import { useState, useMemo } from 'react'
import { Search, Check } from 'lucide-react'

type Vecino = {
  id: string
  name: string
  houseNumber: string | null
}

export default function SelectorVecinos({
  vecinos,
  selectedIds,
  onChange,
}: {
  vecinos: Vecino[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return vecinos
    return vecinos.filter(
      (v) => v.name.toLowerCase().includes(q) || v.houseNumber?.toLowerCase().includes(q)
    )
  }, [vecinos, query])

  const todosSeleccionados = vecinos.length > 0 && selectedIds.length === vecinos.length

  const toggleTodos = () => {
    onChange(todosSeleccionados ? [] : vecinos.map((v) => v.id))
  }

  const toggleUno = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-neutral-100 bg-neutral-100/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o número de casa..."
            className="w-full text-sm bg-white border border-neutral-100 rounded-lg pl-8 pr-3 py-2
                       focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 px-3 py-2.5 border-b border-neutral-100 cursor-pointer hover:bg-black/[0.02] transition-colors">
        <span
          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            todosSeleccionados ? 'bg-black border-black' : 'border-neutral-200'
          }`}
        >
          {todosSeleccionados && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </span>
        <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} className="hidden" />
        <span className="text-xs font-medium text-neutral-900">
          Seleccionar todos ({vecinos.length})
        </span>
      </label>

      <div className="max-h-56 overflow-y-auto">
        {filtrados.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-6">Sin resultados.</p>
        ) : (
          filtrados.map((v) => {
            const checked = selectedIds.includes(v.id)
            return (
              <label
                key={v.id}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-black/[0.02] transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                    checked ? 'bg-black border-black' : 'border-neutral-200'
                  }`}
                >
                  {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </span>
                <input type="checkbox" checked={checked} onChange={() => toggleUno(v.id)} className="hidden" />
                <span className="text-xs text-neutral-900">
                  {v.name}
                  {v.houseNumber && <span className="text-neutral-400"> · Casa {v.houseNumber}</span>}
                </span>
              </label>
            )
          })
        )}
      </div>

      <div className="px-3 py-2 bg-neutral-100/40 border-t border-neutral-100">
        <p className="text-[11px] text-neutral-400">
          {selectedIds.length} de {vecinos.length} seleccionados
        </p>
      </div>
    </div>
  )
}
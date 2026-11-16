import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useMemo } from 'react'
import { pinPosition } from '../lib/coords'
import { dataset } from '../lib/data'
import { collectibleCountsSlot, itemCountVisibleSlot, officialDoneSlot, useStored, write } from '../lib/storage'
import type { Place } from '../lib/types'
import { categoryStyle } from './categories'
import { MapViewport } from './MapViewport'
import { SupportLink } from './SupportLink'

const totals = new Map<string, number>()
for (const item of dataset.items) totals.set(item.place, (totals.get(item.place) ?? 0) + 1)

/** Collectibles the world map can count per place, whether or not they are completed. */
const COUNTED = ['gs', 'heart', 'container'] as const
const collectibles = new Map<string, Map<string, number>>()
for (const item of dataset.items) {
  if (!(COUNTED as readonly string[]).includes(item.cat)) continue
  const counts = collectibles.get(item.place) ?? new Map<string, number>()
  counts.set(item.cat, (counts.get(item.cat) ?? 0) + 1)
  collectibles.set(item.place, counts)
}
const categoryName = (key: string) => dataset.categories.find((category) => category.key === key)?.name ?? key

function CollectibleCounts({ placeId }: { placeId: string }) {
  const counts = collectibles.get(placeId)
  if (!counts) return null
  return (
    <span className="mt-0.5 flex items-center gap-1.5 rounded border border-ink-600 bg-ink-950/85 px-1.5 py-0.5 text-[11px] leading-tight text-parchment-50 tabular-nums">
      {COUNTED.map((key) => {
        const count = counts.get(key)
        if (!count) return null
        const { icon: Icon, color } = categoryStyle(key)
        return (
          <span key={key} className="flex items-center gap-0.5" title={categoryName(key)}>
            <Icon size={11} style={{ color }} aria-hidden />
            {count}
          </span>
        )
      })}
    </span>
  )
}

function collectibleLabel(placeId: string) {
  const counts = collectibles.get(placeId)
  if (!counts) return null
  return COUNTED.filter((key) => counts.get(key)).map((key) => `${counts.get(key)} ${categoryName(key)}`).join(', ')
}

function PlaceLink({
  place,
  done,
  showCount,
  showCollectibles,
}: {
  place: Place
  done: number
  showCount: boolean
  showCollectibles: boolean
}) {
  const total = totals.get(place.id) ?? 0
  const complete = total > 0 && done === total
  const dungeon = place.kind === 'dungeon'
  const progress = total === 0 ? 'no tracked items' : showCount ? `${done} of ${total} items completed` : null

  return (
    <div data-pin className="absolute size-0 hover:z-10 focus-within:z-10" style={pinPosition(place.pin)}>
      <Link
        to="/$zone"
        params={{ zone: place.slug }}
        draggable={false}
        aria-label={[place.name, dungeon ? 'dungeon' : 'zone', progress, showCollectibles && collectibleLabel(place.id)]
          .filter(Boolean)
          .join(', ')}
        className="group absolute -top-6 left-0 flex w-max -translate-x-1/2 cursor-pointer flex-col items-center rounded-lg"
      >
        <span className="grid size-12 place-items-center">
          <span
            className={`grid place-items-center border-2 shadow-md shadow-black/60 transition-transform group-hover:scale-125 group-focus-visible:scale-125 ${
              dungeon
                ? 'size-4 rotate-45 border-ink-950 bg-ember'
                : 'size-4.5 rounded-full border-ink-950 bg-parchment-200'
            } ${complete ? 'bg-moss!' : ''}`}
          >
            {complete && <Check size={10} strokeWidth={4} className={`text-ink-950 ${dungeon ? '-rotate-45' : ''}`} />}
          </span>
        </span>
        <span
          className={`-mt-2.5 flex items-center gap-1 rounded border bg-ink-950/85 px-1.5 py-0.5 text-[11px] leading-tight font-medium text-parchment-50 transition-colors group-hover:bg-parchment-200 group-hover:text-ink-950 group-focus-visible:bg-parchment-200 group-focus-visible:text-ink-950 ${
            dungeon ? 'border-ember/70' : 'border-parchment-600/50'
          }`}
        >
          {place.name}
          {showCount && total > 0 && done > 0 && <span className="tabular-nums opacity-70">{done}/{total}</span>}
        </span>
        {showCollectibles && <CollectibleCounts placeId={place.id} />}
      </Link>
    </div>
  )
}

export function WorldMap() {
  const doneIds = useStored(officialDoneSlot)
  const countsShown = useStored(itemCountVisibleSlot)
  const collectiblesShown = useStored(collectibleCountsSlot)
  const donePerPlace = useMemo(() => {
    const done = new Set(doneIds)
    const counts = new Map<string, number>()
    for (const item of dataset.items) {
      if (done.has(item.id)) counts.set(item.place, (counts.get(item.place) ?? 0) + 1)
    }
    return counts
  }, [doneIds])
  const doneTotal = [...donePerPlace.values()].reduce((sum, n) => sum + n, 0)

  return (
    <main className="relative h-dvh overflow-clip bg-ink-950">
      <img
        src="/content/maps/hyrule.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full scale-110 object-cover opacity-35 blur-2xl"
      />
      <MapViewport
        viewId="world"
        image={dataset.map.image}
        alt="Map of Hyrule"
        aspect={dataset.map.width / dataset.map.height}
      >
        {dataset.places.map((place) => (
          <PlaceLink
            key={place.id}
            place={place}
            done={donePerPlace.get(place.id) ?? 0}
            showCount={countsShown.includes(place.id)}
            showCollectibles={collectiblesShown}
          />
        ))}
      </MapViewport>
      <header className="pointer-events-none absolute top-3 left-3 rounded-lg border border-ink-600 bg-ink-900/90 px-4 py-3 shadow-lg">
        <h1 className="font-serif text-xl text-parchment-50">Field Atlas</h1>
        <p className="mt-0.5 text-xs text-parchment-400 tabular-nums">
          {doneTotal} of {dataset.items.length} items completed
        </p>
        <ul className="mt-2 flex gap-4 text-xs text-parchment-200">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-parchment-200" /> Zone
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rotate-45 bg-ember" /> Dungeon
          </li>
        </ul>
        <button
          type="button"
          role="switch"
          aria-checked={collectiblesShown}
          onClick={() => write(collectibleCountsSlot, !collectiblesShown)}
          className="pointer-events-auto mt-2 flex cursor-pointer items-center gap-2 text-xs text-parchment-200"
        >
          Show collectible counts
          <span className={`relative h-5 w-9 rounded-full transition-colors ${collectiblesShown ? 'bg-moss' : 'bg-ink-600'}`}>
            <span
              className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-parchment-50 transition-transform ${collectiblesShown ? 'translate-x-4' : ''}`}
            />
          </span>
        </button>
      </header>
      <SupportLink className="absolute bottom-3 left-3" />
    </main>
  )
}

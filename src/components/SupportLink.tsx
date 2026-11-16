import { Coffee } from 'lucide-react'

const SUPPORT_URL = 'https://buymeacoffee.com/lilgousse'

export function SupportLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900/90 px-3 py-1.5 text-xs text-parchment-200 shadow-lg hover:border-parchment-400 hover:text-parchment-50 ${className}`}
    >
      <Coffee size={14} aria-hidden /> Buy me a coffee
    </a>
  )
}

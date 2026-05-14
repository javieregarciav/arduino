import { useEffect, useRef, useState } from 'react'

const API_URL = 'https://7i3wbeouq2.execute-api.us-east-1.amazonaws.com/message'

type Figure = {
  tag: string
  label: string
  glyph: string
}

const FIGURES: Figure[] = [
  { tag: 'feliz', label: 'Feliz', glyph: '😊' },
  { tag: 'guino', label: 'Guiño', glyph: '😉' },
  { tag: 'triste', label: 'Triste', glyph: '😢' },
  { tag: 'sorpresa', label: 'Sorpresa', glyph: '😮' },
  { tag: 'corazon', label: 'Corazón', glyph: '❤️' },
  { tag: 'ok', label: 'OK', glyph: '✅' },
  { tag: 'x', label: 'Error', glyph: '❌' },
  { tag: 'flecha', label: 'Flecha', glyph: '➡️' },
]

const SUGGESTIONS: { title: string; payload: string; icon: React.ReactNode }[] = [
  { title: 'Hola mundo 😊', payload: 'Hola mundo :feliz:', icon: <IconUser /> },
  { title: 'Bienvenido ❤️', payload: 'Bienvenido :corazon:', icon: <IconMail /> },
  { title: 'Sistema listo ✅', payload: 'Sistema listo :ok:', icon: <IconChat /> },
  { title: 'Activo ➡️', payload: 'Activo :flecha:', icon: <IconSliders /> },
]

const MAX = 1000

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function App() {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'sent') {
      const t = setTimeout(() => setStatus('idle'), 2500)
      return () => clearTimeout(t)
    }
  }, [status])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!pickerRef.current) return
      if (!pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    if (showPicker) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showPicker])

  function insertTag(tag: string) {
    const el = inputRef.current
    const token = `:${tag}:`
    if (!el) {
      setMessage((m) => (m + ' ' + token).trimStart())
      return
    }
    const start = el.selectionStart ?? message.length
    const end = el.selectionEnd ?? message.length
    const next = message.slice(0, start) + token + message.slice(end)
    setMessage(next.slice(0, MAX))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  async function sendMessage(raw?: string) {
    const payload = (raw ?? message).trim()
    if (!payload || status === 'sending') return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ message: payload }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setLastSent(payload)
      setMessage('')
      setStatus('sent')
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Error'
      setErrorMsg(err)
      setStatus('error')
    }
  }

  async function sendFigureOnly(tag: string) {
    await sendMessage(`:${tag}:`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />
      <div className="blob blob-d" />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
        <div className="glass relative flex w-full max-w-6xl flex-1 overflow-hidden rounded-[36px]">
          <span className="sheen" />
          <Sidebar />

          <main className="relative flex flex-1 flex-col px-6 py-10 sm:px-14 sm:py-16">
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
              <header className="mb-8">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-5xl">
                  Matriz <span className="gradient-text">LED</span>
                </h1>
                <h2 className="mt-1 text-4xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-5xl">
                  ¿Qué querés <span className="gradient-text">mostrar</span>?
                </h2>
                <p className="mt-4 max-w-md text-sm text-zinc-400">
                  Escribí un mensaje y se va a desplazar en tiempo real sobre la matriz de LEDs 8×8 del Arduino. Sumá figuras desde el selector o elegí un ejemplo de abajo.
                </p>
              </header>

              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => sendMessage(s.payload)}
                    className="glass-soft group flex h-32 flex-col justify-between rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <span className="text-[11px] font-medium leading-tight text-zinc-200">
                      {s.title}
                    </span>
                    <span className="text-zinc-400 transition group-hover:text-rose-300">
                      {s.icon}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mb-6 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <IconRefresh />
                <button
                  onClick={() => {/* decorativo */}}
                  className="hover:text-zinc-300"
                >
                  Actualizar sugerencias
                </button>
              </div>

              <div className="glass-soft relative rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                    onKeyDown={onKeyDown}
                    placeholder="Escribí el mensaje para el Arduino..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
                  />
                  <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-200">
                    <IconGlobe />
                    Arduino UNO R4
                    <IconChevron />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-zinc-400" ref={pickerRef}>
                    <button
                      onClick={() => setShowPicker((v) => !v)}
                      className="flex items-center gap-1.5 transition hover:text-rose-300"
                    >
                      <IconPlusCircle /> Figuras
                    </button>

                    {showPicker && (
                      <div className="glass absolute bottom-16 left-4 z-30 grid w-[320px] grid-cols-4 gap-2 rounded-2xl p-3 shadow-xl">
                        {FIGURES.map((f) => (
                          <div key={f.tag} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => insertTag(f.tag)}
                              title={`Insertar :${f.tag}:`}
                              className="glass-soft flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition hover:-translate-y-0.5"
                            >
                              {f.glyph}
                            </button>
                            <button
                              onClick={() => sendFigureOnly(f.tag)}
                              className="text-[10px] text-zinc-400 hover:text-rose-300"
                              title={`Enviar solo :${f.tag}:`}
                            >
                              {f.label} ↗
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-500">
                      {message.length}/{MAX}
                    </span>
                    <button
                      onClick={() => sendMessage()}
                      disabled={status === 'sending' || !message.trim()}
                      className="btn-send flex h-9 w-9 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Enviar"
                    >
                      {status === 'sending' ? <Spinner /> : <IconArrowRight />}
                    </button>
                  </div>
                </div>
              </div>

              <StatusBar status={status} error={errorMsg} lastSent={lastSent} />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="hidden w-16 flex-col items-center justify-between border-r border-white/10 bg-white/[0.03] py-5 backdrop-blur-xl sm:flex">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 shadow-md">
          <Logo />
        </div>
        <SideButton><IconPlus /></SideButton>
        <SideButton><IconSearch /></SideButton>
        <SideButton><IconHome /></SideButton>
        <SideButton><IconFolder /></SideButton>
        <SideButton><IconClock /></SideButton>
      </div>
      <div className="flex flex-col items-center gap-3">
        <SideButton><IconSettings /></SideButton>
        <div className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/15"
          style={{
            background:
              'radial-gradient(120% 100% at 20% 10%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, #7f1d1d 0%, #450a0a 60%, #1c0606 100%)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.3) inset, 0 -2px 6px rgba(0,0,0,0.45) inset, 0 6px 14px -6px rgba(127,29,29,0.7)',
          }}
        />
      </div>
    </aside>
  )
}

function SideButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100">
      {children}
    </button>
  )
}

function StatusBar({
  status,
  error,
  lastSent,
}: {
  status: Status
  error: string
  lastSent: string | null
}) {
  if (status === 'sending')
    return (
      <p className="mt-4 text-center text-xs text-zinc-400">
        Enviando a la matriz de LEDs...
      </p>
    )
  if (status === 'sent')
    return (
      <p className="mt-4 text-center text-xs text-emerald-400">
        ✓ Mensaje entregado{lastSent ? ` — "${lastSent}"` : ''}
      </p>
    )
  if (status === 'error')
    return (
      <p className="mt-4 text-center text-xs text-rose-400">
        No se pudo conectar con la API: {error}
      </p>
    )
  return lastSent ? (
    <p className="mt-4 text-center text-[11px] text-zinc-500">
      Último mensaje en la matriz: <span className="text-zinc-300">{lastSent}</span>
    </p>
  ) : (
    <div className="mt-4 h-4" />
  )
}

/* ----------------------- ICONS ----------------------- */

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h2M15 12h2M12 7v2M12 15v2" strokeLinecap="round" />
    </svg>
  )
}
const stroke = 'stroke-current'
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={stroke}>
      <path d={d} />
    </svg>
  )
}
function IconPlus() { return <Icon d="M12 5v14M5 12h14" /> }
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
function IconHome() { return <Icon d="M3 11.5 12 4l9 7.5M5 10v10h14V10" /> }
function IconFolder() { return <Icon d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /> }
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </svg>
  )
}
function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1.4 3.2A8 8 0 0 1 21 12Z" />
    </svg>
  )
}
function IconSliders() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h14M18 18h2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}
function IconChevron() {
  return <Icon d="m6 9 6 6 6-6" size={12} />
}
function IconPlusCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}
function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

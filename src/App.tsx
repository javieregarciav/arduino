import { useEffect, useRef, useState } from 'react'

const API_URL = 'https://7i3wbeouq2.execute-api.us-east-1.amazonaws.com/message'

type Figure = { tag: string; label: string; glyph: string }

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

const SUGGESTIONS: { title: string; payload: string }[] = [
  { title: 'Mostrar “Hola mundo” con cara feliz', payload: 'Hola mundo :feliz:' },
  { title: 'Mensaje de bienvenida con corazón', payload: 'Bienvenido :corazon:' },
  { title: 'Confirmar sistema activo', payload: 'Sistema listo :ok:' },
  { title: 'Animar flecha hacia la derecha', payload: 'Activo :flecha:' },
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
      setErrorMsg(e instanceof Error ? e.message : 'Error')
      setStatus('error')
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className="warm-glow" />
      <div className="grain" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6">
        {/* TOP BAR */}
        <header className="fade-up flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Matriz<span className="text-amber-500">LED</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-700">
              <span className="text-base leading-none">🇦🇷</span>
              ES
            </div>
            <a
              href="https://github.com/javieregarciav/arduino"
              target="_blank"
              rel="noreferrer"
              className="pill rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-800"
            >
              Repo
            </a>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex flex-1 flex-col items-center justify-center py-10">
          <h1 className="fade-up fade-up-d1 text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px]">
            ¿Qué querés mostrar?
          </h1>

          {/* INPUT CARD */}
          <div
            ref={pickerRef}
            className="input-card fade-up fade-up-d2 relative mt-6 w-full max-w-xl rounded-2xl p-4"
          >
            {showPicker && (
              <div className="picker-pop popover !absolute bottom-full left-0 z-30 mb-2 grid w-[min(320px,calc(100vw-2.5rem))] grid-cols-4 gap-1 rounded-2xl p-2">
                {FIGURES.map((f) => (
                  <button
                    key={f.tag}
                    onClick={() => { insertTag(f.tag); setShowPicker(false) }}
                    title={`Insertar :${f.tag}:`}
                    className="group flex flex-col items-center gap-0.5 rounded-xl p-2 transition hover:bg-zinc-100"
                  >
                    <span className="text-2xl">{f.glyph}</span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-800">{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
              onKeyDown={onKeyDown}
              placeholder="Escribí tu mensaje..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="pill flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-zinc-700">
                  <IconChip />
                  Arduino R4
                  <IconChevron />
                </div>
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className="icon-btn flex h-7 w-7 items-center justify-center rounded-full"
                  aria-label="Figuras"
                  title="Insertar figura"
                >
                  <IconGlobe />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="hidden text-[11px] text-zinc-400 sm:inline">
                  {message.length}/{MAX}
                </span>
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className="icon-btn flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label="Adjuntar figura"
                  title="Insertar figura"
                >
                  <IconPaperclip />
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={status === 'sending' || !message.trim()}
                  className="btn-send flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label="Enviar"
                >
                  {status === 'sending' ? <Spinner /> : <IconArrowUp />}
                </button>
              </div>
            </div>
          </div>

          {/* EXAMPLES */}
          <div className="mt-8 flex w-full max-w-xl flex-col items-start gap-2">
            <p className="fade-up fade-up-d3 text-xs font-semibold text-zinc-800">Ejemplos:</p>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => sendMessage(s.payload)}
                  style={{ animationDelay: `${0.24 + i * 0.05}s` }}
                  className="suggestion-pill fade-up flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-zinc-800"
                >
                  {s.title}
                  <IconChevronRight />
                </button>
              ))}
            </div>
          </div>

          <StatusBar status={status} error={errorMsg} lastSent={lastSent} />
        </main>

        {/* FOOTER */}
        <footer className="fade-up fade-up-d6 flex items-center justify-between pt-6 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <a className="icon-btn rounded-md p-1.5" href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><IconX /></a>
            <a className="icon-btn rounded-md p-1.5" href="https://github.com/javieregarciav/arduino" target="_blank" rel="noreferrer" aria-label="GitHub"><IconGithub /></a>
          </div>
          <div className="flex items-center gap-3">
            <span>Hecho con Arduino UNO R4</span>
            <span className="text-zinc-300">/</span>
            <span>API en AWS</span>
          </div>
        </footer>
      </div>
    </div>
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
    return <p className="mt-6 text-center text-xs text-zinc-500">Enviando a la matriz...</p>
  if (status === 'sent')
    return (
      <p className="mt-6 text-center text-xs text-emerald-700">
        ✓ Mensaje entregado{lastSent ? ` — "${lastSent}"` : ''}
      </p>
    )
  if (status === 'error')
    return <p className="mt-6 text-center text-xs text-rose-700">No se pudo conectar con la API: {error}</p>
  return lastSent ? (
    <p className="mt-6 text-center text-[11px] text-zinc-500">
      Último mensaje: <span className="text-zinc-800">{lastSent}</span>
    </p>
  ) : (
    <div className="mt-6 h-4" />
  )
}

/* ----------------- ICONS ----------------- */

function LogoMark() {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-md"
      style={{
        background: 'linear-gradient(135deg, #18181b 0%, #3f3f46 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 6px -2px rgba(0,0,0,0.3)',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <circle cx="5" cy="5" r="1.5" />
        <circle cx="19" cy="5" r="1.5" />
        <circle cx="5" cy="19" r="1.5" />
        <circle cx="19" cy="19" r="1.5" />
      </svg>
    </span>
  )
}
function IconChip() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}
function IconPaperclip() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.4 11.1 12.3 20.2a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.4-8.4" />
    </svg>
  )
}
function IconArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}
function IconChevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 3h3l-7.5 8.6L22 21h-6.8l-5.3-6.6L3.8 21H1l8-9.2L1.5 3h7l4.8 6L18 3Zm-1.2 16h1.7L7.3 5H5.5l11.3 14Z" />
    </svg>
  )
}
function IconGithub() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.5-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2.1.1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.2 5.7.4.3.8 1 .8 2v3c0 .3.2.6.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5Z" />
    </svg>
  )
}
function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

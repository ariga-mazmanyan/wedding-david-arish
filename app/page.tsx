'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowDown, Check, Clock3, MapPin, Send, Volume2, VolumeX, Music } from 'lucide-react'

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const calendarWeek = [
  { day: 'Երկ', date: '02' },
  { day: 'Երք', date: '03' },
  { day: 'Չրք', date: '04' },
  { day: 'Հնգ', date: '05' },
  { day: 'Ուրբ', date: '06' },
  { day: 'Շբթ', date: '07', isWedding: true },
  { day: 'Կիր', date: '08' },
]

export default function Page() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [side, setSide] = useState<'bride' | 'groom'>('groom')
  const [attendance, setAttendance] = useState<'coming' | 'declined'>('coming')
  const [fullName, setFullName] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [guestNames, setGuestNames] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const ytPlayerRef = useRef<any>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const handleRsvpSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const payload = {
      fullName,
      side: side === 'groom' ? 'Փեսայի կողմ' : 'Հարսի կողմ',
      attendance: attendance === 'coming' ? 'Մենք կգանք' : 'Չենք կարող գալ',
      guestCount: attendance === 'coming' ? (guestCount || '1') : '0',
      guestNames: attendance === 'coming' ? (guestNames || '—') : '—',
      dateFormatted: new Date().toLocaleString('hy-AM', { timeZone: 'Asia/Yerevan' }),
    }

    try {
      // 1. Direct send to Google Apps Script Webhook
      await fetch('https://script.google.com/macros/s/AKfycbwbY6DchTWmNwxdjC5WdJnjwGp5W8L1N3noahJdEtc4DBnqZVn3kFhlXwpXPkmhU4s43Q/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      })

      // 2. Also send to local API route backup
      fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})

      setSubmitted(true)
    } catch {
      setSubmitted(true) // Graceful fallback
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    const weddingDate = new Date('2026-11-07T00:00:00+04:00').getTime()

    const calculateTime = () => {
      const now = new Date().getTime()
      const diff = weddingDate - now

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize YouTube Iframe Player for Elliot James Reay - I Think They Call This Love
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.YT) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
      }

      const createPlayer = () => {
        try {
          ytPlayerRef.current = new window.YT.Player('youtube-audio-frame', {
            height: '0',
            width: '0',
            videoId: 'e1mOmdykmwI',
            playerVars: {
              autoplay: 1,
              controls: 0,
              loop: 1,
              playlist: 'e1mOmdykmwI',
              playsinline: 1,
            },
            events: {
              onReady: (event: any) => {
                try {
                  event.target.playVideo()
                } catch {
                  // Handled by user interaction below
                }
              },
              onStateChange: (event: any) => {
                if (event.data === 1) {
                  setIsPlaying(true)
                } else if (event.data === 2 || event.data === 0) {
                  setIsPlaying(false)
                }
              },
            },
          })
        } catch (err) {
          console.log('YouTube player initialization:', err)
        }
      }

      if (window.YT && window.YT.Player) {
        createPlayer()
      } else {
        window.onYouTubeIframeAPIReady = createPlayer
      }
    }
  }, [])

  // Auto-start music on first user interaction if browser blocked initial autoplay
  useEffect(() => {
    const handleAutoPlay = () => {
      if (ytPlayerRef.current && ytPlayerRef.current.playVideo) {
        ytPlayerRef.current.playVideo()
      }
      window.removeEventListener('click', handleAutoPlay)
      window.removeEventListener('touchstart', handleAutoPlay)
      window.removeEventListener('scroll', handleAutoPlay)
      window.removeEventListener('keydown', handleAutoPlay)
    }

    window.addEventListener('click', handleAutoPlay, { once: true })
    window.addEventListener('touchstart', handleAutoPlay, { once: true })
    window.addEventListener('scroll', handleAutoPlay, { once: true })
    window.addEventListener('keydown', handleAutoPlay, { once: true })

    return () => {
      window.removeEventListener('click', handleAutoPlay)
      window.removeEventListener('touchstart', handleAutoPlay)
      window.removeEventListener('scroll', handleAutoPlay)
      window.removeEventListener('keydown', handleAutoPlay)
    }
  }, [])

  const toggleMusic = () => {
    if (ytPlayerRef.current && ytPlayerRef.current.playVideo) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo()
        setIsPlaying(false)
      } else {
        ytPlayerRef.current.playVideo()
        setIsPlaying(true)
      }
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* Static Fixed Background for Ceremony and subsequent sections */}
      <div className="fixed inset-0 z-0 bg-[url('/ceremony-bg.jpg')] bg-cover bg-[position:center_top] opacity-80" aria-hidden="true" />
      <div className="fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(248,245,239,.88)_0%,rgba(248,245,239,.55)_25%,rgba(248,245,239,.65)_60%,rgba(248,245,239,.94)_100%)]" aria-hidden="true" />

      <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.22em] md:px-12">
        <a href="#top" className="font-serif text-2xl font-light tracking-[0.12em] text-primary">D <span className="italic text-accent">&</span> A</a>
        <div className="hidden gap-8 md:flex"><a href="#details" className="transition-opacity hover:opacity-60">Details</a><a href="#schedule" className="transition-opacity hover:opacity-60">Schedule</a><a href="#rsvp" className="transition-opacity hover:opacity-60">RSVP</a></div>
        <span className="font-mono text-[10px] text-muted-foreground">07 · 11 · 26</span>
      </nav>

      <section id="top" className="relative z-10 flex min-h-[100svh] flex-col justify-between overflow-hidden bg-background px-6 pt-16 pb-10 text-center md:pt-20 md:pb-14">
        <div className="absolute inset-0 bg-[url('/hero-mobile.jpg')] md:bg-[url('/hero.jpg')] bg-cover bg-[position:88%_center] md:bg-[position:88%_center] opacity-90" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,245,239,.65)_0%,rgba(248,245,239,.12)_25%,rgba(248,245,239,.15)_45%,rgba(248,245,239,.82)_70%,rgba(248,245,239,.96)_100%)] md:bg-[linear-gradient(180deg,rgba(248,245,239,.55)_0%,rgba(248,245,239,.12)_25%,rgba(248,245,239,.80)_70%,rgba(248,245,239,.96)_100%)]" aria-hidden="true" />

        {/* Top: Header on first page only */}
        <div className="relative z-10 pt-2 sm:pt-4">
          <p className="animate-fade-up font-armenian-sans text-base font-bold uppercase tracking-[0.24em] text-accent sm:text-lg md:text-xl">
            Հարսանեկան հրավիրատոմս
          </p>
        </div>

        {/* Open space where faces are clearly visible */}
        <div className="min-h-[8rem] sm:min-h-[11rem] md:min-h-[14rem]" aria-hidden="true" />

        {/* Bottom: Lowered grand names, date, and scroll button */}
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-3 sm:gap-4">
          {/* Couple Names - Grand & Elegant */}
          <h1 className="animate-fade-up font-dzeragir text-7xl leading-[1.05] tracking-normal text-primary drop-shadow-sm sm:text-8xl md:text-9xl lg:text-[9.5rem]">
            Դավիթ <span className="font-dzeragir text-accent text-[0.85em] mx-1 md:mx-2 inline-block">և</span> Արիշ
          </h1>

          {/* Decorative Divider */}
          <div className="flex items-center gap-3 text-accent/70 pt-0.5">
            <span className="h-px w-12 sm:w-20 bg-primary/25" />
            <span className="text-[10px]">✦</span>
            <span className="h-px w-12 sm:w-20 bg-primary/25" />
          </div>

          {/* Date */}
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <p className="font-armenian-serif text-base tracking-[0.18em] text-primary sm:text-lg font-medium">
              Շաբաթ · Նոյեմբերի 7, 2026
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground sm:text-sm">
              Saturday · November 07, 2026
            </p>
          </div>

          {/* Scroll Down Arrow Button */}
          <a 
            href="#details" 
            aria-label="Scroll to event details" 
            className="group mt-3 flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-white/50 text-primary backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground shadow-xs animate-bounce"
          >
            <ArrowDown size={16} strokeWidth={1.5} />
          </a>
        </div>
      </section>

      <section id="details" className="relative z-10 flex min-h-[100svh] flex-col justify-between overflow-hidden bg-background px-6 pt-16 pb-20 text-center md:px-12 md:pt-24 md:pb-28">
        <div className="absolute inset-0 bg-[url('/page2-bg.jpg')] bg-cover bg-[position:center_top]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,245,239,.82)_0%,rgba(248,245,239,.18)_18%,rgba(248,245,239,.0)_35%,rgba(248,245,239,.45)_58%,rgba(248,245,239,.75)_75%,rgba(248,245,239,.92)_100%)]" aria-hidden="true" />

        {/* Top: Greeting */}
        <div className="relative z-10 mx-auto max-w-3xl">
          <h2 className="font-dzeragir text-5xl leading-tight text-primary sm:text-6xl md:text-8xl">
            Սիրելի հյուրեր,
          </h2>
        </div>

        {/* Center: Open spacing to clearly see both faces */}
        <div className="min-h-[17rem] sm:min-h-[22rem] md:min-h-[26rem]" aria-hidden="true" />

        {/* Bottom: Lowered invitation text and Calendar */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/45 bg-white/40 px-6 py-5 text-center shadow-xs backdrop-blur-[4px] sm:px-8 sm:py-6">
            <p className="font-dzeragir text-2xl leading-relaxed text-primary drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] sm:text-3xl md:text-4xl">
              Մեծ սիրով հրավիրում ենք ձեզ՝<br />
              միասին կիսելու մեր կյանքի ամենակարևոր օրվա<br />
              անմոռանալի ակնթարթներն ու ջերմությունը
            </p>
          </div>

          {/* Wedding Date Calendar Strip */}
          <div className="mt-12 flex w-full max-w-xl flex-col items-center border-t border-primary/20 pt-10">
            <h3 className="font-dzeragir text-5xl text-primary sm:text-6xl md:text-7xl">
              Նոյեմբեր
            </h3>
            <div className="my-6 h-8 w-px bg-primary/30" />
            <div className="grid w-full grid-cols-7 gap-1 text-center sm:gap-4 md:gap-6">
              {calendarWeek.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-4">
                  <span className="font-armenian-sans text-xs font-medium text-muted-foreground sm:text-sm">{item.day}</span>
                  {item.isWedding ? (
                    <div className="relative -mt-1 flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
                      <svg viewBox="0 0 64 64" fill="none" className="absolute inset-0 h-full w-full text-accent" xmlns="http://www.w3.org/2000/svg">
                        {/* Ring Band */}
                        <circle cx="36" cy="36" r="21" stroke="currentColor" strokeWidth="1.6" strokeDasharray="112 22" strokeDashoffset="18" />
                        {/* Diamond Gem on top left */}
                        <g transform="translate(16, 7) rotate(-22)">
                          <polygon points="5,0 11,0 15,5 8,14 1,5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.3" />
                          <polyline points="5,0 8,14 11,0" fill="none" stroke="currentColor" strokeWidth="1" />
                          <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1" />
                        </g>
                      </svg>
                      <span className="relative translate-x-0.5 translate-y-0.5 font-mono text-xl font-bold text-accent sm:text-2xl">{item.date}</span>
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
                      <span className="font-mono text-lg font-normal text-primary/80 sm:text-xl">{item.date}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Next Page Scroll Arrow */}
          <a href="#schedule" aria-label="Scroll to schedule details" className="mt-10 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 text-primary transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground"><ArrowDown size={16} strokeWidth={1.5} /></a>
        </div>
      </section>

      <section id="schedule" className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pt-12 pb-16 text-center md:px-12 md:pt-16 md:pb-20">
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          {/* Title */}
          <h2 className="-mt-2 font-dzeragir text-5xl leading-tight text-primary sm:text-6xl md:text-7xl">
            Օրվա ծրագիրը
          </h2>

          {/* Ceremony Header */}
          <p className="mt-3 font-dzeragir text-3xl text-primary md:text-4xl">
            Պսակադրություն
          </p>

          {/* Interlocking Wedding Rings with Floral Leaves Icon */}
          <div className="my-3 flex justify-center">
            <img 
              src="/icon-rings.png" 
              alt="Wedding Rings" 
              className="h-20 w-auto object-contain sm:h-24"
            />
          </div>

          {/* Time */}
          <p className="font-dzeragir text-3xl text-accent sm:text-4xl md:text-5xl">
            14:00
          </p>

          {/* Church Name */}
          <div className="mt-3 flex flex-col items-center gap-0.5">
            <h3 className="font-dzeragir text-2xl leading-snug text-primary sm:text-3xl md:text-4xl">
              Սուրբ Հովհաննես Մկրտիչ եկեղեցի (քաղաք Աբովյան)
            </h3>
            <p className="font-serif text-sm italic text-muted-foreground sm:text-base">
              Saint John the Baptist Church
            </p>
          </div>

          {/* Church Image Card */}
          <div className="mt-6 w-full max-w-md sm:max-w-lg md:max-w-xl overflow-hidden rounded-2xl border border-primary/20 shadow-md backdrop-blur-xs transition-transform duration-500 hover:scale-[1.01]">
            <img 
              src="/church.jpg" 
              alt="Սուրբ Հովհաննես Մկրտիչ եկեղեցի (քաղաք Աբովյան)" 
              className="w-full h-auto object-cover block"
            />
          </div>

          {/* Yandex Map iframe */}
          <div className="mt-5 flex w-full max-w-md sm:max-w-lg md:max-w-xl flex-col items-center gap-2">
            <p className="font-armenian-sans text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin size={13} className="text-accent" /> Սեղմեք քարտեզին՝ երթուղին տեսնելու համար
            </p>
            <div className="w-full overflow-hidden rounded-2xl border border-primary/20 shadow-sm">
              <iframe 
                src="https://yandex.com/map-widget/v1/?ll=44.629396%2C40.279822&z=17.5&mode=search&ol=biz&oid=244434754384" 
                width="100%" 
                height="220" 
                frameBorder="0" 
                allowFullScreen={true}
                title="Saint John the Baptist Church Location"
                className="w-full border-0"
              />
            </div>
          </div>

          {/* Next Page Scroll Arrow */}
          <div className="mt-8 flex justify-center">
            <a href="#reception" aria-label="Scroll to reception details" className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-white/40 text-primary backdrop-blur-xs shadow-xs transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground"><ArrowDown size={16} strokeWidth={1.5} /></a>
          </div>
        </div>
      </section>

      <section id="reception" className="relative z-10 mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center px-6 pt-10 pb-16 text-center md:px-12 md:pt-14 md:pb-20">
        {/* Reception Header */}
        <h2 className="-mt-4 font-dzeragir text-4xl text-primary sm:-mt-6 sm:text-5xl md:text-6xl">
          Հանդիսություն
        </h2>

        {/* Toasting Champagne Glasses with Botanical Leaves Icon */}
        <div className="my-3 flex justify-center">
          <img 
            src="/icon-champagne.png" 
            alt="Champagne Toast" 
            className="h-20 w-auto object-contain sm:h-24"
          />
        </div>

        {/* Time */}
        <p className="font-dzeragir text-3xl text-accent sm:text-4xl md:text-5xl">
          17:30
        </p>

        {/* Restaurant Name */}
        <div className="mt-3 flex flex-col items-center gap-0.5">
          <h3 className="font-dzeragir text-2xl leading-snug text-primary sm:text-3xl md:text-4xl">
            Աղաբաբյանս ռեստորան
          </h3>
          <p className="font-serif text-base italic text-primary/80 sm:text-lg">
            Aghababyan&apos;s Restaurant
          </p>
        </div>

        {/* Restaurant Image Card */}
        <div className="mt-6 w-full max-w-md sm:max-w-lg md:max-w-xl overflow-hidden rounded-2xl border border-primary/20 shadow-md transition-transform duration-500 hover:scale-[1.01]">
          <img 
            src="/restaurant.jpg" 
            alt="Աղաբաբյանս ռեստորան (Aghababyan's Restaurant)" 
            className="w-full h-auto object-cover block"
          />
        </div>

        {/* Yandex Map iframe */}
        <div className="mt-5 flex w-full max-w-md sm:max-w-lg md:max-w-xl flex-col items-center gap-2">
          <p className="font-armenian-sans text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin size={13} className="text-accent" /> Սեղմեք քարտեզին՝ երթուղին տեսնելու համար
          </p>
          <div className="w-full overflow-hidden rounded-2xl border border-primary/20 shadow-sm">
            <iframe 
              src="https://yandex.com/map-widget/v1/?ll=44.471542%2C40.203387&z=17.5&mode=search&ol=biz&oid=79838143048" 
              width="100%" 
              height="220" 
              frameBorder="0" 
              allowFullScreen={true}
              title="Aghababyan's Restaurant Location"
              className="w-full border-0"
            />
          </div>
        </div>

        {/* Next Page Scroll Arrow */}
        <div className="mt-8 flex justify-center">
          <a href="#countdown" aria-label="Scroll to countdown" className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-white/40 text-primary backdrop-blur-xs shadow-xs transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground"><ArrowDown size={16} strokeWidth={1.5} /></a>
        </div>
      </section>

      <section id="countdown" className="relative z-10 flex min-h-[100svh] flex-col justify-between overflow-hidden bg-background px-6 pt-20 pb-16 text-center md:px-12 md:pt-28 md:pb-20">
        <div className="absolute inset-0 bg-[url('/countdown-bg.jpg')] bg-cover bg-[position:center_25%]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,245,239,.72)_0%,rgba(248,245,239,.08)_20%,rgba(248,245,239,.0)_45%,rgba(248,245,239,.55)_72%,rgba(248,245,239,.90)_100%)]" aria-hidden="true" />

        {/* Top: Header & Countdown directly underneath */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
          <div className="rounded-full border border-white/60 bg-white/45 px-7 py-2 backdrop-blur-md shadow-sm sm:px-10 sm:py-3">
            <h2 className="font-dzeragir text-5xl leading-tight text-accent sm:text-6xl md:text-7xl">
              Հարսանիքին մնաց
            </h2>
          </div>

          {/* Countdown Timer Cards */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-5 md:gap-7">
            <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-primary/15 bg-white/40 p-3 backdrop-blur-[4px] shadow-sm sm:min-w-[6rem] sm:p-4 md:p-5">
              <span className="font-mono text-3xl font-light text-primary sm:text-4xl md:text-5xl">
                {mounted ? String(timeLeft.days).padStart(2, '0') : '00'}
              </span>
              <span className="mt-1 font-armenian-sans text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                Օր
              </span>
            </div>
            <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-primary/15 bg-white/40 p-3 backdrop-blur-[4px] shadow-sm sm:min-w-[6rem] sm:p-4 md:p-5">
              <span className="font-mono text-3xl font-light text-primary sm:text-4xl md:text-5xl">
                {mounted ? String(timeLeft.hours).padStart(2, '0') : '00'}
              </span>
              <span className="mt-1 font-armenian-sans text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                Ժամ
              </span>
            </div>
            <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-primary/15 bg-white/40 p-3 backdrop-blur-[4px] shadow-sm sm:min-w-[6rem] sm:p-4 md:p-5">
              <span className="font-mono text-3xl font-light text-primary sm:text-4xl md:text-5xl">
                {mounted ? String(timeLeft.minutes).padStart(2, '0') : '00'}
              </span>
              <span className="mt-1 font-armenian-sans text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                Րոպե
              </span>
            </div>
            <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-primary/15 bg-white/40 p-3 backdrop-blur-[4px] shadow-sm sm:min-w-[6rem] sm:p-4 md:p-5">
              <span className="font-mono text-3xl font-light text-accent sm:text-4xl md:text-5xl">
                {mounted ? String(timeLeft.seconds).padStart(2, '0') : '00'}
              </span>
              <span className="mt-1 font-armenian-sans text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                Վայրկյան
              </span>
            </div>
          </div>
        </div>

        {/* Middle / Lower: Open space showcasing the couple walking together */}
        <div className="min-h-[16rem] sm:min-h-[22rem] md:min-h-[26rem]" aria-hidden="true" />

        {/* Bottom: Next Arrow */}
        <div className="relative z-10 mx-auto flex justify-center">
          <a href="#rsvp" aria-label="Scroll to RSVP" className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-white/40 text-primary backdrop-blur-xs shadow-xs transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground">
            <ArrowDown size={16} strokeWidth={1.5} />
          </a>
        </div>
      </section>

      <section id="rsvp" className="relative z-10 mx-auto max-w-lg px-6 py-20 md:px-8 md:py-28">
        <div className="rounded-3xl border border-primary/20 bg-white/80 p-6 shadow-lg backdrop-blur-md sm:p-8 md:p-10">
          <h2 className="text-center font-armenian-sans text-xl font-normal leading-relaxed text-primary sm:text-2xl">
            Խնդրում ենք հաստատեք Ձեր ներկայությունը<br />
            <span className="text-muted-foreground text-base sm:text-lg">մինչև հոկտեմբերի 18-ը</span>
          </h2>

          {/* Refined Dress Code Card */}
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-primary/15 bg-white/70 p-5 text-center shadow-xs sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="h-px w-6 bg-primary/20" />
              <p className="font-dzeragir text-3xl text-primary sm:text-4xl">Դրես կոդ</p>
              <span className="h-px w-6 bg-primary/20" />
            </div>

            <p className="font-armenian-sans text-xs leading-relaxed text-muted-foreground sm:text-sm max-w-sm">
              Խնդրում ենք ընտրել Ձեր նախընտրած ցանկացած գույն՝ բացառությամբ սպիտակ երանգների (սպիտակը վերապահված է հարսիկին 🤍)
            </p>

            {/* White Excluded Circle */}
            <div className="mt-1 flex flex-col items-center">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white border border-primary/30 shadow-xs">
                <span className="absolute h-0.5 w-8 rotate-45 bg-red-400/90 rounded-full" />
              </div>
              <span className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">No white</span>
            </div>
          </div>

          {submitted ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-white/80 p-8 text-center shadow-sm">
              <Check className="text-accent" size={36} strokeWidth={1.5} />
              <p className="font-dzeragir text-3xl text-primary sm:text-4xl">Շնորհակալություն</p>
              <p className="font-armenian-sans text-sm text-muted-foreground">Ձեր պատասխանը հաջողությամբ գրանցված է։</p>
            </div>
          ) : (
            <form 
              onSubmit={handleRsvpSubmit} 
              className="mt-8 flex flex-col gap-7 text-left"
            >
              {/* Bride/Groom Side Selection - Groom First */}
              <div className="flex flex-col gap-3.5">
                <label className="group flex cursor-pointer items-center gap-3">
                  <input 
                    type="radio" 
                    name="side" 
                    value="groom" 
                    checked={side === 'groom'} 
                    onChange={() => setSide('groom')} 
                    className="sr-only" 
                  />
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${side === 'groom' ? 'border-primary' : 'border-primary/40 group-hover:border-primary'}`}>
                    {side === 'groom' && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="font-armenian-sans text-sm text-foreground sm:text-base">Փեսայի կողմ</span>
                </label>

                <label className="group flex cursor-pointer items-center gap-3">
                  <input 
                    type="radio" 
                    name="side" 
                    value="bride" 
                    checked={side === 'bride'} 
                    onChange={() => setSide('bride')} 
                    className="sr-only" 
                  />
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${side === 'bride' ? 'border-primary' : 'border-primary/40 group-hover:border-primary'}`}>
                    {side === 'bride' && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="font-armenian-sans text-sm text-foreground sm:text-base">Հարսի կողմ</span>
                </label>
              </div>

              {/* Name Input */}
              <div className="w-full pt-1">
                <label className="sr-only" htmlFor="fullName">Անուն Ազգանուն</label>
                <input 
                  id="fullName" 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Անուն Ազգանուն" 
                  className="w-full border-b border-primary/30 bg-transparent px-1 py-3 font-armenian-sans text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent" 
                />
              </div>

              {/* Attendance Selection */}
              <div className="flex flex-col gap-3.5 pt-1">
                <label className="group flex cursor-pointer items-center gap-3">
                  <input 
                    type="radio" 
                    name="attendance" 
                    value="coming" 
                    checked={attendance === 'coming'} 
                    onChange={() => setAttendance('coming')} 
                    className="sr-only" 
                  />
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${attendance === 'coming' ? 'border-primary' : 'border-primary/40 group-hover:border-primary'}`}>
                    {attendance === 'coming' && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="font-armenian-sans text-sm text-foreground sm:text-base">Մենք կգանք</span>
                </label>

                <label className="group flex cursor-pointer items-center gap-3">
                  <input 
                    type="radio" 
                    name="attendance" 
                    value="declined" 
                    checked={attendance === 'declined'} 
                    onChange={() => setAttendance('declined')} 
                    className="sr-only" 
                  />
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${attendance === 'declined' ? 'border-primary' : 'border-primary/40 group-hover:border-primary'}`}>
                    {attendance === 'declined' && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="font-armenian-sans text-sm text-foreground sm:text-base">Չենք կարող գալ :(</span>
                </label>
              </div>

              {/* Guest Count & Companion Names (shown when attending) */}
              {attendance === 'coming' && (
                <div className="flex flex-col gap-4 pt-1">
                  <div className="w-full">
                    <label className="sr-only" htmlFor="guestCount">Հյուրերի թիվ</label>
                    <input 
                      id="guestCount" 
                      type="number" 
                      min="1" 
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      placeholder="Հյուրերի թիվ (օր.՝ 2)" 
                      className="w-full border-b border-primary/30 bg-transparent px-1 py-3 font-armenian-sans text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent" 
                    />
                  </div>

                  <div className="w-full">
                    <label className="sr-only" htmlFor="guestNames">Ուղեկցող հյուրերի անուն, ազգանուններ</label>
                    <input 
                      id="guestNames" 
                      type="text" 
                      value={guestNames}
                      onChange={(e) => setGuestNames(e.target.value)}
                      placeholder="Ձեզ հետ եկող հյուրերի անուն, ազգանունները" 
                      className="w-full border-b border-primary/30 bg-transparent px-1 py-3 font-armenian-sans text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent" 
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-full border border-primary bg-primary/95 py-4 font-armenian-sans text-base font-medium tracking-[0.08em] text-primary-foreground shadow-sm transition-all duration-300 hover:bg-accent hover:border-accent active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'Ուղարկվում է...' : 'Ուղարկել'}
                </button>
              </div>
            </form>
          )}

          {/* Romantic Footer Note */}
          <div className="mt-12 text-center">
            <p className="font-dzeragir text-3xl leading-snug text-primary sm:text-4xl md:text-5xl">
              Մեր ուրախությունը լիարժեք չի լինի առանց Ձեզ
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-primary/15 bg-white/80 px-6 py-10 text-center backdrop-blur-md">
        <p className="font-dzeragir text-3xl text-primary">Դավիթ և Արիշ</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">07 · 11 · 2026</p>
        <p className="mt-2 flex items-center justify-center gap-1.5 font-serif italic text-xs tracking-wider text-muted-foreground/80 sm:text-sm">
          Made by Arish <span className="text-accent not-italic">♥</span>
        </p>
      </footer>

      {/* Hidden YouTube Audio Player Container */}
      <div id="youtube-audio-frame" className="pointer-events-none fixed -top-[2000px] -left-[2000px] opacity-0" aria-hidden="true" />

      {/* Floating Background Music Toggle */}
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={isPlaying ? 'Անջատել երաժշտությունը' : 'Միացնել երաժշտությունը'}
        className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-white/85 text-primary shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-accent hover:text-accent active:scale-95"
      >
        {isPlaying ? (
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1.5 animate-ping rounded-full bg-accent/25" />
            <Volume2 size={20} className="text-accent" />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <VolumeX size={18} className="text-muted-foreground" />
          </div>
        )}
      </button>
    </main>
  )
}

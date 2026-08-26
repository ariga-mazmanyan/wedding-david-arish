import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Cormorant_Garamond, DM_Mono, DM_Sans, Noto_Serif_Armenian, Noto_Sans_Armenian } from 'next/font/google'
import './globals.css'

const serif = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', display: 'swap' })
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const mono = DM_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-dm-mono', display: 'swap' })
const armenian = Noto_Serif_Armenian({ subsets: ['armenian'], variable: '--font-noto-armenian', display: 'swap' })
const armenianSans = Noto_Sans_Armenian({ subsets: ['armenian'], variable: '--font-noto-sans-armenian', display: 'swap' })
const vrdznagir = localFont({
  src: '../public/fonts/Vrdznagir.otf',
  variable: '--font-vrdznagir',
  display: 'swap',
})
const shkDzeragir = localFont({
  src: '../public/fonts/SHK_Dzeragir.otf',
  variable: '--font-dzeragir',
  display: 'swap',
})
const sosBanff = localFont({
  src: '../public/fonts/SOSBANFF_U.ttf',
  variable: '--font-sosbanff',
  display: 'swap',
})
const miamiWriting = localFont({
  src: '../public/fonts/miamiwriting.ttf',
  variable: '--font-miami',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Դավիթ և Արիշ · Our Wedding Day',
  description: 'Join Davit and Arish to celebrate their wedding day.',
  generator: 'v0.app',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f8f5ef', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="hy" className={`${serif.variable} ${sans.variable} ${mono.variable} ${armenian.variable} ${armenianSans.variable} ${vrdznagir.variable} ${shkDzeragir.variable} ${sosBanff.variable} ${miamiWriting.variable}`}><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}

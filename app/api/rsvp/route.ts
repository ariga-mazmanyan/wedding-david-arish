import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbwbY6DchTWmNwxdjC5WdJnjwGp5W8L1N3noahJdEtc4DBnqZVn3kFhlXwpXPkmhU4s43Q/exec'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, side, attendance, guestCount, guestNames } = body

    if (!fullName || !attendance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newRsvp = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('hy-AM', { timeZone: 'Asia/Yerevan' }),
      fullName,
      side: side === 'groom' ? 'Փեսայի կողմ' : 'Հարսի կողմ',
      attendance: attendance === 'coming' ? 'Մենք կգանք' : 'Չենք կարող գալ',
      guestCount: attendance === 'coming' ? (guestCount || '1') : '0',
      guestNames: attendance === 'coming' ? (guestNames || '—') : '—',
    }

    // 1. Local backup save to guarantee no lost responses
    try {
      const dataDir = path.join(process.cwd(), 'data')
      const filePath = path.join(dataDir, 'rsvps.json')
      
      await fs.mkdir(dataDir, { recursive: true })
      let existingData = []
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8')
        existingData = JSON.parse(fileContent)
      } catch {
        existingData = []
      }
      
      existingData.push(newRsvp)
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf-8')
    } catch (fsErr) {
      console.error('Local backup error:', fsErr)
    }

    // 2. Google Sheets Webhook forwarding
    if (GOOGLE_SHEET_URL) {
      try {
        await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRsvp),
          redirect: 'follow',
        })
      } catch (sheetErr) {
        console.error('Google Sheet forwarding error:', sheetErr)
      }
    }

    return NextResponse.json({ success: true, data: newRsvp })
  } catch (err) {
    console.error('RSVP API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'rsvps.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    return NextResponse.json({ rsvps: data })
  } catch {
    return NextResponse.json({ rsvps: [] })
  }
}

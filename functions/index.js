import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'

// SMTP credentials are stored as Firebase secrets (set via the CLI — see
// PHASE3-EMAIL.md). Works with any SMTP provider: Gmail app password,
// SendGrid, Mailgun, Brevo, etc.
const SMTP_HOST = defineSecret('SMTP_HOST')
const SMTP_PORT = defineSecret('SMTP_PORT')
const SMTP_USER = defineSecret('SMTP_USER')
const SMTP_PASS = defineSecret('SMTP_PASS')
const SMTP_FROM = defineSecret('SMTP_FROM')

initializeApp()
const db = getFirestore()

// Returns "YYYY-MM-DD" for "now" in the given IANA timezone.
function dateKeyInTz(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parts // en-CA already yields YYYY-MM-DD
}

function buildEmail(name, stats) {
  const { total, done } = stats
  const pct = total ? Math.round((done / total) * 100) : 0
  const greeting = name ? `Hi ${name},` : 'Hi,'
  const line = total === 0
    ? "You didn't add any tasks today. Fresh start tomorrow!"
    : done === total
      ? `You completed all ${total} tasks today — perfect day! 🎉`
      : `You completed ${done} of ${total} tasks today (${pct}%).`

  const text = `${greeting}\n\n${line}\n\nKeep it up,\nDaily`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="margin:0 0 4px">Your day on Daily</h2>
      <p style="color:#555;margin:0 0 20px">${greeting}</p>
      <div style="background:#f4f4fb;border-radius:14px;padding:24px;text-align:center">
        <div style="font-size:44px;font-weight:800;color:#7c5cff">${pct}%</div>
        <div style="color:#666;font-size:14px">${done} of ${total} tasks completed</div>
      </div>
      <p style="color:#333;margin:20px 0 0">${line}</p>
      <p style="color:#999;font-size:12px;margin-top:28px">Sent by Daily. Turn this off anytime in the app.</p>
    </div>`
  return { text, html }
}

// Runs every hour; emails each user whose local time is ~20:00 (8pm) so
// everyone gets their summary in the evening regardless of timezone.
export const dailySummary = onSchedule(
  {
    schedule: 'every 60 minutes',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM],
  },
  async () => {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port: Number(SMTP_PORT.value()),
      secure: Number(SMTP_PORT.value()) === 465,
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
    })

    const usersSnap = await db.collection('users').where('notify', '==', true).get()

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data()
      if (!u.email) continue

      // Only send at the user's local 8pm hour.
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: u.tz || 'UTC',
          hour: 'numeric',
          hour12: false,
        }).format(new Date()),
      )
      if (hour !== 20) continue

      const dayKey = dateKeyInTz(u.tz)
      const todaySnap = await userDoc.ref
        .collection('todos')
        .where('date', '==', dayKey)
        .get()

      let total = 0
      let done = 0
      todaySnap.forEach((t) => {
        total += 1
        if (t.data().done) done += 1
      })

      const { text, html } = buildEmail(u.displayName, { total, done })
      try {
        await transporter.sendMail({
          from: SMTP_FROM.value(),
          to: u.email,
          subject: `Your day on Daily — ${done}/${total} done`,
          text,
          html,
        })
      } catch (e) {
        console.error(`Failed to email ${u.email}:`, e?.message)
      }
    }
  },
)

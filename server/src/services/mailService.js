import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

// Lazily created — no point building a transport (or failing on missing
// config) until the first email actually needs to be sent.
let transporter = null
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    })
  }
  return transporter
}

// Exported as a mutable object (not a plain named function) specifically
// so tests can mock it the same way every Model.method is mocked
// throughout this codebase's test suite — a plain ESM named export is a
// frozen live binding and can't be reassigned from a test file.
//
// If SMTP isn't configured (e.g. local dev, or before the product owner
// has chosen/set up a provider), sendPasswordResetEmail logs the reset
// link instead of attempting to send — development and manual testing
// keep working without real email credentials. In production,
// `env.isEmailConfigured` should be true; if it isn't, this is the loud,
// visible signal that forgot-password is silently non-functional in a
// real environment.
export const mailService = {
  async sendPasswordResetEmail(toEmail, resetUrl) {
    if (!env.isEmailConfigured) {
      console.warn(
        `[mailService] SMTP not configured — password reset email NOT sent. ` +
          `Reset link for ${toEmail}: ${resetUrl}`
      )
      return
    }

    await getTransporter().sendMail({
      from: env.smtpFrom,
      to: toEmail,
      subject: 'Reset your Cairn password',
      text: `Someone requested a password reset for your Cairn account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email — your password will not be changed.`,
      html: `<p>Someone requested a password reset for your Cairn account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email — your password will not be changed.</p>`,
    })
  },
}

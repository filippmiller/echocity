import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { isEmailDeliveryConfigured, sendEmail } from '@/modules/email/resend'
import { logger } from '@/lib/logger'

interface SmokeTestResult {
  sent: boolean
  configured: boolean
  message: string
}

export async function POST(): Promise<NextResponse<SmokeTestResult>> {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { sent: false, configured: false, message: 'Unauthorized' },
      { status: 401 },
    )
  }

  if (!isEmailDeliveryConfigured()) {
    return NextResponse.json(
      {
        sent: false,
        configured: false,
        message:
          'Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.',
      },
      { status: 200 },
    )
  }

  try {
    const timestamp = new Date().toISOString()
    await sendEmail({
      to: session.email,
      subject: 'EchoCity email smoke test',
      html: `<p>This is a test email sent from the EchoCity admin panel at ${timestamp}.</p>`,
      text: `This is a test email sent from the EchoCity admin panel at ${timestamp}.`,
    })

    logger.info('admin.email.smoke.sent', { adminId: session.userId, email: session.email })

    return NextResponse.json(
      {
        sent: true,
        configured: true,
        message: `Test email sent to ${session.email}`,
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed'
    logger.error('admin.email.smoke.failed', {
      adminId: session.userId,
      email: session.email,
      error: message,
    })

    return NextResponse.json(
      {
        sent: false,
        configured: true,
        message: `Failed to send test email: ${message}`,
      },
      { status: 502 },
    )
  }
}

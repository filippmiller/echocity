import { isEmailDeliveryConfigured, sendEmail } from '@/modules/email/resend'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!isEmailDeliveryConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Password reset email delivery is not configured')
    }
    return
  }

  const safeUrl = escapeHtml(resetUrl)
  await sendEmail({
    to: email,
    subject: 'Восстановление пароля ГдеСейчас',
    text: [
      'Вы запросили восстановление пароля.',
      'Перейдите по ссылке, чтобы задать новый пароль:',
      resetUrl,
      'Если вы не запрашивали восстановление, просто проигнорируйте это письмо.',
    ].join('\n\n'),
    html: `
      <p>Вы запросили восстановление пароля.</p>
      <p><a href="${safeUrl}">Задать новый пароль</a></p>
      <p>Если вы не запрашивали восстановление, просто проигнорируйте это письмо.</p>
    `,
  })
}

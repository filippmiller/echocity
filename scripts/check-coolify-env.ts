import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type CriticalKey = {
  key: string
  required: boolean
}

const CRITICAL_KEYS: CriticalKey[] = [
  { key: 'DATABASE_URL', required: true },
  { key: 'SESSION_SECRET', required: true },
  { key: 'NEXTAUTH_SECRET', required: true },
  { key: 'NEXTAUTH_URL', required: true },
  { key: 'SUPABASE_URL', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { key: 'SUPABASE_ANON_KEY', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
  { key: 'SUPABASE_USER_PHOTOS_BUCKET', required: true },
  { key: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', required: false },
  { key: 'VAPID_PRIVATE_KEY', required: false },
  { key: 'VAPID_SUBJECT', required: false },
]

function getArg(name: string, fallback?: string): string | undefined {
  const args = process.argv.slice(2)
  const index = args.findIndex((arg) => arg === `--${name}`)
  if (index >= 0 && args[index + 1]) return args[index + 1]
  return fallback
}

function mask(value?: string): string {
  if (!value) return '(missing)'
  if (value.length <= 8) return '***'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function parseEnvLines(text: string): Map<string, string> {
  const env = new Map<string, string>()
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    const key = trimmed.slice(0, separator)
    let value = trimmed.slice(separator + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env.set(key, value)
  }
  return env
}

async function run() {
  const appUuid = getArg('app')
  const context = getArg('context', 'hetzner')
  const host = getArg('host', '89.167.42.128')
  const sshUser = getArg('ssh-user', 'root')
  const envFile =
    getArg('env-file') || `/data/coolify/applications/${appUuid}/.env`

  if (!appUuid) {
    throw new Error('Missing --app <uuid>')
  }

  const envList = await execFileAsync(
    'coolify',
    ['app', 'env', 'list', appUuid, '--context', context, '-s'],
    { maxBuffer: 1024 * 1024 * 4 }
  )

  const store = new Map<string, string>()
  for (const line of envList.stdout.split(/\r?\n/)) {
    const segments = line.split('|').map((part) => part.trim())
    if (segments.length < 4) continue
    const key = segments[2]
    const value = segments[3]
    if (!key || key === 'key') continue
    store.set(key, value.replace(/^'+|'+$/g, ''))
  }

  const remote = await execFileAsync(
    'ssh',
    [
      '-i',
      `${process.env.HOME || process.env.USERPROFILE}\\.ssh\\id_ed25519`,
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'ConnectTimeout=10',
      `${sshUser}@${host}`,
      `cat ${envFile}`,
    ],
    { maxBuffer: 1024 * 1024 * 4 }
  )

  const generated = parseEnvLines(remote.stdout)

  const issues: string[] = []

  for (const { key, required } of CRITICAL_KEYS) {
    const storeValue = store.get(key)
    const generatedValue = generated.get(key)

    if (required && !storeValue) issues.push(`${key}: missing in Coolify store`)
    if (required && !generatedValue) issues.push(`${key}: missing in generated .env`)

    if (storeValue && generatedValue && storeValue !== generatedValue) {
      issues.push(
        `${key}: mismatch store=${mask(storeValue)} generated=${mask(generatedValue)}`
      )
    }
  }

  if (issues.length > 0) {
    console.error('Coolify env consistency check failed:')
    for (const issue of issues) {
      console.error(`- ${issue}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Coolify env consistency check passed for ${appUuid}`)
  for (const { key } of CRITICAL_KEYS) {
    const value = generated.get(key)
    if (value) {
      console.log(`- ${key}: ${mask(value)}`)
    }
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

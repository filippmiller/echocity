/**
 * Script to create the user-photos bucket in Supabase Storage
 * Usage: npx tsx scripts/create-storage-bucket.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env file manually
function loadEnv() {
  try {
    const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8')
    const lines = envFile.split(/\r?\n/)
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) continue
      
      const match = line.match(/^([^=#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  } catch (error) {
    console.error('Error loading .env:', error)
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const BUCKET_NAME = 'user-photos'

async function createBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
    
    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists`)
      return
    }

    // Create bucket
    console.log(`Creating bucket "${BUCKET_NAME}"...`)
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Make bucket public so images can be accessed via URL
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    })

    if (error) {
      console.error('❌ Error creating bucket:', error)
      return
    }

    console.log(`✅ Bucket "${BUCKET_NAME}" created successfully!`)
    console.log('Bucket details:', data)
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createBucket()


/**
 * Test script to upload avatar.jpg to the avatar API
 * Usage: npx tsx scripts/upload-avatar-test.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'

const AVATAR_FILE = join(process.cwd(), 'avatar.jpg')
const API_URL = 'http://localhost:3010/api/profile/avatar'

async function uploadAvatar() {
  try {
    // Read the file
    const fileBuffer = readFileSync(AVATAR_FILE)
    
    // Create FormData
    const formData = new FormData()
    formData.append('file', fileBuffer, {
      filename: 'avatar.jpg',
      contentType: 'image/jpeg',
    })

    // Get session cookie (you'll need to login first and get the cookie)
    // For now, we'll try without auth to see the error
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Avatar uploaded successfully!')
      console.log('Avatar URL:', result.avatarUrl)
    } else {
      console.error('❌ Upload failed:', result.error)
      console.error('Status:', response.status)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

uploadAvatar()


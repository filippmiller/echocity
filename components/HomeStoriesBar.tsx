'use client'

import { useState } from 'react'
import { StoriesBar } from './StoriesBar'
import { StoryViewer } from './StoryViewer'

interface StoryItem {
  id: string
  mediaUrl: string
  mediaType: string
  caption: string | null
  linkOfferId: string | null
  offerTitle: string | null
  viewCount: number
  viewed: boolean
  expiresAt: string
  createdAt: string
}

interface StoryGroup {
  merchantId: string
  merchantName: string
  branchId: string
  branchTitle: string
  stories: StoryItem[]
}

export function HomeStoriesBar() {
  const [viewerState, setViewerState] = useState<{
    open: boolean
    groups: StoryGroup[]
    startIndex: number
  }>({ open: false, groups: [], startIndex: 0 })

  return (
    <>
      <StoriesBar
        onOpenViewer={(groups, startGroupIndex) => {
          setViewerState({ open: true, groups, startIndex: startGroupIndex })
        }}
      />
      {viewerState.open && (
        <StoryViewer
          groups={viewerState.groups}
          startGroupIndex={viewerState.startIndex}
          onClose={() => setViewerState((s) => ({ ...s, open: false }))}
        />
      )}
    </>
  )
}

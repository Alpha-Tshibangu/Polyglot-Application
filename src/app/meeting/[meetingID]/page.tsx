// src/app/meeting/[meetingId]/page.tsx
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// Import the type
import type { VideoCallProps } from '@/components/VideoCall';

// Specify the type for the dynamic import
const VideoCall = dynamic<VideoCallProps>(() => import('@/components/VideoCall'), {
  ssr: false,
});

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params?.meetingId as string;

  return (
    <div className="h-screen w-screen">
      <VideoCall meetingId={meetingId} />
    </div>
  );
}

// src/app/meeting/[meetingId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';

// Import the type
import type { VideoCallProps } from '@/components/VideoCall';

// Specify the type for the dynamic import
const VideoCall = dynamic<VideoCallProps>(() => import('@/components/VideoCall'), {
  ssr: false,
});

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for both possible parameter names
    const meetingId = params?.meetingId || params?.meetingID;
    if (!meetingId) {
      console.log('No meeting ID in params');
      return;
    }

    console.log('Meeting ID:', meetingId);

    // Check if user info exists in localStorage
    const userName = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');
    
    console.log('User info:', { userName, userId });

    if (!userName || !userId) {
      console.log('Redirecting to join page');
      router.push(`/meeting?id=${meetingId}`);
      return;
    }

    setIsLoading(false);
  }, [params, router]);

  if (isLoading) {
    return (
      null
    );
  }

  // Check for both possible parameter names
  const meetingId = params?.meetingId || params?.meetingID;
  if (!meetingId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div>No meeting ID found</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <VideoCall meetingId={meetingId} />
    </div>
  );
}
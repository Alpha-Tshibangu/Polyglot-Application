// src/app/meeting/join/[meetingId]/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import JoinMeetingLoad from '../../../../components/JoingMeetingLoad'

export default function MeetingRedirect({ params }: { params: { meetingId: string } }) {
  const router = useRouter();
  
  // Use useEffect for client-side redirect
  useEffect(() => {
    router.replace(`/meeting?id=${params.meetingId}`);
  }, [params.meetingId, router]);

  // Return loading state while redirect happens
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <JoinMeetingLoad />
    </div>
  );
}
// src/app/meeting/join/[meetingID]/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import JoinMeetingLoad from '@/components/JoinMeetingLoad';

export default function MeetingRedirect() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    router.replace(`/meeting?id=${params.meetingID}`);
  }, [params.meetingID, router]);

  return <JoinMeetingLoad />;
}
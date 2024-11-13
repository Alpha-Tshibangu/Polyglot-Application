// src/app/meeting/page.tsx
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the JoinMeeting component
const JoinMeeting = dynamic(() =>
  import('@/components/JoinMeeting').then((mod) => mod.JoinMeetingWrapper),
  { ssr: false }
);

export default function MeetingLobbyPage() {
  return <JoinMeeting />;
}
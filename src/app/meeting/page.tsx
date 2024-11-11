// src/app/meeting/page.tsx
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the JoinMeeting component to avoid SSR issues
const JoinMeeting = dynamic(() => import('../../components/JoinMeeting'), {
  ssr: false,
});

export default function MeetingLobbyPage() {
  return <JoinMeeting />;
}
// src/app/meeting/[meetingID]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import JoinMeetingLoad from '@/components/JoinMeetingLoad';
import { ErrorBoundary } from 'next/dist/client/components/error-boundary';

// Dynamically import the VideoCall component
const VideoCall = dynamic(() => import('@/components/VideoCall').then(mod => mod.default), {
  loading: () => <JoinMeetingLoad />,
  ssr: false,
});

function ErrorComponent() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <p>Something went wrong...</p>
    </div>
  );
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  useEffect(() => {
    const currentMeetingId = params?.meetingID as string;
    setMeetingId(currentMeetingId);

    if (!currentMeetingId) {
      console.log('No meeting ID in params');
      router.push('/meeting');
      return;
    }

    const userName = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');

    if (!userName || !userId) {
      console.log('Redirecting to join flow');
      router.replace(`/meeting/join/${currentMeetingId}`);
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [params, router]);

  if (isLoading) {
    return <JoinMeetingLoad />;
  }

  if (!isAuthorized || !meetingId) {
    return <JoinMeetingLoad />;
  }

  return (
    <ErrorBoundary errorComponent={ErrorComponent}>
      <div className="h-screen w-screen">
        <VideoCall meetingId={meetingId} />
      </div>
    </ErrorBoundary>
  );
}

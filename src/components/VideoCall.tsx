// src/components/VideoCall.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  StreamVideo,
  StreamCall,
  Call,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { getToken } from '@/app/actions';
import VideoContent from './VideoContent';
import JoinMeetingLoad from './JoingMeetingLoad';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;

export interface VideoCallProps {
  meetingId: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ meetingId }) => {
  const router = useRouter();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    if (!userName || !userId) {
      console.log('Missing user info, redirecting to join page');
      router.push('/meeting');
      return;
    }

    let cleanup = false;

    const initCall = async () => {
      try {
        if (cleanup) return;

        const token = await getToken(userId);

        // Use getOrCreateInstance to prevent multiple clients
        const streamClient = StreamVideoClient.getOrCreateInstance({
          apiKey: API_KEY,
          user: {
            id: userId,
            name: userName,
          },
          token,
        });

        if (cleanup) return;
        setClient(streamClient);

        const streamCall = streamClient.call('default', meetingId);
        await streamCall.join({ create: true });

        if (cleanup) return;
        setCall(streamCall);
      } catch (error) {
        console.error('Failed to initialize call:', error);
        if (!cleanup) {
          setError('Failed to join the meeting. Please try again.');
          setTimeout(() => router.push('/meeting'), 3000);
        }
      }
    };

    initCall();

    return () => {
      cleanup = true;
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [meetingId, router]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }  

  if (!client || !call) {
    return (
      <JoinMeetingLoad />
    );
  }  

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoContent call={call} />
      </StreamCall>
    </StreamVideo>
  );
};

export default VideoCall;

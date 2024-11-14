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
import JoinMeetingLoad from './JoinMeetingLoad';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;

export interface VideoCallProps {
  meetingId: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ meetingId }) => {
  const router = useRouter();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  const handleLeaveCall = async () => {
    if (call) {
      await call.leave();
    }
    if (client) {
      await client.disconnectUser();
    }
    router.push('/meeting');
  };  

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const isVideoEnabled = localStorage.getItem('isVideoEnabled') === 'true';

    if (!userName || !userId) {
      console.log('Missing user info, redirecting to join page');
      router.replace(`/meeting/join/${meetingId}`);
      return;
    }

    let cleanup = false;

    const initCall = async () => {
      try {
        if (cleanup) return;

        const token = await getToken(userId);

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

        if (isVideoEnabled) {
          await streamCall.camera.enable();
        } else {
          await streamCall.camera.disable();
        }

        if (cleanup) return;
        setCall(streamCall);
        setIsMediaLoading(false);

      } catch (error) {
        console.error('Failed to initialize call:', error);
        setIsMediaLoading(false);
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

  if (!client || !call || isMediaLoading) {
    return <JoinMeetingLoad />;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoContent onLeaveCall={handleLeaveCall} />
      </StreamCall>
    </StreamVideo>
  );
};

export default VideoCall;

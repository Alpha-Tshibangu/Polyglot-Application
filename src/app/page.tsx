// src/app/page.tsx
import { Metadata } from 'next';
import ClientOnly from "@/components/ClientOnly";
import { JoinMeetingWrapper } from "@/components/JoinMeeting";

export const metadata: Metadata = {
  title: 'Join Meeting - Polyglot Beta',
  description: 'Join a Polyglot Beta video meeting',
};

export default function JoinMeetingPage() {
  return (
    <ClientOnly>
      <JoinMeetingWrapper />
    </ClientOnly>
  );
}
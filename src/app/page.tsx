// src/app/page.tsx
import ClientOnly from "@/components/ClientOnly";
import { JoinMeetingWrapper } from "@/components/JoinMeeting";

export default function JoinMeetingPage() {
  return (
    <ClientOnly>
      <JoinMeetingWrapper />
    </ClientOnly>
  );
}
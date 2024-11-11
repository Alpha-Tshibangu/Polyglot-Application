// src/app/page.tsx
import ClientOnly from "@/components/ClientOnly";
import JoinMeeting from "../components/JoinMeeting";

export default function JoinMeetingPage() {
  return (
    <ClientOnly>
      <JoinMeeting />
    </ClientOnly>
  );
}
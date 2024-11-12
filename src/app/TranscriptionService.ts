import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

export class TranscriptionService {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isActive = false;
  private participants = new Map<string, StreamVideoParticipant>();
  private onTranscriptionCallback: ((message: { text: string; speaker: StreamVideoParticipant }) => void) | null = null;
  private localParticipantId: string | null = null;
  private isMuted = false;

  constructor(private language: string = 'en-US') {}

  public async start(
    audioStream: MediaStream, 
    localParticipantId: string,
    onTranscription: (message: { text: string; speaker: StreamVideoParticipant }) => void
  ) {
    if (this.isActive) return;
    
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      throw new Error('Browser not supported: audio/webm not supported');
    }

    this.isActive = true;
    this.onTranscriptionCallback = onTranscription;
    this.localParticipantId = localParticipantId;
    
    try {
      await this.setupWebSocket();
      this.setupMediaRecorder(audioStream);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.stop();
      throw error;
    }
  }

  private setupMediaRecorder(stream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    this.mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size > 0 && 
          this.ws?.readyState === WebSocket.OPEN && 
          !this.isMuted) {  // Only send audio data if not muted
        this.ws.send(event.data);
      }
    });

    this.mediaRecorder.start(1000);
  }

  private async setupWebSocket(): Promise<void> {
    const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key is not configured');
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=${this.language}&punctuate=true`,
        ['token', DEEPGRAM_API_KEY]
      );

      this.ws.onopen = () => {
        console.log('Deepgram WebSocket connected');
        resolve();
      };

      this.ws.onmessage = (message) => {
        try {
          const received = JSON.parse(message.data);
          const transcript = received.channel.alternatives[0].transcript;
          
          if (transcript && received.is_final) {
            console.log('Raw transcription:', transcript);
            
            // Get the currently speaking participant or fallback to first participant
            const speaker = Array.from(this.participants.values()).find(p => p.isSpeaking) 
              || Array.from(this.participants.values())[0];
    
            console.log('Selected speaker:', speaker?.name);
    
            if (this.onTranscriptionCallback && speaker) {
              console.log('Calling callback with:', { text: transcript, speaker: speaker.name });
              this.onTranscriptionCallback({
                text: transcript,
                speaker
              });
            } else {
              console.log('No callback or speaker found:', {
                hasCallback: !!this.onTranscriptionCallback,
                hasSpeaker: !!speaker
              });
            }
          }
        } catch (error) {
          console.error('Error processing transcription:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Deepgram WebSocket Error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Deepgram WebSocket closed');
        this.isActive = false;
      };
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public updateParticipants(participants: StreamVideoParticipant[]) {
    this.participants.clear();
    for (const participant of participants) {
      // Don't include muted participants in speaker selection
      if (participant.sessionId === this.localParticipantId && this.isMuted) {
        continue;
      }
      if (participant.isMuted) {
        continue;
      }
      this.participants.set(participant.sessionId, participant);
    }
  }

  public stop() {
    this.isActive = false;
    
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop();
    }
    this.mediaRecorder = null;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.participants.clear();
    this.onTranscriptionCallback = null;
  }
}
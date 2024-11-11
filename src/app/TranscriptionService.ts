import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

export type TranscriptionCallback = (message: { 
  text: string; 
  speaker: StreamVideoParticipant;
}) => void;

export class TranscriptionService {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isActive = false;
  private participants = new Map<string, StreamVideoParticipant>();
  private onTranscriptionCallback: TranscriptionCallback | null = null;

  constructor(private language: string = 'en-US') {}

  public async start(audioStream: MediaStream, onTranscription: TranscriptionCallback) {
    if (this.isActive) return;
    
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      throw new Error('Browser not supported: audio/webm not supported');
    }

    this.isActive = true;
    this.onTranscriptionCallback = onTranscription;
    
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
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
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
            console.log('Transcription received:', transcript);
            
            // Get the currently speaking participant or fallback to first participant
            const speaker = Array.from(this.participants.values()).find(p => p.isSpeaking) 
              || Array.from(this.participants.values())[0];

            if (this.onTranscriptionCallback && speaker) {
              this.onTranscriptionCallback({
                text: transcript,
                speaker
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

  public updateParticipants(participants: StreamVideoParticipant[]) {
    this.participants.clear();
    for (const participant of participants) {
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
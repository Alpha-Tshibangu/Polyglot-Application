class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.bufferSize = 2048;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }
  
    process(inputs, outputs) {
      const input = inputs[0];
      const channel = input[0];
  
      if (!channel) return true;
  
      // Add incoming samples to buffer
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.bufferIndex++] = channel[i];
  
        // When buffer is full, convert and send
        if (this.bufferIndex >= this.bufferSize) {
          const audio16 = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            audio16[j] = Math.max(-32768, Math.min(32767, this.buffer[j] * 32768));
          }
  
          this.port.postMessage(audio16.buffer, [audio16.buffer]);
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }
      }
  
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);
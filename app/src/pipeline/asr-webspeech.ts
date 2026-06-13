/** ASR via the browser Web Speech API — zero-key, runs today. Swap for Deepgram later. */
import type { AsrStream } from './caption-surface-source';

export class WebSpeechAsr implements AsrStream {
  private rec: any = null;
  constructor(private lang = 'en-US') {}

  async start(onChunk: (text: string, isFinal: boolean, confidence: number) => void): Promise<void> {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) throw new Error('Web Speech API not available in this browser');
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        onChunk(r[0].transcript.trim(), r.isFinal, r[0].confidence ?? 0);
      }
    };
    rec.onend = () => { if (this.rec) rec.start(); }; // auto-restart while running
    rec.start();
    this.rec = rec;
  }

  stop(): void {
    const r = this.rec;
    this.rec = null;
    r?.stop();
  }
}

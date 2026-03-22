import OpenAI, { toFile } from 'openai';
import { updateJob } from '../store/jobStore';
import { PipelineArgs } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function runPipeline(
  {jobId, audioFilename, audioBuffer, audioMimetype}: PipelineArgs
): Promise<void> {
  try {
    updateJob(jobId, { status: 'processing' });

    // ── Step 1: Whisper — audio → transcript ──────────────────────────────
    console.log(`[${jobId}] transcribing audio... (${audioFilename}, ${audioMimetype})`);

    const audioFile = await toFile(audioBuffer, audioFilename, {
      type: audioMimetype,
    });

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en',
    });

    const originalText = transcription.text;
    console.log(`[${jobId}] transcript: "${originalText}"`);

    // ── Step 2: fix grammar ──────────────────────────────────────
    console.log(`[${jobId}] correcting grammar...`);

    const correction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a grammar correction assistant. 
The user will provide a spoken transcript. 
Correct any grammatical errors, fix run-on sentences, and improve clarity.
Return only the corrected text — no explanations, no commentary, no quotes.
Preserve the original meaning and tone exactly.`,
        },
        {
          role: 'user',
          content: originalText,
        },
      ],
    });

    const correctedText = correction.choices[0].message.content ?? originalText;
    console.log(`[${jobId}] corrected: "${correctedText}"`);

    // ── Step 3: TTS — corrected text → generate audio ─────────────────────────────
    console.log(`[${jobId}] generating audio...`);

    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: correctedText,
    });

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const outputBuffer = Buffer.from(audioArrayBuffer);

    // ── Done juhu ──────────────────────────────────────────────────────────────
    updateJob(jobId, {
      status: 'done',
      audioBuffer: outputBuffer,
    });

    console.log(`[${jobId}] pipeline complete`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error(`[${jobId}] pipeline failed: ${message}`);
    updateJob(jobId, { status: 'error', error: message });
  }
}

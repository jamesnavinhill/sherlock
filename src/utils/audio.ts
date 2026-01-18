/**
 * Audio utilities for Sherlock AI voice briefings
 */

/**
 * Decodes a base64 string to Uint8Array
 */
export const decodeBase64 = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

/**
 * Decodes raw audio data into an AudioBuffer for playback
 * Assumes 16-bit PCM mono audio at 24kHz
 */
export const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const sampleRate = 24000;
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            // Convert 16-bit PCM to float [-1, 1]
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }

    return buffer;
};

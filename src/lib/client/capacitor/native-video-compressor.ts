import { registerPlugin } from '@capacitor/core';

export interface CompressVideoOptions {
  /** The local file URI of the video to compress (e.g., file://...) */
  fileUri: string;
  /** Target video quality from 0.0 to 1.0 (default 0.7) */
  quality?: number;
  /** Whether to maintain aspect ratio (default true) */
  maintainAspectRatio?: boolean;
  /** Max dimension in pixels (e.g. 1280) */
  maxResolution?: number;
}

export interface CompressVideoResult {
  /** The local file URI of the compressed video */
  fileUri: string;
  /** The size of the compressed video in bytes */
  size: number;
}

export interface NativeVideoCompressorPlugin {
  compress(options: CompressVideoOptions): Promise<CompressVideoResult>;
  cancel(): Promise<void>;
}

export const NativeVideoCompressor = registerPlugin<NativeVideoCompressorPlugin>('NativeVideoCompressor', {
  web: () => ({
    compress: async () => {
      throw new Error('NativeVideoCompressor is not implemented on web. Use browser fallback.');
    },
    cancel: async () => {},
  }),
});

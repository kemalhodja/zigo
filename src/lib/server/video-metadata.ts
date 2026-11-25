/**
 * Server-side lightweight video container & duration inspector (zero native deps).
 *
 * Inspects MP4/MOV/M4V ISO-BMFF magic bytes and parses the `mvhd` atom to verify
 * the real container duration, preventing spoofed client-reported durations on
 * direct signed-URL uploads. Also validates WebM EBML header bytes.
 */

export type VideoBufferInspection = {
  validContainer: boolean;
  container: "mp4" | "webm" | "unknown";
  durationSeconds: number | null;
};

const ISO_BMFF_ATOMS = new Set(["ftyp", "moov", "mdat", "wide", "free", "skip"]);

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > bytes.length) return "";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(bytes[offset + i]!);
  }
  return out;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) return 0;
  return (
    ((bytes[offset]! << 24) >>> 0) +
    (bytes[offset + 1]! << 16) +
    (bytes[offset + 2]! << 8) +
    bytes[offset + 3]!
  );
}

function readUint64BE(bytes: Uint8Array, offset: number): number {
  const high = readUint32BE(bytes, offset);
  const low = readUint32BE(bytes, offset + 4);
  return high * 4294967296 + low;
}

/**
 * Scans an ISO-BMFF byte slice for an `mvhd` box and computes duration in seconds.
 * Works on both faststart MP4/MOV (moov at start) and tail-moov files when given
 * the tail chunk.
 */
export function parseMp4MvhdDurationSeconds(bytes: Uint8Array): number | null {
  if (bytes.length < 32) return null;

  for (let i = 4; i <= bytes.length - 28; i++) {
    // Fast-path byte match for ASCII "mvhd" (0x6d 0x76 0x68 0x64)
    if (
      bytes[i] === 0x6d &&
      bytes[i + 1] === 0x76 &&
      bytes[i + 2] === 0x68 &&
      bytes[i + 3] === 0x64
    ) {
      const boxSize = readUint32BE(bytes, i - 4);
      if (boxSize < 100 || boxSize > 1024) continue;

      const version = bytes[i + 4]!;
      if (version === 0 && i + 24 <= bytes.length) {
        // v0: 1B version + 3B flags + 4B creation + 4B modification + 4B timescale + 4B duration
        const timescale = readUint32BE(bytes, i + 16);
        const duration = readUint32BE(bytes, i + 20);
        if (timescale > 0 && duration > 0 && duration < 0xffffffff) {
          return duration / timescale;
        }
      } else if (version === 1 && i + 36 <= bytes.length) {
        // v1: 1B version + 3B flags + 8B creation + 8B modification + 4B timescale + 8B duration
        const timescale = readUint32BE(bytes, i + 24);
        const duration = readUint64BE(bytes, i + 28);
        if (timescale > 0 && duration > 0 && Number.isFinite(duration)) {
          return duration / timescale;
        }
      }
    }
  }

  return null;
}

/**
 * Validates video container header bytes and extracts MP4/MOV duration if present.
 */
export function inspectVideoHeader(
  headBytes: Uint8Array,
  tailBytes?: Uint8Array | null,
): VideoBufferInspection {
  if (headBytes.length < 12) {
    return { validContainer: false, container: "unknown", durationSeconds: null };
  }

  // WebM / Matroska EBML header: 1A 45 DF A3
  if (
    headBytes[0] === 0x1a &&
    headBytes[1] === 0x45 &&
    headBytes[2] === 0xdf &&
    headBytes[3] === 0xa3
  ) {
    return {
      validContainer: true,
      container: "webm",
      durationSeconds: null,
    };
  }

  // MP4 / MOV / M4V ISO-BMFF container
  const boxType = readAscii(headBytes, 4, 4);
  if (ISO_BMFF_ATOMS.has(boxType)) {
    const headDuration = parseMp4MvhdDurationSeconds(headBytes);
    const tailDuration =
      headDuration === null && tailBytes ? parseMp4MvhdDurationSeconds(tailBytes) : null;
    return {
      validContainer: true,
      container: "mp4",
      durationSeconds: headDuration ?? tailDuration,
    };
  }

  return { validContainer: false, container: "unknown", durationSeconds: null };
}

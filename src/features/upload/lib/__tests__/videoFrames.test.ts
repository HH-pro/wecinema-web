import { describe, expect, it } from "vitest";
import {
  bestCandidateIndex,
  sampleTimes,
  scoreFrame,
  type FrameCandidate,
} from "../videoFrames";

const W = 16;
const H = 9;

function frame(pixel: (x: number, y: number) => number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const v = pixel(x, y);
      data[o] = data[o + 1] = data[o + 2] = v;
      data[o + 3] = 255;
    }
  }
  return data;
}

describe("scoreFrame", () => {
  it("scores black, white and flat frames as unusable", () => {
    expect(scoreFrame(frame(() => 0), W)).toBeCloseTo(0, 5);
    expect(scoreFrame(frame(() => 255), W)).toBeCloseTo(0, 5);
    expect(scoreFrame(frame(() => 128), W)).toBeCloseTo(0, 5);
  });

  it("prefers a detailed, well-exposed frame over a dim one", () => {
    const detailed = scoreFrame(frame((x, y) => ((x + y) % 2 ? 60 : 200)), W);
    const dim = scoreFrame(frame((x, y) => ((x + y) % 2 ? 5 : 30)), W);
    expect(detailed).toBeGreaterThan(0.5);
    expect(detailed).toBeGreaterThan(dim);
  });

  it("handles empty input", () => {
    expect(scoreFrame(new Uint8ClampedArray(0), W)).toBe(0);
  });
});

describe("sampleTimes", () => {
  it("spreads samples inside the video, skipping intro and credits", () => {
    const times = sampleTimes(100, 5);
    expect(times).toEqual([8, 29, 50, 71, 92]);
  });

  it("falls back to a single sample for short or unknown durations", () => {
    expect(sampleTimes(1, 8)).toEqual([0.5]);
    expect(sampleTimes(Number.NaN, 8)).toEqual([0]);
    expect(sampleTimes(Infinity, 8)).toEqual([0]);
  });
});

describe("bestCandidateIndex", () => {
  const c = (score: number): FrameCandidate => ({ time: 0, score, blob: new Blob() });

  it("returns the highest score, first one on ties", () => {
    expect(bestCandidateIndex([c(0.2), c(0.9), c(0.9), c(0.1)])).toBe(1);
  });

  it("returns -1 when there are no candidates", () => {
    expect(bestCandidateIndex([])).toBe(-1);
  });
});

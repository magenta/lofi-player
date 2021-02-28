/**
 * @license
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.4.0/dist/tf.min.js"
);
importScripts("https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/core.js");
importScripts(
  "https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/music_vae.js"
);
importScripts(
  "https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/music_rnn.js"
);

const Twinkle = {
  notes: [
    { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 2 },
    { pitch: 60, quantizedStartStep: 2, quantizedEndStep: 4 },
    { pitch: 67, quantizedStartStep: 4, quantizedEndStep: 6 },
    { pitch: 67, quantizedStartStep: 6, quantizedEndStep: 8 },
    { pitch: 69, quantizedStartStep: 8, quantizedEndStep: 10 },
    { pitch: 69, quantizedStartStep: 10, quantizedEndStep: 12 },
    { pitch: 67, quantizedStartStep: 12, quantizedEndStep: 16 },
    { pitch: 65, quantizedStartStep: 16, quantizedEndStep: 18 },
    { pitch: 65, quantizedStartStep: 18, quantizedEndStep: 20 },
    { pitch: 64, quantizedStartStep: 20, quantizedEndStep: 22 },
    { pitch: 64, quantizedStartStep: 22, quantizedEndStep: 24 },
    { pitch: 62, quantizedStartStep: 24, quantizedEndStep: 26 },
    { pitch: 62, quantizedStartStep: 26, quantizedEndStep: 28 },
    { pitch: 60, quantizedStartStep: 28, quantizedEndStep: 32 },
  ],
  quantizationInfo: { stepsPerQuarter: 4 },
  tempos: [{ time: 0, qpm: 120 }],
  totalQuantizedSteps: 32,
};
const CHECKPOINTS_DIR =
  "https://storage.googleapis.com/magentadata/js/checkpoints";

const urls = {
  melodyChords: `${CHECKPOINTS_DIR}/music_vae/mel_chords`,
  twoBarSmall: `${CHECKPOINTS_DIR}/music_vae/mel_2bar_small`,
  fourBarSmall: `${CHECKPOINTS_DIR}/music_vae/mel_4bar_small_q2`,
  chordRNN: `${CHECKPOINTS_DIR}/music_rnn/chord_pitches_improv`,
};
const mrnn = new music_rnn.MusicRNN(urls.chordRNN);
const mvae = new music_vae.MusicVAE(urls.twoBarSmall);

const NUM_INSPIRATIONAL_MELODIES = 4;
const NUM_INTERPOLATIONS = 5;

let startedInitializing = false;

// Main script asks for work.
self.onmessage = async ({ data }) => {
  if (!startedInitializing) {
    startedInitializing = true;
    await mvae.initialize();
    await mrnn.initialize();
    postMessage({ msg: "init" });

    if (data.msg === "init") {
      return;
    }
  }

  if (mrnn.isInitialized() && data.msg === "continue") {
    const { id } = data;
    // const chordProgression = ["C", "Am", "F", "G", "C", "F", "G", "C"];

    // const chordProgression = ["C", "C", "F", "F"];
    const chordProgression = ["C", "F"];
    const result = await mrnn.continueSequence(
      Twinkle,
      32,
      1.0,
      chordProgression
    );
    postMessage({ id, msg: "continue", result });
  }

  if (mvae.isInitialized() && data.msg === "interpolate") {
    const { left, right, id } = data;
    const result = await mvae.interpolate(
      [left, right],
      NUM_INTERPOLATIONS
      // null,
      // {
      //   chordProgression: ["C", "C", "F", "F"],
      // }
    );
    postMessage({ id, msg: "interpolate", result });
  }

  if (mvae.isInitialized() && data.msg === "sample") {
    const scale = 4;
    const { currentMelody, inspirationalMelodies } = data;

    const [nowTensor, destTensors] = await Promise.all([
      mvae.encode([currentMelody]),
      mvae.encode(inspirationalMelodies),
    ]);

    let tensors = tf
      .stack(Array(NUM_INSPIRATIONAL_MELODIES).fill(nowTensor))
      .reshape([NUM_INSPIRATIONAL_MELODIES, 256]);

    const diffTensors = destTensors.sub(tensors);
    const norms = tf
      .stack(Array(256).fill(diffTensors.norm(undefined, 1)), 1)
      .reshape([4, 256]);
    tensors = tensors.add(diffTensors.div(norms).mul(tf.scalar(scale)));
    const interpolatedMelodies = await mvae.decode(tensors);

    postMessage({ msg: "sample", interpolatedMelodies });
  }
};

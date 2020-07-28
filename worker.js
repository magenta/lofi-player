importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@^1.4.0/dist/tf.min.js"
);
importScripts("https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/core.js");
importScripts(
  "https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/music_vae.js"
);
// importScripts("https://cdn.jsdelivr.net/npm/@magenta/music@1.18.1/es6/core.js");
// importScripts(
//   "https://cdn.jsdelivr.net/npm/@magenta/music@1.18.1/es6/music_vae.js"
// );

const CHECKPOINTS_DIR =
  "https://storage.googleapis.com/magentadata/js/checkpoints";

const urls = {
  melodyChords: `${CHECKPOINTS_DIR}/music_vae/mel_chords`,
  twoBarSmall: `${CHECKPOINTS_DIR}/music_vae/mel_2bar_small`,
  fourBarSmall: `${CHECKPOINTS_DIR}/music_vae/mel_4bar_small_q2`,
};
const mvae = new music_vae.MusicVAE(urls.twoBarSmall);
// const mvae = new music_vae.MusicVAE(urls.melodyChords);

const NUM_INSPIRATIONAL_MELODIES = 4;
const NUM_INTERPOLATIONS = 5;

// Main script asks for work.
self.onmessage = async ({ data }) => {
  if (!mvae.isInitialized()) {
    await mvae.initialize();
    postMessage({ msg: "init" });

    if (data.msg === "init") {
      return;
    }
  }

  if (data.msg === "interpolate") {
    const { left, right, id } = data;
    const result = await mvae.interpolate(
      [left, right],
      NUM_INTERPOLATIONS
      // 0.1,
      // {
      //   chordProgression: ["C", "C", "F", "F"],
      // }
    );
    postMessage({ id, msg: "interpolate", result });
  }

  if (data.msg === "sample") {
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

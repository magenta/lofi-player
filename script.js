const LOAD_EVENTS_COUNTS_THRESHOLD = 6;
const TOTAL_BAR_COUNTS = 8;
const TICKS_PER_BAR = 384;
const BEATS_PER_BAR = 4;

const controlDiv = document.getElementById("control-div");
const startButton = document.getElementById("start-button");
const checkTimeButton = document.getElementById("check-time-button");
const checkTimeText = document.getElementById("check-time-text");
const bpmInput = document.getElementById("bpm-input");
const bpmValueSpan = document.getElementById("bpm-value");
const drumPatternsSelect = document.getElementById("drum-patterns-select");
const drumToggle = document.getElementById("drum-toggle");
const chordsSelect = document.getElementById("chords-select");
const chordsInstrumentSelect = document.getElementById("chords-instrument-select");
const backgroundSamplesSelect = document.getElementById("background-samples-select");
const firstMelodySelect = document.getElementById("first-melody-select");
const melodyInteractionSelect = document.getElementById("melody-interaction-select");
const melodyInteractionDivs = [document.getElementById("interpolation-div"), document.getElementById("mixing-div")];
const interpolationSlider = document.getElementById("interpolation-slider");
const backgroundVolumeSlider = document.getElementById("background-volume-slider");
const backgroundToneSlider = document.getElementById("background-tone-slider");

const worker = new Worker("worker.js");
const samplesBaseUrl = "./samples";
const ac = Tone.context._context;
let loadEventsCounts = 0;
let bpm = 75;

let seq;
let drumSamples;
let drumNames = ["kk", "sn", "hh"];
let drumMute = false;
let drumPatternIndex = 1;

const backgroundSample = {};
let backgroundSamples = [];
let backgroundSampleNames = ["rain", "waves", "street", "kids"];
let backgroundSampleIndex = 0;

let melodyMidis;
let melodyMidi;
let melodyPart;
let melodyIndex = 0;
let secondMelodyIndex = 1;
let interpolationMidis = [];
let chordsMidis;
let chordsPart;
let chordsIndex = 0;
let chordsInstrumentIndex = 0;

let piano;
let acousticGuitar;
let electricGuitar;
let synth;
let bass;
let chordsInstruments;

initModel();
loadMidiFiles();
initSounds();

function initSounds() {
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = "0:0:0";
  Tone.Transport.loopEnd = "8:0:0";

  const drumUrls = {};
  drumNames.forEach((n) => (drumUrls[n] = `${samplesBaseUrl}/drums/${n}.mp3`));
  drumSamples = new Tone.Players(drumUrls, () => {
    console.log("drums loaded");
    checkFinishLoading();
  }).toMaster();

  backgroundSample.gain = new Tone.Gain(1).toMaster();
  // backgroundSample.hpf = new Tone.Filter(0, "highpass").connect(backgroundSample.gain);
  backgroundSample.hpf = new Tone.Filter(20000, "lowpass").connect(backgroundSample.gain);
  const sampleUrls = {};
  backgroundSampleNames.forEach((n) => (sampleUrls[n] = `${samplesBaseUrl}/fx/${n}.mp3`));
  backgroundSamples = new Tone.Players(sampleUrls, () => {
    console.log("background sounds loaded");
    checkFinishLoading();
  }).connect(backgroundSample.hpf);

  backgroundSampleNames.forEach((name) => {
    backgroundSamples.get(name).loop = true;
  });
  seq = new Tone.Sequence(
    seqCallback,
    Array(128)
      .fill(null)
      .map((_, i) => i),
    "16n"
  );
  seq.start(0);

  const reverb = new Tone.Reverb({
    decay: 8.5,
    preDelay: 0.1,
  }).toMaster();
  reverb.generate().then(() => {
    console.log("reverb ready");
    checkFinishLoading();
  });
  reverb.wet.value = 0.3;
  const lpf = new Tone.Filter(1000, "lowpass").connect(reverb);
  const hpf = new Tone.Filter(1, "highpass").connect(lpf);
  const chorus = new Tone.Chorus(4, 2.5, 0.1).connect(hpf);

  synth = new Tone.PolySynth(10, Tone.Synth, {
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1,
    },
  }).connect(chorus);

  piano = SampleLibrary.load({
    instruments: "piano",
  });
  acousticGuitar = SampleLibrary.load({
    instruments: "guitar-acoustic",
  });
  electricGuitar = SampleLibrary.load({
    instruments: "guitar-electric",
  });
  bass = SampleLibrary.load({
    instruments: "bass-electric",
  });

  piano.connect(chorus);
  acousticGuitar.connect(chorus);
  electricGuitar.connect(chorus);
  bass.connect(reverb);

  chordsInstruments = [synth, piano, acousticGuitar, electricGuitar];

  Tone.Buffer.on("load", () => {
    checkFinishLoading();
    console.log("buffers loaded");
  });
}

function initModel() {
  worker.postMessage({ msg: "init" });
  worker.onmessage = (e) => {
    if (e.data.msg === "init") {
      console.log("model loaded");
      checkFinishLoading();
    }
    if (e.data.msg === "interpolate") {
      const { id, result } = e.data;
      // console.log("interpolation result", result);
      interpolationMidis = result.map(modelFormatToMidi);
      interpolationMidis[0] = parseMidiNotes(melodyMidis[melodyIndex]);
      interpolationMidis[interpolationMidis.length - 1] = parseMidiNotes(melodyMidis[secondMelodyIndex]);
      // console.log("interpolationMidis", interpolationMidis);
    }
  };
}

function seqCallback(time, b) {
  if (!drumMute) {
    if (drumPatternIndex === 0) {
      if (b % 16 === 0) {
        drumSamples.get("kk").start(time);
      }
      if (b % 16 === 8) {
        drumSamples.get("sn").start(time);
      }
      if (b % 2 === 0) {
        drumSamples.get("hh").start(time);
      }
    } else if (drumPatternIndex === 1) {
      if (b % 32 === 0 || b % 32 === 20) {
        drumSamples.get("kk").start(time);
      }
      if (b % 16 === 8) {
        drumSamples.get("sn").start(time);
      }
      if (b % 2 === 0) {
        drumSamples.get("hh").start(time + 0.07);
      }
    } else if (drumPatternIndex === 2) {
      if (b % 16 === 0 || b % 16 === 10 || (b % 32 >= 16 && b % 16 === 11)) {
        drumSamples.get("kk").start(time);
      }
      if (b % 8 === 4) {
        drumSamples.get("sn").start(time);
      }
      if (b % 2 === 0) {
        drumSamples.get("hh").start(time + 0.07);
      }
    }
  }

  // Markov chain
  if (b % 32 === 31) {
    if (drumMute) {
      if (Math.random() > 0.05) {
        toggleDrumMute(false);
      }
    } else {
      if (Math.random() > 0.7) {
        toggleDrumMute(true);
      }
    }
  }

  checkTimeText.textContent = Tone.Transport.position;
}

async function loadMidiFiles() {
  chordsMidis = await Promise.all([
    Midi.fromUrl("./midi/IV_IV_I_I/IV_IV_I_I_C_1.mid"),
    Midi.fromUrl("./midi/IV_IV_I_I/IV_IV_I_I_C_3.mid"),
    Midi.fromUrl("./midi/i_III_iv_v_Am.mid"),
    Midi.fromUrl("./midi/VI_i_VI_v_Am.mid"),
  ]);

  changeChords(chordsIndex);

  melodyMidis = await Promise.all([
    Midi.fromUrl("./midi/IV_IV_I_I/melody/m_1_C.mid"),
    Midi.fromUrl("./midi/IV_IV_I_I/melody/m_2_C.mid"),
    Midi.fromUrl("./midi/IV_IV_I_I/melody/m_3_C.mid"),
    Midi.fromUrl("./midi/IV_IV_I_I/melody/m_4_C.mid"),
  ]);

  changeMelodyByIndex(melodyIndex);

  console.log("midi loaded");
  // console.log("midi loaded", melodyMidis[0]);
  checkFinishLoading();
}

function checkFinishLoading() {
  loadEventsCounts += 1;
  if (loadEventsCounts === LOAD_EVENTS_COUNTS_THRESHOLD) {
    console.log("Finish loading!");
    onFinishLoading();
  }
}

function onFinishLoading() {
  controlDiv.style.display = "flex";
  startButton.textContent = "start";
  startButton.addEventListener("click", () => {
    if (ac.state !== "started") {
      ac.resume();
    }
    if (Tone.Transport.state === "started") {
      Tone.Transport.stop();
      onTransportStop();
      startButton.textContent = "start";
    } else {
      Tone.Transport.start();
      onTransportStart();
      startButton.textContent = "stop";
    }
  });

  bpmInput.value = bpm;
  bpmInput.addEventListener("input", (e) => {
    bpmValueSpan.textContent = `${e.target.value}`;
    bpm = e.target.value;
    Tone.Transport.bpm.value = e.target.value;
  });

  drumToggle.addEventListener("change", (e) => {
    toggleDrumMute(!e.target.checked);
  });
  drumPatternsSelect.addEventListener("change", () => {
    drumPatternIndex = parseInt(drumPatternsSelect.value, 10);
  });

  chordsSelect.addEventListener("change", () => {
    changeChords(chordsSelect.value);
  });
  chordsInstrumentSelect.addEventListener("change", () => {
    changeChordsInstrument(chordsInstrumentSelect.value);
  });

  firstMelodySelect.addEventListener("change", () => {
    changeMelodyByIndex(firstMelodySelect.value);
  });

  backgroundSamplesSelect.addEventListener("change", () => {
    backgroundSamples.get(backgroundSampleNames[backgroundSampleIndex]).stop();
    backgroundSampleIndex = backgroundSamplesSelect.value;
    backgroundSamples.get(backgroundSampleNames[backgroundSampleIndex]).start();
  });

  melodyInteractionSelect.addEventListener("change", () => {
    const mode = melodyInteractionSelect.value;
    melodyInteractionDivs[mode].style.display = "block";
    melodyInteractionDivs[1 - mode].style.display = "none";
  });

  interpolationSlider.addEventListener("change", () => {
    const index = Math.floor(interpolationSlider.value);
    changeMelody(interpolationMidis[index]);
  });

  backgroundVolumeSlider.addEventListener("input", () => {
    backgroundSample.gain.gain.value = backgroundVolumeSlider.value / 100;
  });

  backgroundToneSlider.addEventListener("input", () => {
    const frq = backgroundToneSlider.value * 200;
    backgroundSample.hpf.frequency.value = frq;
  });

  // model
  const firstMelody = melodyMidis[melodyIndex];
  const secondMelody = melodyMidis[secondMelodyIndex];
  const left = midiToModelFormat(firstMelody);
  const right = midiToModelFormat(secondMelody);
  worker.postMessage({
    id: 0,
    msg: "interpolate",
    left,
    right,
  });
}

function onTransportStart() {
  backgroundSamples.get(backgroundSampleNames[backgroundSampleIndex]).start();
}

function onTransportStop() {
  backgroundSamples.get(backgroundSampleNames[backgroundSampleIndex]).stop();
}

function toggleDrumMute(value) {
  if (value === undefined) {
    drumMute = !drumMute;
  } else {
    drumMute = value;
  }

  drumToggle.checked = !drumMute;
}

function changeChords(index = 0) {
  if (chordsPart) {
    chordsPart.cancel(0);
  }
  chordsIndex = index;
  chordsPart = new Tone.Part((time, note) => {
    chordsInstruments[chordsInstrumentIndex].triggerAttackRelease(
      midi(note.pitch - (chordsInstrumentIndex === 0 ? 0 : 12)),
      note.duration,
      time,
      note.velocity
    );
  }, parseMidiNotes(chordsMidis[chordsIndex])).start(0);
}

function changeMelodyByIndex(index = 0) {
  if (melodyPart) {
    melodyPart.cancel(0);
  }
  melodyIndex = index;
  melodyPart = new Tone.Part((time, note) => {
    piano.triggerAttackRelease(midi(note.pitch - 12), note.duration, time, note.velocity);
  }, parseMidiNotes(melodyMidis[melodyIndex])).start(0);
}

function changeMelody(readyMidi) {
  if (melodyPart) {
    melodyPart.cancel(0);
  }
  melodyPart = new Tone.Part((time, note) => {
    piano.triggerAttackRelease(midi(note.pitch - 12), note.duration, time, note.velocity);
  }, readyMidi).start(0);
}

function changeChordsInstrument(index) {
  chordsInstrumentIndex = index;
}

// utils
function parseMidiNotes(midi) {
  // console.log("parse this midi", midi);
  const ticksPerBeat = TICKS_PER_BAR / BEATS_PER_BAR;
  const ticksPerFourthNote = ticksPerBeat / 4;

  return midi.tracks[0].notes.map((note) => {
    return {
      time: `${Math.floor(note.ticks / TICKS_PER_BAR)}:${Math.floor(note.ticks / ticksPerBeat) % BEATS_PER_BAR}:${
        (note.ticks / ticksPerFourthNote) % 4
      }`,
      pitch: note.midi,
      duration: note.duration,
      velocity: note.velocity,
    };
  });
}

function midiToModelFormat(midi) {
  // console.log("parse this midi", midi);
  const totalTicks = TOTAL_BAR_COUNTS * TICKS_PER_BAR;
  const notes = midi.tracks[0].notes.map((note) => ({
    pitch: note.midi,
    quantizedStartStep: Math.floor((note.ticks / totalTicks) * 64),
    quantizedEndStep: Math.floor(((note.ticks + note.durationTicks) / totalTicks) * 64),
  }));

  return {
    notes,
    quantizationInfo: { stepsPerQuarter: 4 },
    tempos: [{ time: 0, qpm: 120 }],
    totalQuantizedSteps: 64,
  };
}

function modelFormatToMidi(data) {
  const { notes } = data;
  return notes.map((note) => {
    const { pitch, quantizedStartStep, quantizedEndStep } = note;

    return {
      time: `${Math.floor(quantizedStartStep / 8)}:${Math.floor((quantizedStartStep % 8) / 2)}:${
        (quantizedStartStep % 2) * 2
      }`,
      pitch,
      duration: (quantizedEndStep - quantizedStartStep) * (bpm / 60) * (1 / 4),
      velocity: 0.7,
    };
  });
}

function midi(m) {
  return Tone.Frequency(m, "midi");
}

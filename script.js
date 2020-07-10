const LOAD_EVENTS_COUNTS_THRESHOLD = 4;
const TOTAL_BAR_COUNTS = 8;
const TICKS_PER_BAR = 384;
const BEATS_PER_BAR = 4;

const startButton = document.getElementById("start-button");
const checkTimeButton = document.getElementById("check-time-button");
const checkTimeText = document.getElementById("check-time-text");
const bpmInput = document.getElementById("bpm-input");
const bpmValueSpan = document.getElementById("bpm-value");
const drumRadios = document.getElementById("drum-radios").children;
const drumToggle = document.getElementById("drum-toggle");

const samplesBaseUrl = "./assets/samples";
const ac = Tone.context._context;
let loadEventsCounts = 0;
let bpm = 75;

let seq;
let drumSamples;
let drumNames = ["kk", "sn", "hh"];
let drumMute = false;
let drumPatternIndex = 1;

let melodyMidi;
let melodyPart;
let chordsMidi;
let chordsPart;
let rainSample;

let synth;

loadMidiFiles();
initSounds();

function initSounds() {
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = "0:0:0";
  Tone.Transport.loopEnd = "8:0:0";

  const drumUrls = {};
  drumNames.forEach((name) => (drumUrls[name] = `${samplesBaseUrl}/drums/${name}.mp3`));
  drumSamples = new Tone.Players(drumUrls, () => {
    console.log("drums loaded");
    checkFinishLoading();
  }).toMaster();

  rainSample = new Tone.Player(`${samplesBaseUrl}/fx/rain.mp3`, () => {
    console.log("rain sample loaded");
    checkFinishLoading();
  }).toMaster();
  rainSample.loop = true;

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
  const [m1, m2, m3] = await Promise.all([
    Midi.fromUrl("./assets/midi/IV_IV_I_I/melody/m_1_C.mid"),
    Midi.fromUrl("./assets/midi/IV_IV_I_I/IV_IV_I_I_C.mid"),
    Midi.fromUrl("./assets/midi/progression_75_C.mid"),
  ]);

  melodyMidi = m1;
  chordsMidi = m3;

  const notes = parseMidiNotes(chordsMidi);
  chordsPart = new Tone.Part((time, note) => {
    synth.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
  }, notes).start(0);

  console.log("midi loaded");
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
  startButton.textContent = "start";
  startButton.addEventListener("click", () => {
    if (ac.state !== "started") {
      ac.resume();
    }

    if (rainSample.loaded) {
      if (Tone.Transport.state === "started") {
        Tone.Transport.stop();
        onTransportStop();
        startButton.textContent = "start";
      } else {
        Tone.Transport.start();
        onTransportStart();
        startButton.textContent = "stop";
      }
    }
  });

  bpmInput.value = bpm;
  bpmInput.addEventListener("input", (e) => {
    bpmValueSpan.textContent = `${e.target.value}`;
    bpm = e.target.value;
    Tone.Transport.bpm.value = e.target.value;
  });

  for (let i = 0; i < drumRadios.length; i++) {
    const elt = drumRadios[i];
    if (elt.nodeName === "INPUT") {
      elt.addEventListener("change", () => {
        drumPatternIndex = parseInt(elt.value, 10);
        onDrumRadioChange();
      });
    }
  }

  drumToggle.addEventListener("change", (e) => {
    toggleDrumMute(!e.target.checked);
  });
}

function onTransportStart() {
  rainSample.start();
}

function onTransportStop() {
  rainSample.stop();
}

function onDrumRadioChange() {}

function toggleDrumMute(value) {
  if (value === undefined) {
    drumMute = !drumMute;
  } else {
    drumMute = value;
  }

  drumToggle.checked = !drumMute;
}

// utils
function parseMidiNotes(midi) {
  // console.log("parse this midi", midi);
  const ticksPerBeat = TICKS_PER_BAR / BEATS_PER_BAR;
  const ticksPerFourthNote = ticksPerBeat / 4;
  return midi.tracks[0].notes.map((note) => {
    // const totalTicks = chordsMidi.durationTicks;
    return {
      time: `${Math.floor(note.ticks / TICKS_PER_BAR)}:${Math.floor(note.ticks / ticksPerBeat) % BEATS_PER_BAR}:${
        (note.ticks / ticksPerFourthNote) % 4
      }`,
      pitch: note.name,
      duration: note.duration,
      velocity: note.velocity,
    };
  });
}

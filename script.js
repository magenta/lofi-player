const TOTAL_BAR_COUNTS = 8;
const TICKS_PER_BAR = 384;
const BEATS_PER_BAR = 4;
const LOAD_EVENTS_COUNTS_THRESHOLD = 5;

const startButton = document.getElementById("start-button");
const checkTimeButton = document.getElementById("check-time-button");
const checkTimeText = document.getElementById("check-time-text");
const { Part } = Tone;

const ac = Tone.context._context;
let samplesBaseUrl = "./assets/samples";
let drumNames = ["kk", "sn", "hh"];
let drumPlayers;
let guitarSample;
let rainSample;
let loadEventsCounts = 0;
let drumUrls;
let drumMute = true;
let melodyMidi;
let chordsMidi;
let chordsPart;
let seq;
let synth;

loadMidiFiles();
initSounds();

function initSounds() {
  Tone.Transport.bpm.value = 75;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = "0:0:0";
  Tone.Transport.loopEnd = "8:0:0";

  drumUrls = {};
  drumNames.forEach((name) => (drumUrls[name] = `${samplesBaseUrl}/drums/${name}.mp3`));
  drumPlayers = new Tone.Players(drumUrls, () => {
    console.log("drums loaded");
    checkFinishLoading();
  }).toMaster();
  guitarSample = new Tone.Player(`${samplesBaseUrl}/guitar/75_guitar_F.mp3`, () => {
    console.log("guitar sample loaded");
    checkFinishLoading();
  }).toMaster();
  rainSample = new Tone.Player(`${samplesBaseUrl}/fx/rain.mp3`, () => {
    console.log("rain sample loaded");
    checkFinishLoading();
  }).toMaster();
  rainSample.loop = true;

  seq = new Tone.Sequence(
    (time, b) => {
      if (!drumMute) {
        if (b % 16 === 0) {
          drumPlayers.get("kk").start(time);
        }
        if (b % 16 === 8) {
          drumPlayers.get("sn").start(time);
        }
        if (b % 2 === 0) {
          drumPlayers.get("hh").start(time);
        }
      }

      if (b === 127) {
        if (drumMute) {
          if (Math.random() > 0.05) drumMute = false;
        } else {
          if (Math.random() > 0.7) {
            drumMute = true;
          }
        }
      }

      checkTimeText.textContent = Tone.Transport.position;
    },
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

async function loadMidiFiles() {
  const [m1, m2] = await Promise.all([
    Midi.fromUrl("./assets/midi/m_1.mid"),
    Midi.fromUrl("./assets/midi/progression_90_Gm.mid"),
  ]);

  melodyMidi = m1;
  chordsMidi = m2;

  const notes = parseMidiNotes(chordsMidi);
  chordsPart = new Part(function (time, note) {
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

    if (guitarSample.loaded) {
      if (Tone.Transport.state === "started") {
        Tone.Transport.stop();
        rainSample.stop();
        startButton.textContent = "start";
      } else {
        Tone.Transport.start();
        rainSample.start();
        startButton.textContent = "stop";
      }
    }
  });

  // checkTimeButton.addEventListener("click", () => {
  //   checkTimeText.textContent = `transport position: ${Tone.Transport.position}
  // 															transport seconds: ${Tone.Transport.seconds}
  // 															audiocontext time: ${ac.currentTime}
  // 															Tone.now: ${Tone.now()}`;
  // });
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

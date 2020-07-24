const LOAD_EVENTS_COUNTS_THRESHOLD = 8;
const TOTAL_BAR_COUNTS = 8;
const TICKS_PER_BAR = 384;
const BEATS_PER_BAR = 4;
const TOTAL_TICKS = TOTAL_BAR_COUNTS * TICKS_PER_BAR;
const MODEL_BAR_COUNT = 2;
const MAIN_CANVAS_PADDING = 0;
const NUM_INTERPOLATIONS = 5;

const SYNTHS = 0;
const PIANO = 1;
const ACOUSTIC_GUITAR = 2;
const ELETRIC_GUITAR = 3;
const NUM_INSTRUMENTS = 4;

const controlDiv = document.getElementById("control-div");
const startButton = document.getElementById("start-button");
const switchScreenButton = document.getElementById("switch-screen-button");
const checkTimeButton = document.getElementById("check-time-button");
const checkTimeText = document.getElementById("check-time-text");
const bpmInput = document.getElementById("bpm-input");
const bpmValueSpan = document.getElementById("bpm-value");
const drumPatternsSelect = document.getElementById("drum-patterns-select");
const drumToggle = document.getElementById("drum-toggle");
const drumAutoToggle = document.getElementById("drum-auto-toggle");
const chordsSelect = document.getElementById("chords-select");
const chordsInstrumentSelect = document.getElementById(
  "chords-instrument-select"
);
const backgroundSoundsSelect = document.getElementById(
  "background-samples-select"
);
const firstMelodySelect = document.getElementById("first-melody-select");
const secondMelodySelect = document.getElementById("second-melody-select");
const melodyInteractionSelect = document.getElementById(
  "melody-interaction-select"
);
const melodyInteractionDivs = [
  document.getElementById("interpolation-div"),
  document.getElementById("mixing-div"),
];
const melodyInstrumentSelect = document.getElementById(
  "melody-instrument-select"
);
const interpolationSlider = document.getElementById("interpolation-slider");
const secondInterpolationSlider = document.getElementById(
  "interpolation-slider-2"
);
const backgroundVolumeSlider = document.getElementById(
  "background-volume-slider"
);
const backgroundToneSlider = document.getElementById("background-tone-slider");
const canvasDiv = document.getElementById("canvas-div");
const canvasOverlay = document.getElementById("canvas-overlay");
const melodyPanelDiv = document.getElementById("melody-panel-div");
const interpolationDiv = document.getElementById("interpolation-div");
const melodyPanelCloseSpan = document.getElementById("melody-panel-close");
const timeProgress = document.getElementById("time-progress");
const backgroundImage = document.getElementById("background-image");
const linkInput = document.getElementById("youtube-link-input");
const submitLinkButton = document.getElementById("submit-youtube-link-button");

const bassVolumeSlider = document.getElementById("bass-volume-slider");
const bassToneSlider = document.getElementById("bass-tone-slider");
const melodyVolumeSlider = document.getElementById("melody-volume-slider");
const chordsVolumeSlider = document.getElementById("chords-volume-slider");
const masterReverbSlider = document.getElementById("master-reverb-slider");
const masterToneSlider = document.getElementById("master-tone-slider");

const controlPanels = document.getElementsByClassName("panel");

const worker = new Worker("worker.js");
const samplesBaseUrl = "./samples";
const ac = Tone.context._context;
let loadEventsCounts = 0;
let bpm = 75;

let seq;
let drumSamples;
let drumNames = ["kk", "sn", "hh"];
let drumMute = false;
let drumPatternIndex = 0;

const data = {
  loading: true,
  showPanel: false,
  backgroundSounds: {},
  melody: {
    gain: 1,
    changeGain: (v) => {
      data.melody.gain = v;
    },
    instrumentIndex: 1,
    waitingInterpolation: true,
    interpolationToneNotes: [],
    interpolationData: [],
    interpolationIndex: 0,
  },
  chords: {
    gain: 1,
  },
  bass: {
    notes: [
      { time: "0:0:0", note: "F2", duration: { "1m": 0.7 }, velocity: 1.0 },
      { time: "1:0:0", note: "F2", duration: { "1m": 0.7 }, velocity: 1.0 },
      { time: "2:0:0", note: "C2", duration: { "1m": 0.7 }, velocity: 1.0 },
      { time: "3:0:0", note: "C2", duration: { "1m": 0.7 }, velocity: 1.0 },
    ],
  },
  canvas: {},
  drum: {
    auto: true,
    scale: {
      kk: 1,
      sn: 1,
      hh: 1,
    },
  },
  effects: {},
  master: {
    masterCompressor: new Tone.Compressor({
      threshold: -15,
      ratio: 7,
    }),
    lpf: new Tone.Filter(20000, "lowpass"),
    reverb: new Tone.Reverb({
      decay: 1.0,
      preDelay: 0.01,
    }),
  },
};
let backgroundSounds = [];
let backgroundSoundsNames = ["rain", "waves", "street", "kids"];
let backgroundSoundsIndex = 0;

let melodyMidis;
let melodyMidi;
let melodyPart;
let melodyIndex = 0;
let secondMelodyIndex = 1;
let chordsMidis;
let chordsPart;
let chordsIndex = 0;
let chordsInstrumentIndex = 0;

let piano;
let acousticGuitar;
let electricGuitar;
let synth;
let chordsInstruments;

const assets = {
  catIndex: 0,
};
let switchAvatar;
const drinkingUrl = `${window.location}/assets/avatar-2.png`;
const notDrinkingUrl = `${window.location}/assets/avatar.png`;
const catsUrls = [
  "./assets/cat-75-purple.gif",
  "./assets/cat-90.gif",
  "./assets/dog-100.gif",
];

addImages();
initModel();
loadMidiFiles();
initSounds();
initCanvas();

function initSounds() {
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = "0:0:0";
  Tone.Transport.loopEnd = "8:0:0";

  Tone.Master.chain(
    data.master.masterCompressor,
    data.master.reverb,
    data.master.lpf
  );
  data.master.reverb.generate().then(() => {
    console.log("master reverb ready");
    checkFinishLoading();
  });
  data.master.reverb.wet.value = 0;

  const drumUrls = {};
  drumNames.forEach((n) => (drumUrls[n] = `${samplesBaseUrl}/drums/${n}.mp3`));
  drumSamples = new Tone.Players(drumUrls, () => {
    console.log("drums loaded");
    checkFinishLoading();
  }).toMaster();

  data.backgroundSounds.gain = new Tone.Gain(1).toMaster();
  // data.backgroundSounds.hpf = new Tone.Filter(0, "highpass").connect(data.backgroundSounds.gain);
  data.backgroundSounds.hpf = new Tone.Filter(20000, "lowpass").connect(
    data.backgroundSounds.gain
  );
  const sampleUrls = {};
  backgroundSoundsNames.forEach(
    (n) => (sampleUrls[n] = `${samplesBaseUrl}/fx/${n}.mp3`)
  );
  backgroundSounds = new Tone.Players(sampleUrls, () => {
    console.log("background sounds loaded");
    checkFinishLoading();
  }).connect(data.backgroundSounds.hpf);

  data.effects.beep = new Tone.Player(
    `${samplesBaseUrl}/effects/beep.mp3`,
    () => {
      checkFinishLoading();
    }
  ).toMaster();

  backgroundSoundsNames.forEach((name) => {
    backgroundSounds.get(name).loop = true;
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
  const { bass } = data;

  bass.gain = new Tone.Gain(1).connect(reverb);
  bass.lpf = new Tone.Filter(200, "lowpass").connect(bass.gain);
  bass.instrument = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.3,
      release: 0.8,
    },
  }).connect(bass.lpf);
  bass.part = new Tone.Part((time, note) => {
    bass.instrument.triggerAttackRelease(
      note.note,
      note.duration,
      time,
      note.velocity
    );
  }, bass.notes).start(0);
  bass.part.loop = true;
  bass.part.loopEnd = "4:0:0";

  piano.connect(chorus);
  acousticGuitar.connect(chorus);
  electricGuitar.connect(chorus);

  chordsInstruments = [synth, piano, acousticGuitar, electricGuitar];
  data.melody.instrument = piano;

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
      let { id, result } = e.data;
      // console.log("interpolation result", result);
      result = filterNotesInScale(result);
      data.melody.interpolationData.splice(
        1,
        NUM_INTERPOLATIONS - 2,
        ...result.slice(1, NUM_INTERPOLATIONS - 1)
      );
      // data.melody.interpolationData = result;

      data.melody.interpolationToneNotes = result.map(modelFormatToToneNotes);
      data.melody.interpolationToneNotes[0] = midiToToneNotes(
        melodyMidis[melodyIndex]
      );
      data.melody.interpolationToneNotes[
        data.melody.interpolationToneNotes.length - 1
      ] = midiToToneNotes(melodyMidis[secondMelodyIndex]);

      data.melody.waitingInterpolation = false;

      // console.log("interpolationData", data.melody.interpolationData);
      // console.log("interpolationToneNotes", data.melody.interpolationToneNotes);
      melodyInteractionDivs[0].classList.remove("disabledbutton");
    }
  };
}

function initCanvas() {
  const canvas = document.getElementById("main-canvas");
  data.canvas.canvas = canvas;

  canvasDiv.style.height = `${backgroundImage.clientWidth * (435 / 885)}px`;

  canvas.width = canvasDiv.clientWidth;
  canvas.height = canvasDiv.clientHeight;

  canvasDiv.addEventListener("mousedown", (e) => {
    const { clientX, clientY } = e;
    let canvasRect = canvas.getBoundingClientRect();
    const mouseX = clientX - canvasRect.left - MAIN_CANVAS_PADDING;
    const mouseY = clientY - canvasRect.top - MAIN_CANVAS_PADDING;

    // console.log(`x: ${mouseX} y: ${mouseY}`);
  });

  const melodyCanvas = document.getElementById("melody-canvas");
  data.canvas.melodyCanvas = melodyCanvas;
  data.canvas.moveMelodyCanvasToPanel = function () {
    removeElement(melodyCanvas);
    melodyCanvas.style.position = "static";
    melodyCanvas.style.width = "100%";
    melodyCanvas.style.height = "100%";
    melodyCanvas.style.opacity = 1.0;
    interpolationDiv.append(melodyCanvas);
  };

  data.canvas.moveMelodyCanvasToRoom = function () {
    melodyCanvas.style.position = "absolute";
    // melodyCanvas.style.top = "12%";
    // melodyCanvas.style.left = "23%";
    // melodyCanvas.style.width = "45%";
    // melodyCanvas.style.height = "41%";
    melodyCanvas.style.top = "16%";
    melodyCanvas.style.left = "7.5%";
    melodyCanvas.style.width = "78%";
    melodyCanvas.style.height = "52%";

    melodyCanvas.style.zIndex = 1;
    melodyCanvas.style.opacity = 0.93;
    assets.tvTable.append(melodyCanvas);
  };

  draw();
}

function addImages() {
  const rainGif = addImageToCanvasDiv("./assets/snow.gif", {
    width: "45%",
    left: "20%",
    zIndex: "-2",
    bottom: "0",
  });

  assets.light = addImageToCanvasDiv("./assets/light-off.png", {
    class: "large-on-hover",
    width: "8%",
    left: "50%",
    top: "-2%",
    zIndex: "1",
  });

  assets.window = addImageToCanvasDiv("./assets/window-1.png", {
    class: "large-on-hover-micro",
    width: "38%",
    left: "17%",
    zIndex: "0",
    top: "20.3%",
  });

  const wavesGif = addImageToCanvasDiv("./assets/waves.gif", {
    width: "38%",
    left: "20%",
    zIndex: "-2",
    top: "21%",
  });

  const streetGif = addImageToCanvasDiv("./assets/city-2.gif", {
    width: "50%",
    left: "5%",
    zIndex: "-2",
    top: "-20%",
  });

  const kidsGif = addImageToCanvasDiv("./assets/city.gif", {
    width: "33%",
    left: "20%",
    zIndex: "-2",
    top: "14%",
  });

  // rainGif.style.display = 'none';
  streetGif.style.display = "none";
  wavesGif.style.display = "none";
  kidsGif.style.display = "none";

  assets.windowGifs = [rainGif, wavesGif, kidsGif, streetGif];

  assets.cat = addImageToCanvasDiv(catsUrls[assets.catIndex], {
    class: "large-on-hover",
    width: "6%",
    bottom: "33%",
    left: "43%",
  });

  assets.avatar = addImageToCanvasDiv(notDrinkingUrl, {
    class: "large-on-hover",
    height: "55%",
    left: "20%",
    zIndex: "4",
  });

  assets.cactus = addImageToCanvasDiv("./assets/cactus.png", {
    class: "large-on-hover",
    width: "3%",
    bottom: "39%",
    left: "38%",
  });

  assets.chair = addImageToCanvasDiv("./assets/chair-red.png", {
    width: "10%",
    left: "10%",
  });

  dragElement(assets.chair);

  assets.desk = addImageToCanvasDiv("./assets/desk.png", {
    // width: "22%",
    height: "25%",
    left: "0%",
  });

  // addImageToCanvasDiv("./assets/synth.png", {
  //   left: "2%",
  //   width: "13%",
  //   bottom: "30%",
  //   zIndex: "3",
  // });

  assets.lamp = addImageToCanvasDiv("./assets/lamp-on.png", {
    class: "large-on-hover",
    width: "5%",
    left: "5%",
    bottom: "30%",
    zIndex: "4",
  });
  assets.lampOn = true;

  assets.shelfWithBooks = addImageToCanvasDiv("./assets/shelf.png", {
    class: "large-on-hover",
    width: "12%",
    left: "3%",
    bottom: "60%",
  });

  assets.synthShelf = addImageToCanvasDiv("./assets/shelf-blank-1.png", {
    // class: "large-on-hover",
    width: "12%",
    right: "25%",
    bottom: "60%",
  });

  assets.pianoShelf = addImageToCanvasDiv("./assets/shelf-blank-1.png", {
    // class: "large-on-hover",
    width: "12%",
    right: "10%",
    bottom: "60%",
  });

  assets.tvStand = addImageToCanvasDiv("./assets/tv-stand.png", {
    width: "20%",
    left: "35%",
    zIndex: "3",
    group: true,
  });
  assets.tvTable = addImageToCanvasDiv("./assets/tv-color.png", {
    class: "large-on-hover",
    width: "50%",
    bottom: "95%",
    left: "15%",
    zIndex: "1",
    group: true,
  });
  assets.radio = addImageToCanvasDiv("./assets/radio.png", {
    class: "large-on-hover",
    width: "18%",
    bottom: "95%",
    right: "10%",
    zIndex: "1",
    group: true,
  });

  let radioSlider = secondInterpolationSlider;
  removeElement(radioSlider);
  radioSlider.style.display = "block";
  radioSlider.style.position = "absolute";
  radioSlider.style.left = "0%";
  radioSlider.style.bottom = "36%";
  radioSlider.style.height = "5%";
  radioSlider.style.width = "80%";
  radioSlider.style.opacity = 1.0;
  radioSlider.setAttribute("type", "range");
  radioSlider.addEventListener("input", () => {
    data.melody.changeGain(input.value / 100);
  });

  assets.radio.addEventListener("click", () => {
    if (radioSlider.style.display === "none") {
      radioSlider.style.display = "block";
    } else {
      radioSlider.style.display = "none";
    }
  });

  assets.tvStand.append(assets.tvTable);
  assets.tvStand.append(assets.radio);
  assets.tvStand.append(radioSlider);

  assets.sofa = addImageToCanvasDiv("./assets/sofa-1.png", {
    width: "35%",
    right: "3%",
    zIndex: "2",
    group: true,
  });

  // assets.cabinetLeft = addImageToCanvasDiv("./assets/cabinet-1.png", {
  //   height: "35%",
  //   right: "30%",
  //   bottom: "9%",
  //   zIndex: "1",
  // });

  // assets.tv = addImageToCanvasDiv("./assets/tv-on.png", {
  //   class: "large-on-hover",
  //   width: "10%",
  //   right: "30%",
  //   bottom: "44%",
  //   zIndex: "1",
  //   group: true,
  // });

  const ifrm = document.createElement("iframe");
  // ifrm.setAttribute("frameborder", "0");
  // ifrm.style.position = "absolute";
  // ifrm.style.top = "16.6%";
  // ifrm.style.left = "7.5%";
  // ifrm.style.width = "78%";
  // ifrm.style.height = "51%";
  // ifrm.style.zIndex = "1";
  // assets.tv.appendChild(ifrm);

  assets.youtube = ifrm;

  assets.cabinetRight = addImageToCanvasDiv("./assets/cabinet-2.png", {
    width: "10%",
    right: "30%",
    bottom: "9%",
    zIndex: "1",
    group: true,
  });

  assets.clock = addImageToCanvasDiv("./assets/clock.png", {
    // class: "large-on-hover",
    height: "20%",
    right: "20%",
    bottom: "100%",
  });
  assets.cabinetRight.appendChild(assets.clock);

  assets.bass = addImageToCanvasDiv("./assets/bass.png", {
    class: "large-on-hover",
    height: "40%",
    right: "10%",
    bottom: "2%",
    zIndex: "3",
  });

  // assets.acousticGuitar = addImageToCanvasDiv("./assets/acoustic-guitar.png", {
  //   class: "large-on-hover",
  //   height: "30%",
  //   right: "17%",
  //   bottom: "2%",
  //   zIndex: "3",
  // });

  assets.chordsInstruments = [
    addImageToCanvasDiv("./assets/synth.png", {
      class: "large-on-hover",
      height: "28%",
      right: "30%",
      top: "-28%",
      zIndex: "2",
    }),
    addImageToCanvasDiv("./assets/piano.png", {
      class: "large-on-hover",
      height: "28%",
      right: "30%",
      top: "-28%",
      zIndex: "2",
      display: "none",
    }),
    addImageToCanvasDiv("./assets/acoustic-guitar.png", {
      class: "large-on-hover",
      height: "120%",
      left: "40%",
      bottom: "-10%",
      zIndex: "3",
      display: "none",
    }),
    addImageToCanvasDiv("./assets/electric-guitar.png", {
      class: "large-on-hover",
      height: "130%",
      left: "40%",
      bottom: "-10%",
      zIndex: "3",
      display: "none",
    }),
  ];

  assets.melodyInstruments = [
    addImageToCanvasDiv("./assets/synth.png", {
      class: "large-on-hover",
      width: "30%",
      right: "52%",
      bottom: "50%",
      zIndex: "3",
      display: "none",
    }),
    addImageToCanvasDiv("./assets/piano.png", {
      class: "large-on-hover",
      width: "30%",
      right: "52%",
      bottom: "50%",
      zIndex: "3",
    }),
    addImageToCanvasDiv("./assets/acoustic-guitar.png", {
      class: "large-on-hover",
      height: "120%",
      left: "15%",
      bottom: "-10%",
      zIndex: "3",
      display: "none",
    }),
    addImageToCanvasDiv("./assets/electric-guitar.png", {
      class: "large-on-hover",
      height: "130%",
      left: "15%",
      bottom: "-10%",
      zIndex: "3",
      display: "none",
    }),
  ];

  for (let i = 0; i < NUM_INSTRUMENTS; i++) {
    const mi = assets.melodyInstruments[i];
    assets.sofa.appendChild(mi);
    dragElement(mi, () => {
      switchPanel("melody");
      togglePanel();
    });

    const ci = assets.chordsInstruments[i];
    assets.sofa.appendChild(ci);
    dragElement(ci, () => {
      switchPanel("chords");
      togglePanel();
    });
  }
  // assets.electricGuitar = addImageToCanvasDiv("./assets/electric-guitar.png", {
  //   class: "large-on-hover",
  //   height: "35%",
  //   right: "17%",
  //   bottom: "2%",
  //   zIndex: "3",
  // });

  assets.lamp.addEventListener("click", () => {
    data.effects.beep.start();
    assets.lampOn = !assets.lampOn;
    if (!assets.lampOn) {
      assets.lamp.src = `${window.location}/assets/lamp-off.png`;
    } else {
      assets.lamp.src = `${window.location}/assets/lamp-on.png`;
    }
  });

  assets.tvTable.addEventListener("click", () => {
    data.canvas.moveMelodyCanvasToPanel();
    switchPanel();
    togglePanel();
  });

  melodyPanelCloseSpan.addEventListener("click", () => {
    melodyPanelDiv.style.display = "none";

    // move canvas to outside
    data.canvas.moveMelodyCanvasToRoom();
  });

  const avatar = assets.avatar;
  switchAvatar = (drinking) => {
    if (drinking === undefined) {
      if (avatar.src === drinkingUrl) {
        avatar.src = notDrinkingUrl;
      } else {
        avatar.src = drinkingUrl;
      }
    } else {
      avatar.src = drinking ? drinkingUrl : notDrinkingUrl;
    }
  };
  avatar.addEventListener("click", () => {
    toggleDrumMute();
  });

  assets.cat.addEventListener("click", () => {
    assets.cat.style.display = "none";
    assets.catIndex = (assets.catIndex + 1) % catsUrls.length;
    assets.cat.src = catsUrls[assets.catIndex];
    if (assets.catIndex === 0) {
      changeBpm(75);
      changeDrumPattern(2);
    } else if (assets.catIndex === 1) {
      changeBpm(90);
      changeDrumPattern(0);
    } else {
      changeBpm(100);
      changeDrumPattern(1);
    }

    if (assets.catIndex === 2) {
      assets.cat.style.left = "41.5%";
      assets.cat.style.width = "9%";
      assets.cat.style.bottom = "39%";
    } else {
      assets.cat.style.left = "43%";
      assets.cat.style.width = "6%";
      assets.cat.style.bottom = "33%";
    }

    // MACRO
    if (assets.catIndex === 0) {
      changeChords(0);
      changeMelodyInstrument(1);
      changeMelodyByIndex(0);
      changeChordsInstrument(0);
      data.backgroundSounds.gain.gain.value = 1.0;
    } else if (assets.catIndex === 1) {
      changeChords(1);
      changeChordsInstrument(2);
      changeMelodyByIndex(1);
      changeMelodyInstrument(3);
      data.backgroundSounds.switch(1);
      data.backgroundSounds.gain.gain.value = 0.5;
    } else {
      changeChords(2);
      changeChordsInstrument(2);
      changeMelodyByIndex(2);
      changeMelodyInstrument(0); // electric guitar
      data.backgroundSounds.switch(3);
      data.backgroundSounds.gain.gain.value = 1.0;
    }

    assets.cat.onload = () => {
      assets.cat.style.display = "block";
    };
  });

  // const amp = addImageToCanvasDiv("./assets/amp.png", {
  //   class: "large-on-hover",
  //   height: "12%",
  //   right: "25%",
  //   bottom: "3%",
  //   zIndex: "3",
  // });

  assets.window.addEventListener("click", () => {
    if (checkStarted()) {
      const n = backgroundSoundsNames.length;
      data.backgroundSounds.switch((backgroundSoundsIndex + 1) % n);
    } else {
      triggerStart();
    }
  });
  assets.light.addEventListener("click", () => {
    triggerStart();
  });

  assets.logo = addImageToCanvasDiv("./assets/magenta-logo.png", {
    class: "large-on-hover",
    width: "12%",
    left: "3%",
    top: "15%",
  });

  dragElement(assets.logo, () => {
    changeChords(chordsIndex + 1);
  });

  assets.bass.addEventListener("click", () => {
    // data.bass.gain.gain.value = data.bass.gain.gain.value > 0.5 ? 0 : 1;
    switchPanel("bass");
    togglePanel();
  });
  assets.cactus.addEventListener("click", () => {
    switchPanel("background");
    togglePanel();
  });

  dragElement(assets.clock, () => {
    switchPanel("drum");
    togglePanel();
  });
  dragElement(assets.shelfWithBooks, () => {
    switchPanel("master");
    togglePanel();
  });
  // assets.piano.addEventListener("click", () => {
  //   changeChordsInstrument(1);
  // });
  // assets.acousticGuitar.addEventListener("click", () => {
  //   changeChordsInstrument(2);
  // });
  data.backgroundSounds.switch = function (index) {
    backgroundSounds.get(backgroundSoundsNames[backgroundSoundsIndex]).stop();
    backgroundSoundsIndex = index;
    backgroundSoundsSelect.value = index;
    backgroundSounds.get(backgroundSoundsNames[backgroundSoundsIndex]).start();

    // change background
    for (let i = 0; i < assets.windowGifs.length; i++) {
      if (i === index || i.toString() === index) {
        assets.windowGifs[i].style.display = "block";
      } else {
        assets.windowGifs[i].style.display = "none";
      }
    }
  };

  switchPanel();
}

function togglePanel() {
  if (melodyPanelDiv.style.display === "flex") {
    melodyPanelDiv.style.display = "none";
  } else {
    melodyPanelDiv.style.display = "flex";
  }
}

function switchPanel(name = "interpolation") {
  for (let i = 0; i < controlPanels.length; i++) {
    const el = controlPanels[i];
    if (el.id === `${name}-div`) {
      el.style.display = "flex";
    } else {
      el.style.display = "none";
    }
  }
}

function addImageToCanvasDiv(src, params) {
  let img = new Image();
  img.src = src;

  if (params.group) {
    const div = document.createElement("DIV");
    div.style.position = "absolute";
    img.style.width = "100%";
    div.appendChild(img);
    img = div;
  } else {
    img.style.position = "absolute";
  }

  if (params.class) {
    img.classList.add(params.class);
  }
  img.style.position = "absolute";

  if (!params.height) {
    img.style.width = params.width ? params.width : "25%";
  } else {
    img.style.height = params.height;
  }

  if (!params.right) {
    img.style.left = params.left ? params.left : "5%";
  } else {
    img.style.right = params.right;
  }

  if (!params.top) {
    img.style.bottom = params.bottom ? params.bottom : "5%";
  } else {
    img.style.top = params.top;
  }

  if (!params.display) {
    img.style.display = "block";
  } else {
    img.style.display = params.display;
  }

  img.style.zIndex = params.zIndex ? params.zIndex : "0";

  canvasDiv.appendChild(img);
  return img;
}

function draw() {
  drawMainCanvas();
  drawMelodyCanvas();

  requestAnimationFrame(() => {
    draw();
  });
}

function drawMainCanvas() {
  let ctx = data.canvas.canvas.getContext("2d");
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  // ctx.fillStyle = `rgba(200, 200, 200, ${Math.sin(0.01 * Date.now()) > 0 ? 1 : 0})`;
  // ctx.fillRect(0, 0, width, height);
  // ctx.fillRect(width / 30, width / 30, width / 30, width / 30);

  // progress;
  if (Tone.Transport.state === "started") {
    // ctx.fillStyle = "rgba(255, 11, 174, 1)";
    ctx.fillStyle = "rgba(200, 200, 200, 1)";
    ctx.fillRect(0, 0, width * Tone.Transport.progress, height * 0.05);
    // ctx.fillRect(width * Tone.Transport.progress, 0, 10, height);
  }

  // if (melodyMidis) {
  //   drawRect(ctx, 357, 102, 111, 61, "rgba(255, 11, 174, 0.8)");
  //   drawMidi(ctx, 357, 102, 111, 61, melodyMidis[melodyIndex]);

  //   // kick
  //   drawRect(ctx, 519, 131, 52, 190, "rgba(255, 11, 174, 0.8)");
  //   drawDrums(ctx, 519, 131, 52, 190);
  // }

  // ctx.translate(470, 166);
}

function drawMelodyCanvas() {
  let ctx = data.canvas.melodyCanvas.getContext("2d");
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  if (
    data.melody.interpolationData &&
    data.melody.interpolationData[data.melody.interpolationIndex]
  ) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, width, height);
    ctx.restore();

    drawModelData(
      ctx,
      0,
      0,
      width,
      height,
      data.melody.interpolationData[data.melody.interpolationIndex]
    );
  }
}

function drawRect(ctx, x, y, w, h, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = col;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawMidi(ctx, x, y, w, h, m) {
  let notes = m.tracks[0].notes;
  // const hh = h / 16;
  const hh = h / 32;
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < notes.length; i++) {
    const { midi, ticks, durationTicks } = notes[i];
    ctx.save();
    const xpos = (w * ticks) / TOTAL_TICKS;
    const ypos = h * (1 - (midi - 64) / 32);
    const ww = (w * durationTicks) / TOTAL_TICKS;

    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillRect(xpos, ypos, ww, hh);
    ctx.restore();
  }

  if (Tone.Transport.state === "started") {
    ctx.fillStyle = "#373fff";
    ctx.fillRect(w * Tone.Transport.progress, 0, -5, h);
  }
  ctx.restore();
}

function drawModelData(ctx, x, y, w, h, data) {
  const { notes } = data;
  const hh = h / 64;
  ctx.save();
  ctx.translate(x, y);

  // console.log(notes);
  for (let i = 0; i < notes.length; i++) {
    // const { midi, ticks, durationTicks } = notes[i];

    const totalQuantizedSteps = 32;
    const { pitch, quantizedStartStep, quantizedEndStep } = notes[i];

    ctx.save();
    const xpos = (w * quantizedStartStep) / totalQuantizedSteps;
    const ypos = h * (1 - (pitch - 64) / 64);
    const ww =
      (w * (quantizedEndStep - quantizedStartStep)) / totalQuantizedSteps;

    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(xpos, ypos, ww, hh);
    ctx.restore();
  }

  if (Tone.Transport.state === "started") {
    ctx.fillStyle = "#373fff";
    ctx.fillRect(w * ((Tone.Transport.progress * 2) % 1), 0, -5, h);
  }
  ctx.restore();
}

function drawDrums(ctx, x, y, w, h) {
  const radius = 10;

  data.drum.scale.kk = data.drum.scale.kk * 0.9;
  data.drum.scale.sn = data.drum.scale.sn * 0.9;
  data.drum.scale.hh = data.drum.scale.hh * 0.9;
  ctx.save();

  ctx.translate(x + 0.5 * w, y);

  ctx.translate(0, 0.2 * h);
  ctx.fillStyle = `rgba(255, 255, 255, ${data.drum.scale.hh})`;
  ctx.beginPath();
  // ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillRect(-5, 0, 10, 10);
  ctx.fill();

  ctx.translate(0, 0.2 * h);
  ctx.fillStyle = `rgba(255, 255, 255, ${data.drum.scale.sn})`;
  ctx.beginPath();
  // ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillRect(-5, 0, 10, 10);
  ctx.fill();

  ctx.translate(0, 0.2 * h);
  ctx.fillStyle = `rgba(255, 255, 255, ${data.drum.scale.kk})`;
  ctx.beginPath();
  // ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillRect(-5, 0, 10, 10);
  ctx.fill();

  ctx.restore();
}

function seqCallback(time, b) {
  if (!drumMute) {
    if (drumPatternIndex === 0) {
      if (b % 16 === 0) {
        data.drum.scale.kk = 1;
        drumSamples.get("kk").start(time);
      }
      if (b % 16 === 8) {
        data.drum.scale.sn = 1;
        drumSamples.get("sn").start(time);
      }
      if (b % 2 === 0) {
        data.drum.scale.hh = 1;
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
  if (data.drum.auto) {
    if (b % 32 === 31) {
      if (drumMute) {
        if (Math.random() > 0.05) {
          toggleDrumMute(false);

          // transition
          data.master.lpf.frequency.linearRampTo(20000, 1, time);
        }
      } else {
        if (Math.random() > 0.8) {
          toggleDrumMute(true);

          // transition
          data.master.lpf.frequency.linearRampTo(200, 0.5, time);
        }
      }
    }
  }

  checkTimeText.textContent = Tone.Transport.position;
  timeProgress.value = Tone.Transport.progress * 100;
}

async function loadMidiFiles() {
  chordsMidis = await Promise.all([
    Midi.fromUrl("./midi/IV_IV_I_I/IV_IV_I_I_C_1.mid"),
    Midi.fromUrl("./midi/IV_IV_I_I/IV_IV_I_I_C_3.mid"),
    Midi.fromUrl("./midi/IV_IV_I_I/IV_IV_I_I_C_2.mid"),
    // Midi.fromUrl("./midi/i_III_iv_v_Am.mid"),
    // Midi.fromUrl("./midi/VI_i_VI_v_Am.mid"),
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
  console.log(`[${loadEventsCounts}/${LOAD_EVENTS_COUNTS_THRESHOLD}]`);
  if (data.loading && loadEventsCounts >= LOAD_EVENTS_COUNTS_THRESHOLD) {
    data.loading = false;
    console.log("Finish loading!");
    onFinishLoading();
  }
}

function triggerStart() {
  if (ac.state !== "started") {
    ac.resume();
  }

  if (Tone.Transport.state === "started") {
    // stop
    Tone.Transport.stop();
    onTransportStop();
    startButton.textContent = "start";
    assets.window.src = "./assets/window-1.png";
    assets.light.src = "./assets/light-off.png";
    canvasOverlay.style.display = "flex";
  } else {
    // start
    Tone.Transport.start();
    onTransportStart();
    startButton.textContent = "stop";
    assets.window.src = "./assets/window-0.png";
    assets.light.src = "./assets/light-on.png";
    canvasOverlay.style.display = "none";
  }
}
function onFinishLoading() {
  // controlDiv.style.display = "flex";
  startButton.textContent = "start";
  startButton.addEventListener("click", () => {
    triggerStart();
  });

  function switchCallback() {
    if (data.showPanel) {
      switchScreenButton.textContent = "music";
      canvasDiv.style.display = "block";
      initCanvas();
      controlDiv.style.display = "none";
      data.showPanel = false;
    } else {
      switchScreenButton.textContent = "room";
      canvasDiv.style.display = "none";
      controlDiv.style.display = "flex";
      data.showPanel = true;
    }
  }
  switchScreenButton.addEventListener("click", switchCallback);

  changeBpm(bpm);
  bpmInput.addEventListener("input", (e) => {
    changeBpm(bpmInput.value);
  });

  drumToggle.addEventListener("change", (e) => {
    toggleDrumMute(!e.target.checked);
  });
  drumAutoToggle.addEventListener("change", (e) => {
    data.drum.auto = e.target.checked;
  });

  drumPatternsSelect.addEventListener("change", () => {
    changeDrumPattern(parseInt(drumPatternsSelect.value, 10));
    // drumPatternIndex = parseInt(drumPatternsSelect.value, 10);
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

  secondMelodySelect.addEventListener("change", () => {
    secondMelodyIndex = secondMelodySelect.value;
    sendInterpolationMessage();
  });

  backgroundSoundsSelect.addEventListener("change", () => {
    data.backgroundSounds.switch(backgroundSoundsSelect.value);
  });

  melodyInstrumentSelect.addEventListener("change", () => {
    changeMelodyInstrument(melodyInstrumentSelect.value);
  });

  // melodyInteractionSelect.addEventListener("change", () => {
  //   const mode = melodyInteractionSelect.value;
  //   melodyInteractionDivs[mode].style.display = "block";
  //   melodyInteractionDivs[1 - mode].style.display = "none";
  // });

  interpolationSlider.addEventListener("change", () => {
    const index = Math.floor(interpolationSlider.value);
    changeInterpolationIndex(index);
  });

  secondInterpolationSlider.addEventListener("change", () => {
    const index = Math.floor(secondInterpolationSlider.value);
    changeInterpolationIndex(index);
  });

  melodyVolumeSlider.addEventListener("input", (e) => {
    data.melody.changeGain(melodyVolumeSlider.value / 100);
  });
  chordsVolumeSlider.addEventListener("input", (e) => {
    data.chords.gain = e.target.value / 100;
  });

  bassVolumeSlider.addEventListener("input", () => {
    data.bass.gain.gain.value = bassVolumeSlider.value / 100;
  });
  bassToneSlider.addEventListener("input", () => {
    const frq = bassToneSlider.value * 2;
    data.bass.lpf.frequency.value = frq;
  });
  backgroundVolumeSlider.addEventListener("input", () => {
    data.backgroundSounds.gain.gain.value = backgroundVolumeSlider.value / 100;
  });

  backgroundToneSlider.addEventListener("input", () => {
    const frq = backgroundToneSlider.value * 200;
    data.backgroundSounds.hpf.frequency.value = frq;
  });

  linkInput.value = "https://www.youtube.com/watch?v=EhBSXFidyUU";
  linkInput.addEventListener("click", () => {
    linkInput.select();
  });
  submitLinkButton.addEventListener("click", (e) => {
    const id = parseYoutubeId(linkInput.value);
    if (id) {
      console.log(`youtube id:${id}`);
      assets.youtube.src = getYoutubeEmbedUrlFromId(id);
    } else {
      console.log("wrong format");
    }
  });

  masterReverbSlider.addEventListener("input", () => {
    const wet = masterReverbSlider.value / 100;
    data.master.reverb.wet.value = wet;
  });

  masterToneSlider.addEventListener("input", () => {
    const frq = masterToneSlider.value * 198 + 200;
    data.master.lpf.frequency.value = frq;
  });

  window.addEventListener("resize", () => {
    const canvas = data.canvas.canvas;
    canvasDiv.style.height = `${backgroundImage.clientWidth * (435 / 885)}px`;

    canvas.width = canvasDiv.clientWidth;
    canvas.height = canvasDiv.clientHeight;
  });

  window.addEventListener("keydown", (e) => {
    // TAB
    if (e.keyCode === 9) {
      e.preventDefault();
      switchCallback();
    }
  });

  // show canvas
  data.canvas.moveMelodyCanvasToRoom();

  // model
  sendInterpolationMessage();

  // callbacks
  data.melody.changeGain = function (v) {
    data.melody.gain = v;
    melodyVolumeSlider.value = v * 100;
    assets.ampSlider.value = v * 100;
  };

  // start youtube video
  // assets.youtube.src = getYoutubeEmbedUrlFromId();
}

function onTransportStart() {
  backgroundSounds.get(backgroundSoundsNames[backgroundSoundsIndex]).start();
}

function onTransportStop() {
  backgroundSounds.get(backgroundSoundsNames[backgroundSoundsIndex]).stop();
}

function toggleDrumMute(value) {
  if (value === undefined) {
    drumMute = !drumMute;
  } else {
    drumMute = value;
  }

  // sync ui
  drumToggle.checked = !drumMute;
  switchAvatar(drumMute);
}

function changeChords(index = 0) {
  index = index % chordsMidis.length;
  if (chordsPart) {
    chordsPart.cancel(0);
  }
  chordsIndex = index;
  chordsPart = new Tone.Part((time, note) => {
    chordsInstruments[chordsInstrumentIndex].triggerAttackRelease(
      toFreq(note.pitch - (chordsInstrumentIndex === 0 ? 0 : 12)),
      note.duration,
      time,
      note.velocity * data.chords.gain
    );
  }, midiToToneNotes(chordsMidis[chordsIndex])).start(0);

  backgroundImage.src = `${window.location}/assets/rooom-${chordsIndex}.png`;
}

function changeMelodyByIndex(index = 0) {
  if (melodyPart) {
    melodyPart.cancel(0);
  }
  melodyIndex = index;

  melodyPart = new Tone.Part((time, note) => {
    data.melody.instrument.triggerAttackRelease(
      toFreq(note.pitch - 12),
      note.duration,
      time,
      note.velocity * data.melody.gain
    );
  }, midiToToneNotes(melodyMidis[melodyIndex])).start(0);

  melodyPart.loop = false;

  firstMelodySelect.value = index;
  sendInterpolationMessage();
}

function changeMelody(readyMidi) {
  if (melodyPart) {
    melodyPart.cancel(0);
  }
  melodyPart = new Tone.Part((time, note) => {
    data.melody.instrument.triggerAttackRelease(
      toFreq(note.pitch - 12),
      note.duration,
      time,
      note.velocity * data.melody.gain
    );
  }, readyMidi).start(0);
  melodyPart.loop = true;
  melodyPart.loopEnd = "4:0:0";
}

function changeInterpolationIndex(index) {
  data.melody.interpolationIndex = index;
  changeMelody(data.melody.interpolationToneNotes[index]);

  interpolationSlider.value = index;
  secondInterpolationSlider.value = index;
}

function sendInterpolationMessage() {
  data.melody.waitingInterpolation = true;
  melodyInteractionDivs[0].classList.add("disabledbutton");

  // console.log(`interpolate ${melodyIndex} ${secondMelodyIndex}`);
  const firstMelody = melodyMidis[melodyIndex];
  const secondMelody = melodyMidis[secondMelodyIndex];
  const left = midiToModelFormat(firstMelody);
  const right = midiToModelFormat(secondMelody);

  data.melody.interpolationData[0] = left;
  data.melody.interpolationData[NUM_INTERPOLATIONS - 1] = right;

  worker.postMessage({
    id: 0,
    msg: "interpolate",
    left,
    right,
  });
}

function changeChordsInstrument(index) {
  for (let j = 0; j < NUM_INSTRUMENTS; j++) {
    if (j === parseInt(index)) {
      assets.chordsInstruments[j].style.display = "block";
    } else {
      assets.chordsInstruments[j].style.display = "none";
    }
  }

  chordsInstrumentIndex = index;
}

function changeMelodyInstrument(index) {
  for (let j = 0; j < NUM_INSTRUMENTS; j++) {
    if (j === parseInt(index)) {
      assets.melodyInstruments[j].style.display = "block";
    } else {
      assets.melodyInstruments[j].style.display = "none";
    }
  }

  melodyInstrumentSelect.value = index;
  data.melody.instrumentIndex = index;
  data.melody.instrument = chordsInstruments[index];
}

function changeBpm(v) {
  bpmInput.value = v;
  bpmValueSpan.textContent = `${v}`;
  bpm = v;
  Tone.Transport.bpm.value = v;
}

function changeDrumPattern(index) {
  drumPatternIndex = index;
  drumPatternsSelect.value = index;
}

// utils
function checkStarted() {
  return Tone.Transport.state === "started";
}

function midiToToneNotes(midi) {
  // console.log("parse this midi", midi);
  const ticksPerBeat = TICKS_PER_BAR / BEATS_PER_BAR;
  const ticksPerFourthNote = ticksPerBeat / 4;

  return midi.tracks[0].notes.map((note) => {
    return {
      time: `${Math.floor(note.ticks / TICKS_PER_BAR)}:${
        Math.floor(note.ticks / ticksPerBeat) % BEATS_PER_BAR
      }:${(note.ticks / ticksPerFourthNote) % 4}`,
      pitch: note.midi,
      duration: note.duration,
      velocity: note.velocity,
    };
  });
}

function midiToModelFormat(midi, resolution = 2) {
  const totalQuantizedSteps = MODEL_BAR_COUNT * 16;

  // console.log("parse this midi", midi);
  const totalTicks = (TOTAL_BAR_COUNTS * TICKS_PER_BAR) / resolution;

  // const notes = midi.tracks[0].notes.map((note) => ({
  //   pitch: note.midi,
  //   quantizedStartStep: Math.floor(
  //     (note.ticks / totalTicks) * totalQuantizedSteps
  //   ),
  //   quantizedEndStep: Math.floor(
  //     ((note.ticks + note.durationTicks) / totalTicks) * totalQuantizedSteps
  //   ),
  // }));
  const notes = midi.tracks[0].notes.map((note) => ({
    pitch: note.midi,
    quantizedStartStep: Math.round(
      (note.ticks / totalTicks) * totalQuantizedSteps
    ),
    quantizedEndStep: Math.round(
      ((note.ticks + note.durationTicks) / totalTicks) * totalQuantizedSteps
    ),
  }));

  return {
    notes,
    quantizationInfo: { stepsPerQuarter: 4 },
    tempos: [{ time: 0, qpm: 120 }],
    totalQuantizedSteps,
  };
}

function modelFormatToToneNotes(data) {
  const { notes } = data;
  return notes.map((note) => {
    const { pitch, quantizedStartStep, quantizedEndStep } = note;

    return {
      time: `${Math.floor(quantizedStartStep / 8)}:${Math.floor(
        (quantizedStartStep % 8) / 2
      )}:${(quantizedStartStep % 2) * 2}`,
      pitch,
      duration: (quantizedEndStep - quantizedStartStep) * (bpm / 60) * (1 / 4),
      velocity: 0.7,
    };
  });
}

function toFreq(m) {
  return Tone.Frequency(m, "midi");
}

// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
function parseYoutubeId(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}

function getYoutubeEmbedUrlFromId(id = "0HYq9kTOT70") {
  return `https://www.youtube.com/embed/${id}?&loop=1&autoplay=1&controls=0&mute=1&vq=tiny`;
}

function filterNotesInScale(data) {
  return data.map((d) => {
    d.notes = d.notes.filter(({ pitch }) => {
      const p = pitch % 12;
      return [0, 2, 4, 5, 7, 9, 11].includes(p);
    });
    return d;
  });
}

function removeElement(el) {
  el.parentNode.removeChild(el);
}

function dragElement(elmnt, onClickCallback) {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  let dragging = false;
  elmnt.onmousedown = dragMouseDown;
  elmnt.addEventListener("click", (e) => {
    if (!dragging) {
      onClickCallback(e);
    }
    dragging = false;
  });

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    dragging = true;
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

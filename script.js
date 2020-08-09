const warningOverlay = document.getElementById('warning-overlay');
const startButton = document.getElementById('start-button');
const whateverButton = document.getElementById('whatever-button');
const checkTimeButton = document.getElementById('check-time-button');
const checkTimeText = document.getElementById('check-time-text');
const bpmInput = document.getElementById('bpm-input');
const bpmValueSpan = document.getElementById('bpm-value');
const drumPatternsSelect = document.getElementById('drum-patterns-select');
const drumToggle = document.getElementById('drum-toggle');
const drumAutoToggle = document.getElementById('drum-auto-toggle');
const chordsSelect = document.getElementById('chords-select');
const chordsInstrumentSelect = document.getElementById('chords-instrument-select');
const backgroundSoundsSelect = document.getElementById('background-samples-select');
const firstMelodySelect = document.getElementById('first-melody-select');
const secondMelodySelect = document.getElementById('second-melody-select');
const melodyInteractionSelect = document.getElementById('melody-interaction-select');
const melodyInteractionDivs = [
  document.getElementById('interpolation-div'),
  document.getElementById('mixing-div'),
];
const melodyInstrumentSelect = document.getElementById('melody-instrument-select');
const interpolationSlider = document.getElementById('interpolation-slider');
const secondInterpolationSlider = document.getElementById('interpolation-slider-2');
const backgroundVolumeSlider = document.getElementById('background-volume-slider');
const backgroundToneSlider = document.getElementById('background-tone-slider');
const canvasDiv = document.getElementById('canvas-div');
const canvasOverlay = document.getElementById('canvas-overlay');
const melodyPanelDiv = document.getElementById('melody-panel-div');
const interpolationDiv = document.getElementById('interpolation-div');
const melodyPanelCloseSpan = document.getElementById('melody-panel-close');
const timeProgress = document.getElementById('time-progress');
const backgroundImage = document.getElementById('background-image');
const bassVolumeSlider = document.getElementById('bass-volume-slider');
const bassToneSlider = document.getElementById('bass-tone-slider');
const melodyVolumeSlider = document.getElementById('melody-volume-slider');
const chordsVolumeSlider = document.getElementById('chords-volume-slider');
const masterReverbSlider = document.getElementById('master-reverb-slider');
const masterToneSlider = document.getElementById('master-tone-slider');
const masterVolumeSlider = document.getElementById('master-volume-slider');
const melodySwingSlider = document.getElementById('melody-swing-slider');
const chordsSwingSlider = document.getElementById('chords-swing-slider');
const controlPanels = document.getElementsByClassName('panel');
const connectYoutubeButton = document.getElementById('connect-youtube-button');
const youtubePromptText = document.getElementById('youtube-prompt-text');
const youtubePromptDiv = document.getElementById('youtube-prompt-div');
const youtubeDiv = document.getElementById('youtube-div');
const youtubeButtons = document.getElementById('youtube-buttons');
const collapseYoutubeDivButton = document.getElementById('collapse-youtube-div-button');
const bubbleDiv = document.getElementById('bubble-div');

const LOAD_EVENTS_COUNTS_THRESHOLD = 8;
const TOTAL_BAR_COUNTS = 8;
const TICKS_PER_BAR = 384;
const BEATS_PER_BAR = 4;
const TOTAL_TICKS = TOTAL_BAR_COUNTS * TICKS_PER_BAR;
const MODEL_BAR_COUNT = 2;
const MAIN_CANVAS_PADDING = 0;
const NUM_INTERPOLATIONS = 5;
const TRANSITION_PROB = 0.2;

const SAMPLES_BASE_URL = './samples';
const SYNTHS = 0;
const PIANO = 1;
const ACOUSTIC_GUITAR = 2;
const ELETRIC_GUITAR = 3;
const NUM_INSTRUMENTS = 4;
const CHANNEL_ID = 'UCizuHuCAHmpTa6EFeZS2Hqg';

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const worker = new Worker('worker.js');
const ac = Tone.context._context;
let presetMelodiesCount = 4;
let fetchIntervalId;

const data = {
  loading: true,
  started: false,
  loadEventsCount: 0,
  showPanel: false,
  backgroundSounds: {
    samples: [],
    names: ['rain', 'waves', 'street', 'kids'],
    index: 0,
  },
  instruments: {},
  melody: {
    part: null,
    gain: 1,
    swing: 0,
    changeGain: (v) => {
      data.melody.gain = v;
    },
    instrumentIndex: 1,
    waitingInterpolation: true,
    midis: [],
    toneNotes: [],
    index: 0,
    secondIndex: 1,
    interpolationToneNotes: [],
    interpolationData: [],
    interpolationIndex: 0,
  },
  chords: {
    part: null,
    index: 0,
    gain: 1,
    swing: 0,
    midis: null,
    instrumentIndex: 0,
  },
  bass: {
    notes: [
      { time: '0:0:0', note: 'F2', duration: { '1m': 0.7 }, velocity: 1.0 },
      { time: '1:0:0', note: 'F2', duration: { '1m': 0.7 }, velocity: 1.0 },
      { time: '2:0:0', note: 'C2', duration: { '1m': 0.7 }, velocity: 1.0 },
      { time: '3:0:0', note: 'C2', duration: { '1m': 0.7 }, velocity: 1.0 },
    ],
  },
  canvas: {},
  seq: {},
  drum: {
    mute: false,
    names: ['kk', 'sn', 'hh'],
    samples: [],
    auto: true,
    patternIndex: 0,
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
    lpf: new Tone.Filter(20000, 'lowpass'),
    reverb: new Tone.Reverb({
      decay: 1.0,
      preDelay: 0.01,
    }),
    bpm: 75,
    gain: new Tone.Gain(0.3),
  },
};

const assets = {
  defaultBoardText: 'Vibert Thio 2020.',
  catIndex: 0,
  avatarUrls: [`./assets/avatar-2.png`, `./assets/avatar.png`],
  catUrls: ['./assets/cat-75-purple.gif', './assets/cat-90.gif', './assets/dog-100.gif'],
};

addImages();
loadMidiFiles();
initModel();
initSounds();
initCanvas();

function onClickWhatever() {
  warningOverlay.style.display = 'none';
}

function initSounds() {
  Tone.Transport.bpm.value = data.master.bpm;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = '0:0:0';
  Tone.Transport.loopEnd = '8:0:0';

  Tone.Master.chain(
    data.master.masterCompressor,
    data.master.reverb,
    data.master.lpf,
    data.master.gain
  );
  data.master.reverb.generate().then(() => {
    console.log('master reverb ready');
    checkFinishLoading();
  });
  data.master.reverb.wet.value = 0;

  const drumUrls = {};
  data.drum.names.forEach((n) => (drumUrls[n] = `${SAMPLES_BASE_URL}/drums/${n}.mp3`));
  data.drum.samples = new Tone.Players(drumUrls, () => {
    console.log('drums loaded');
    checkFinishLoading();
  }).toMaster();

  data.backgroundSounds.gain = new Tone.Gain(1).toMaster();
  // data.backgroundSounds.hpf = new Tone.Filter(0, "highpass").connect(data.backgroundSounds.gain);
  data.backgroundSounds.hpf = new Tone.Filter(20000, 'lowpass').connect(data.backgroundSounds.gain);
  const sampleUrls = {};
  data.backgroundSounds.names.forEach((n) => (sampleUrls[n] = `${SAMPLES_BASE_URL}/fx/${n}.mp3`));
  data.backgroundSounds.samples = new Tone.Players(sampleUrls, () => {
    console.log('background sounds loaded');
    checkFinishLoading();
  }).connect(data.backgroundSounds.hpf);

  data.effects.beep = new Tone.Player(`${SAMPLES_BASE_URL}/effects/beep.mp3`, () => {
    checkFinishLoading();
  }).toMaster();

  data.backgroundSounds.names.forEach((name) => {
    data.backgroundSounds.samples.get(name).loop = true;
  });
  data.seq = new Tone.Sequence(
    seqCallback,
    Array(128)
      .fill(null)
      .map((_, i) => i),
    '16n'
  );
  data.seq.start(0);

  const reverb = new Tone.Reverb({
    decay: 8.5,
    preDelay: 0.1,
  }).toMaster();
  reverb.generate().then(() => {
    console.log('reverb ready');
    checkFinishLoading();
  });
  reverb.wet.value = 0.3;
  const lpf = new Tone.Filter(1000, 'lowpass').connect(reverb);
  const hpf = new Tone.Filter(1, 'highpass').connect(lpf);
  const chorus = new Tone.Chorus(4, 2.5, 0.1).connect(hpf);

  data.instruments[SYNTHS] = new Tone.PolySynth(10, Tone.Synth, {
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1,
    },
  }).connect(chorus);

  data.instruments[PIANO] = SampleLibrary.load({
    instruments: 'piano',
  });
  data.instruments[ACOUSTIC_GUITAR] = SampleLibrary.load({
    instruments: 'guitar-acoustic',
  });
  data.instruments[ELETRIC_GUITAR] = SampleLibrary.load({
    instruments: 'guitar-electric',
  });

  const { bass } = data;
  bass.gain = new Tone.Gain(1).connect(reverb);
  bass.lpf = new Tone.Filter(200, 'lowpass').connect(bass.gain);
  bass.instrument = new Tone.Synth({
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.3,
      release: 0.8,
    },
  }).connect(bass.lpf);
  bass.part = new Tone.Part((time, note) => {
    bass.instrument.triggerAttackRelease(note.note, note.duration, time, note.velocity);
  }, bass.notes).start(0);
  bass.part.loop = true;
  bass.part.loopEnd = '4:0:0';

  data.instruments[PIANO].connect(chorus);
  data.instruments[ACOUSTIC_GUITAR].connect(chorus);
  data.instruments[ELETRIC_GUITAR].connect(chorus);

  data.melody.instrument = data.instruments[PIANO];

  Tone.Buffer.on('load', () => {
    checkFinishLoading();
    console.log('buffers loaded');
  });
}

function initModel() {
  worker.postMessage({ msg: 'init' });
  worker.onmessage = (e) => {
    if (e.data.msg === 'init') {
      console.log('model loaded');
      checkFinishLoading();
    }
    if (e.data.msg === 'interpolate') {
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
      data.melody.interpolationToneNotes[0] = data.melody.toneNotes[data.melody.index];
      data.melody.interpolationToneNotes[data.melody.interpolationToneNotes.length - 1] =
        data.melody.toneNotes[data.melody.secondIndex];

      data.melody.waitingInterpolation = false;

      // console.log("interpolationData", data.melody.interpolationData);
      // console.log("interpolationToneNotes", data.melody.interpolationToneNotes);
      data.canvas.melodyCanvas.style.opacity = 1;
      melodyInteractionDivs[0].classList.remove('disabledbutton');
    }
    if (e.data.msg === 'continue') {
      let { id, result } = e.data;
      result.notes = filterNotesInScaleSingle(result.notes);
      result.notes = result.notes.map((note) => {
        note.pitch += 24;
        return note;
      });

      data.melody.interpolationData[0] = result[0];
      const notes = modelFormatToToneNotes(result);
      const n = data.melody.toneNotes.length;
      data.melody.toneNotes[n - 1] = notes; // update toneNotes
      changeMelody(notes); // change played melody part
      data.melody.index = n - 1; // change index
      firstMelodySelect.value = n - 1; // change ui index
      sendInterpolationMessage(result); // update interpolation
    }
  };
}

function initCanvas() {
  const canvas = document.getElementById('main-canvas');
  data.canvas.canvas = canvas;

  canvasDiv.style.height = `${backgroundImage.clientWidth * (435 / 885)}px`;

  canvas.width = canvasDiv.clientWidth;
  canvas.height = canvasDiv.clientHeight;

  canvasDiv.addEventListener('mousedown', (e) => {
    const { clientX, clientY } = e;
    let canvasRect = canvas.getBoundingClientRect();
    const mouseX = clientX - canvasRect.left - MAIN_CANVAS_PADDING;
    const mouseY = clientY - canvasRect.top - MAIN_CANVAS_PADDING;

    // console.log(`x: ${mouseX} y: ${mouseY}`);
  });

  const melodyCanvas = document.getElementById('melody-canvas');
  data.canvas.melodyCanvas = melodyCanvas;
  data.canvas.moveMelodyCanvasToPanel = function () {
    removeElement(melodyCanvas);
    melodyCanvas.style.position = 'static';
    melodyCanvas.style.width = '100%';
    melodyCanvas.style.height = '100%';
    melodyCanvas.style.opacity = 1.0;
    interpolationDiv.append(melodyCanvas);
  };

  data.canvas.moveMelodyCanvasToRoom = function () {
    melodyCanvas.style.position = 'absolute';
    // melodyCanvas.style.top = "12%";
    // melodyCanvas.style.left = "23%";
    // melodyCanvas.style.width = "45%";
    // melodyCanvas.style.height = "41%";
    melodyCanvas.style.top = '16%';
    melodyCanvas.style.left = '7.5%';
    melodyCanvas.style.width = '78%';
    melodyCanvas.style.height = '52%';

    melodyCanvas.style.zIndex = 1;
    melodyCanvas.style.opacity = 0.93;
    assets.tvTable.append(melodyCanvas);
  };

  draw();
}

function addImages() {
  const rainGif = addImageToCanvasDiv('./assets/snow.gif', {
    width: '45%',
    left: '20%',
    zIndex: '-2',
    bottom: '0',
  });

  assets.light = addImageToCanvasDiv('./assets/light-off.png', {
    class: 'large-on-hover',
    width: '8%',
    left: '50%',
    top: '-2%',
    zIndex: '2',
  });
  dragElement(
    assets.light,
    () => {
      toggleStart();
    },
    { horizontal: true }
  );

  assets.window = addImageToCanvasDiv('./assets/window-1.png', {
    class: 'large-on-hover-micro',
    width: '38%',
    left: '17%',
    zIndex: '0',
    top: '20.3%',
  });

  const wavesGif = addImageToCanvasDiv('./assets/waves.gif', {
    width: '38%',
    left: '20%',
    zIndex: '-2',
    top: '21%',
  });

  const streetGif = addImageToCanvasDiv('./assets/city-2.gif', {
    width: '60%',
    left: '20%',
    zIndex: '-2',
    top: '-40%',
  });

  const kidsGif = addImageToCanvasDiv('./assets/city.gif', {
    width: '33%',
    left: '20%',
    zIndex: '-2',
    top: '14%',
  });

  // rainGif.style.display = 'none';
  streetGif.style.display = 'none';
  wavesGif.style.display = 'none';
  kidsGif.style.display = 'none';

  assets.windowGifs = [rainGif, wavesGif, kidsGif, streetGif];

  assets.catGroup = addImageToCanvasDiv(assets.catUrls[assets.catIndex], {
    class: 'large-on-hover',
    width: '6%',
    bottom: '33%',
    left: '43%',
    zIndex: '4',
    group: true,
  });
  assets.cat = assets.catGroup.childNodes[0];

  assets.avatarGroup = addImageToCanvasDiv(assets.avatarUrls[1], {
    class: 'large-on-hover-micro',
    width: '11%',
    left: '20%',
    zIndex: '4',
    group: true,
  });
  assets.avatar = assets.avatarGroup.childNodes[0];
  assets.avatarGroup.appendChild(bubbleDiv);

  assets.cactus = addImageToCanvasDiv('./assets/cactus.png', {
    class: 'large-on-hover',
    width: '3%',
    bottom: '39%',
    left: '38%',
  });

  assets.chair = addImageToCanvasDiv('./assets/chair-red.png', {
    width: '10%',
    left: '10%',
  });

  dragElement(assets.chair, undefined, { horizontal: true });

  assets.desk = addImageToCanvasDiv('./assets/desk.png', {
    width: '21%',
    left: '1%',
    group: true,
  });

  assets.lamp = addImageToCanvasDiv('./assets/lamp-on.png', {
    class: 'large-on-hover',
    width: '20%',
    left: '20%',
    bottom: '100%',
    zIndex: '4',
  });
  assets.desk.appendChild(assets.lamp);
  assets.lampOn = true;

  assets.pens = addImageToCanvasDiv('./assets/pens.png', {
    class: 'large-on-hover',
    width: '12%',
    right: '40%',
    bottom: '100%',
    zIndex: '1',
  });

  assets.desk.appendChild(assets.pens);
  dragElement(assets.desk, undefined, { horizontal: true });

  assets.shelfWithBooks = addImageToCanvasDiv('./assets/shelf.png', {
    class: 'large-on-hover',
    width: '12%',
    left: '3%',
    bottom: '60%',
  });

  assets.board = addImageToCanvasDiv('./assets/board.png', {
    class: 'large-on-hover',
    width: '12%',
    right: '20%',
    top: '34%',
    zIndex: '1',
    group: true,
  });
  const textInput = document.createElement('textarea');
  textInput.id = 'board-input';
  textInput.value = assets.defaultBoardText;
  textInput.spellcheck = false;
  assets.textInput = textInput;
  assets.board.appendChild(textInput);
  textInput.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  dragElement(assets.board);

  assets.shelf = addImageToCanvasDiv('./assets/shelf-blank-2.png', {
    class: 'large-on-hover',
    width: '12%',
    right: '20%',
    top: '22%',
    zIndex: '1',
    group: true,
  });
  assets.plant = addImageToCanvasDiv('./assets/vine-2.png', {
    width: '40%',
    right: '10%',
    bottom: '45%',
    zIndex: '4',
  });
  assets.secondPlant = addImageToCanvasDiv('./assets/vine-4.png', {
    width: '60%',
    left: '0%',
    bottom: '15%',
    zIndex: '4',
  });

  // assets.secondPlant = addImageToCanvasDiv("./assets/plant-1.png", {
  //   width: "45%",
  //   left: "0%",
  //   bottom: "100%",
  //   zIndex: "4",
  // });

  assets.shelf.appendChild(assets.plant);
  assets.shelf.appendChild(assets.secondPlant);
  // dragElement(assets.plant);
  // dragElement(assets.secondPlant);
  dragElement(assets.shelf, () => {
    changeChords(data.chords.index + 1);
  });

  assets.tvStand = addImageToCanvasDiv('./assets/tv-stand.png', {
    width: '20%',
    left: '35%',
    zIndex: '3',
    group: true,
  });
  assets.tvTable = addImageToCanvasDiv('./assets/tv-color.png', {
    class: 'large-on-hover',
    width: '50%',
    bottom: '95%',
    left: '15%',
    zIndex: '1',
    group: true,
  });
  assets.radio = addImageToCanvasDiv('./assets/radio.png', {
    class: 'large-on-hover',
    width: '18%',
    bottom: '95%',
    right: '10%',
    zIndex: '1',
  });

  let radioSlider = secondInterpolationSlider;
  removeElement(radioSlider);

  assets.tvStand.append(assets.tvTable);
  assets.tvStand.append(assets.radio);
  assets.tvStand.append(radioSlider);
  dragElement(assets.tvStand, undefined, { horizontal: true });
  assets.radio.addEventListener('click', () => {
    sendContinueMessage();
  });

  assets.tvTable.addEventListener('click', () => {
    data.canvas.moveMelodyCanvasToPanel();
    switchPanel();
    togglePanel();
  });

  assets.sofa = addImageToCanvasDiv('./assets/sofa-1.png', {
    width: '35%',
    right: '3%',
    zIndex: '2',
    group: true,
  });
  dragElement(assets.sofa, undefined, { horizontal: true });

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

  const ifrm = document.createElement('iframe');
  // ifrm.setAttribute("frameborder", "0");
  // ifrm.style.position = "absolute";
  // ifrm.style.top = "16.6%";
  // ifrm.style.left = "7.5%";
  // ifrm.style.width = "78%";
  // ifrm.style.height = "51%";
  // ifrm.style.zIndex = "1";
  // assets.tv.appendChild(ifrm);

  assets.youtube = ifrm;

  assets.cabinetRight = addImageToCanvasDiv('./assets/cabinet-2.png', {
    width: '10%',
    right: '30%',
    bottom: '9%',
    zIndex: '1',
    group: true,
  });
  dragElement(assets.cabinetRight, undefined, { horizontal: true });

  assets.time = setClock();

  assets.clock = addImageToCanvasDiv('./assets/clock-3.png', {
    class: 'large-on-hover',
    width: '78%',
    right: '10%',
    top: '-21%',
    // bottom: "100%",
    group: true,
  });
  assets.clock.appendChild(assets.time);
  assets.cabinetRight.appendChild(assets.clock);

  assets.bass = addImageToCanvasDiv('./assets/bass-wall.png', {
    class: 'large-on-hover',
    height: '40%',
    right: '10%',
    top: '10%',
    zIndex: '0',
  });

  // assets.acousticGuitar = addImageToCanvasDiv("./assets/acoustic-guitar.png", {
  //   class: "large-on-hover",
  //   height: "30%",
  //   right: "17%",
  //   bottom: "2%",
  //   zIndex: "3",
  // });

  assets.chordsInstruments = [
    addImageToCanvasDiv('./assets/synth.png', {
      class: 'large-on-hover',
      height: '28%',
      right: '30%',
      top: '-28%',
      zIndex: '2',
    }),
    addImageToCanvasDiv('./assets/piano.png', {
      class: 'large-on-hover',
      height: '28%',
      right: '30%',
      top: '-28%',
      zIndex: '2',
      display: 'none',
    }),
    addImageToCanvasDiv('./assets/acoustic-guitar.png', {
      class: 'large-on-hover',
      height: '120%',
      left: '40%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
    }),
    addImageToCanvasDiv('./assets/electric-guitar.png', {
      class: 'large-on-hover',
      height: '130%',
      left: '40%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
    }),
  ];

  assets.melodyInstruments = [
    addImageToCanvasDiv('./assets/synth.png', {
      class: 'large-on-hover',
      width: '30%',
      right: '52%',
      bottom: '45%',
      zIndex: '3',
      display: 'none',
    }),
    addImageToCanvasDiv('./assets/piano.png', {
      class: 'large-on-hover',
      width: '30%',
      right: '52%',
      bottom: '45%',
      zIndex: '3',
    }),
    addImageToCanvasDiv('./assets/acoustic-guitar.png', {
      class: 'large-on-hover',
      height: '120%',
      left: '15%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
    }),
    addImageToCanvasDiv('./assets/electric-guitar.png', {
      class: 'large-on-hover',
      height: '130%',
      left: '15%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
    }),
  ];

  for (let i = 0; i < NUM_INSTRUMENTS; i++) {
    const mi = assets.melodyInstruments[i];
    assets.sofa.appendChild(mi);
    dragElement(mi, () => {
      switchPanel('melody');
      togglePanel();
    });

    const ci = assets.chordsInstruments[i];
    assets.sofa.appendChild(ci);
    dragElement(ci, () => {
      switchPanel('chords');
      togglePanel();
    });
  }

  assets.lamp.addEventListener('click', () => {
    data.effects.beep.start();
    assets.lampOn = !assets.lampOn;
    if (!assets.lampOn) {
      assets.lamp.src = `./assets/lamp-off.png`;
    } else {
      assets.lamp.src = `./assets/lamp-on.png`;
    }
  });

  melodyPanelCloseSpan.addEventListener('click', () => {
    melodyPanelDiv.style.display = 'none';

    // move canvas to outside
    data.canvas.moveMelodyCanvasToRoom();
  });

  assets.switchAvatar = (drinking) => {
    const { avatar } = assets;
    if (drinking === undefined) {
      if (avatar.src === assets.avatarUrls[0]) {
        avatar.src = assets.avatarUrls[1];
      } else {
        avatar.src = assets.avatarUrls[0];
      }
    } else {
      avatar.src = drinking ? assets.avatarUrls[0] : assets.avatarUrls[1];
    }
  };
  dragElement(
    assets.avatarGroup,
    () => {
      toggleDrumMute(undefined, true, Tone.now());
    },
    { horizontal: true }
  );

  assets.catCallback = () => {
    assets.cat.style.display = 'none';
    assets.catIndex = (assets.catIndex + 1) % assets.catUrls.length;
    assets.cat.src = assets.catUrls[assets.catIndex];
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
      assets.catGroup.style.left = '42%';
      assets.catGroup.style.width = '8%';
      assets.catGroup.style.bottom = '39%';
    } else {
      assets.catGroup.style.left = '43%';
      assets.catGroup.style.width = '6%';
      assets.catGroup.style.bottom = '33%';
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
      assets.cat.style.display = 'block';
    };
  };
  dragElement(assets.catGroup, assets.catCallback, {
    horizontal: false,
  });

  // const amp = addImageToCanvasDiv("./assets/amp.png", {
  //   class: "large-on-hover",
  //   height: "12%",
  //   right: "25%",
  //   bottom: "3%",
  //   zIndex: "3",
  // });

  assets.window.addEventListener('click', () => {
    if (checkStarted()) {
      const n = data.backgroundSounds.names.length;
      data.backgroundSounds.switch((data.backgroundSounds.index + 1) % n);
    } else {
      toggleStart();
    }
  });

  assets.logo = addImageToCanvasDiv('./assets/magenta-logo.png', {
    class: 'large-on-hover',
    width: '12%',
    left: '3%',
    top: '15%',
  });

  dragElement(assets.logo, () => {
    stopTransport();
    window.open('https://magenta.tensorflow.org/', '_blank');
  });

  dragElement(assets.bass, () => {
    // data.bass.gain.gain.value = data.bass.gain.gain.value > 0.5 ? 0 : 1;
    switchPanel('bass');
    togglePanel();
  });
  dragElement(
    assets.cactus,
    () => {
      switchPanel('background');
      togglePanel();
    },
    {
      horizontal: true,
    }
  );

  dragElement(assets.clock, () => {
    switchPanel('drum');
    togglePanel();
  });
  dragElement(assets.shelfWithBooks, () => {
    switchPanel('info');
    togglePanel();
  });
  dragElement(assets.pens, () => {
    switchPanel('master');
    togglePanel();
  });

  data.backgroundSounds.switch = function (index) {
    data.backgroundSounds.samples
      .get(data.backgroundSounds.names[data.backgroundSounds.index])
      .stop();
    data.backgroundSounds.index = index;
    backgroundSoundsSelect.value = index;
    data.backgroundSounds.samples
      .get(data.backgroundSounds.names[data.backgroundSounds.index])
      .start();

    // change background
    for (let i = 0; i < assets.windowGifs.length; i++) {
      if (i === index || i.toString() === index) {
        assets.windowGifs[i].style.display = 'block';
      } else {
        assets.windowGifs[i].style.display = 'none';
      }
    }
  };

  switchPanel();
}

function togglePanel() {
  if (melodyPanelDiv.style.display === 'flex') {
    melodyPanelDiv.style.display = 'none';
  } else {
    melodyPanelDiv.style.display = 'flex';
  }
}

function switchPanel(name = 'interpolation') {
  for (let i = 0; i < controlPanels.length; i++) {
    const el = controlPanels[i];
    if (el.id === `${name}-div`) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  }
}

function addImageToCanvasDiv(src, params) {
  let img = new Image();
  img.src = src;

  if (params.group) {
    const div = document.createElement('DIV');
    div.style.position = 'absolute';

    img.style.width = '100%';
    img.style.top = '0';
    img.style.left = '0';
    img.style.margin = '0';
    div.appendChild(img);
    img = div;
  } else {
    img.style.position = 'absolute';
  }

  if (params.class) {
    img.classList.add(params.class);
  }
  img.style.position = 'absolute';

  if (!params.height) {
    img.style.width = params.width ? params.width : '25%';
    img.style.height = 'auto';
  } else {
    img.style.height = params.height;
    img.style.width = 'auto';
  }

  if (!params.right) {
    img.style.left = params.left ? params.left : '5%';
  } else {
    img.style.right = params.right;
  }

  if (!params.top) {
    img.style.bottom = params.bottom ? params.bottom : '5%';
  } else {
    img.style.top = params.top;
  }

  if (!params.display) {
    img.style.display = 'block';
  } else {
    img.style.display = params.display;
  }

  img.style.zIndex = params.zIndex ? params.zIndex : '0';

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
  let ctx = data.canvas.canvas.getContext('2d');
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  // ctx.fillStyle = `rgba(200, 200, 200, ${Math.sin(0.01 * Date.now()) > 0 ? 1 : 0})`;
  // ctx.fillRect(0, 0, width, height);
  // ctx.fillRect(width / 30, width / 30, width / 30, width / 30);

  // progress;
  if (Tone.Transport.state === 'started') {
    // ctx.fillStyle = "rgba(255, 11, 174, 1)";
    ctx.fillStyle = 'rgba(200, 200, 200, 1)';
    ctx.fillRect(0, 0, width * Tone.Transport.progress, height * 0.05);
    // ctx.fillRect(width * Tone.Transport.progress, 0, 10, height);
  }

  // if (data.melody.midis) {
  //   drawRect(ctx, 357, 102, 111, 61, "rgba(255, 11, 174, 0.8)");
  //   drawMidi(ctx, 357, 102, 111, 61, data.melody.midis[data.melody.index]);

  //   // kick
  //   drawRect(ctx, 519, 131, 52, 190, "rgba(255, 11, 174, 0.8)");
  //   drawDrums(ctx, 519, 131, 52, 190);
  // }

  // ctx.translate(470, 166);
}

function drawMelodyCanvas() {
  let ctx = data.canvas.melodyCanvas.getContext('2d');
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  if (
    data.melody.interpolationData &&
    data.melody.interpolationData[data.melody.interpolationIndex]
  ) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
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

    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(xpos, ypos, ww, hh);
    ctx.restore();
  }

  if (Tone.Transport.state === 'started') {
    ctx.fillStyle = '#373fff';
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
    const ww = (w * (quantizedEndStep - quantizedStartStep)) / totalQuantizedSteps;

    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(xpos, ypos, ww, hh);
    ctx.restore();
  }

  if (Tone.Transport.state === 'started') {
    ctx.fillStyle = '#373fff';
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
  if (!data.drum.mute) {
    if (data.drum.patternIndex === 0) {
      if (b % 16 === 0) {
        data.drum.scale.kk = 1;
        data.drum.samples.get('kk').start(time);
      }
      if (b % 16 === 8) {
        data.drum.scale.sn = 1;
        data.drum.samples.get('sn').start(time);
      }
      if (b % 2 === 0) {
        data.drum.scale.hh = 1;
        data.drum.samples.get('hh').start(time);
      }
    } else if (data.drum.patternIndex === 1) {
      if (b % 32 === 0 || b % 32 === 20) {
        data.drum.samples.get('kk').start(time);
      }
      if (b % 16 === 8) {
        data.drum.samples.get('sn').start(time);
      }
      if (b % 2 === 0) {
        data.drum.samples.get('hh').start(time + 0.07);
      }
    } else if (data.drum.patternIndex === 2) {
      if (b % 16 === 0 || b % 16 === 10 || (b % 32 >= 16 && b % 16 === 11)) {
        data.drum.samples.get('kk').start(time);
      }
      if (b % 8 === 4) {
        data.drum.samples.get('sn').start(time);
      }
      if (b % 2 === 0) {
        data.drum.samples.get('hh').start(time + 0.07);
      }
    }
  }

  // Markov chain
  if (data.drum.auto) {
    if (b % 32 === 31) {
      if (data.drum.mute) {
        if (Math.random() > 0.05) {
          toggleDrumMute(false, true, time);
        }
      } else {
        if (Math.random() < TRANSITION_PROB) {
          toggleDrumMute(true, true, time);
        }
      }
    }
  }

  checkTimeText.textContent = Tone.Transport.position;
  timeProgress.value = Tone.Transport.progress * 100;
}

async function loadMidiFiles() {
  data.chords.midis = await Promise.all([
    Midi.fromUrl('./midi/IV_IV_I_I/IV_IV_I_I_C_1.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/IV_IV_I_I_C_3.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/IV_IV_I_I_C_2.mid'),
    // Midi.fromUrl("./midi/i_III_iv_v_Am.mid"),
    // Midi.fromUrl("./midi/VI_i_VI_v_Am.mid"),
  ]);

  changeChords(data.chords.index);

  data.melody.midis = await Promise.all([
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_1_C.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_2_C.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_3_C.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_4_C.mid'),
  ]);
  data.melody.midis[4] = data.melody.midis[0]; // placeholder
  data.melody.toneNotes = data.melody.midis.map(midiToToneNotes);

  changeMelodyByIndex(data.melody.index);

  console.log('midi loaded');
  // console.log("midi loaded", data.melody.midis[0]);
  checkFinishLoading();
}

function checkFinishLoading() {
  data.loadEventsCount += 1;
  console.log(`[${data.loadEventsCount}/${LOAD_EVENTS_COUNTS_THRESHOLD}]`);
  if (data.loading && data.loadEventsCount >= LOAD_EVENTS_COUNTS_THRESHOLD) {
    data.loading = false;
    console.log('Finish loading!');
    onFinishLoading();
  } else if (data.loading) {
    const percentage = Math.floor((data.loadEventsCount / LOAD_EVENTS_COUNTS_THRESHOLD) * 100);
    startButton.textContent = `loading...${percentage}/100%`;
  }
}

function toggleStart() {
  if (ac.state !== 'started') {
    ac.resume();
  }

  if (Tone.Transport.state === 'started') {
    stopTransport();
  } else {
    startTransport();
  }
}

function startTransport() {
  Tone.Transport.start();
  onTransportStart();
  startButton.textContent = 'stop';
  assets.window.src = './assets/window-0.png';
  assets.light.src = './assets/light-on.png';
  canvasOverlay.style.display = 'none';
}

function stopTransport() {
  Tone.Transport.stop();
  onTransportStop();
  startButton.textContent = 'start';
  assets.window.src = './assets/window-1.png';
  assets.light.src = './assets/light-off.png';
  canvasOverlay.style.display = 'flex';
}

function onFinishLoading() {
  canvasOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  startButton.textContent = 'start';
  startButton.addEventListener('click', () => {
    if (!data.started) {
      data.started = true;
      onFirstTimeStarted();
    }
    toggleStart();
  });

  changeBpm(data.master.bpm);
  bpmInput.addEventListener('input', (e) => {
    changeBpm(bpmInput.value);
  });

  drumToggle.addEventListener('change', (e) => {
    toggleDrumMute(!e.target.checked);
  });
  drumAutoToggle.addEventListener('change', (e) => {
    data.drum.auto = e.target.checked;
  });

  drumPatternsSelect.addEventListener('change', () => {
    changeDrumPattern(parseInt(drumPatternsSelect.value, 10));
    // data.drum.patternIndex = parseInt(drumPatternsSelect.value, 10);
  });

  chordsSelect.addEventListener('change', () => {
    changeChords(chordsSelect.value);
  });
  chordsInstrumentSelect.addEventListener('change', () => {
    changeChordsInstrument(chordsInstrumentSelect.value);
  });

  firstMelodySelect.addEventListener('change', () => {
    changeMelodyByIndex(parseInt(firstMelodySelect.value));
  });

  secondMelodySelect.addEventListener('change', () => {
    data.melody.secondIndex = secondMelodySelect.value;
    sendInterpolationMessage(data.melody.interpolationData[0]);
  });

  backgroundSoundsSelect.addEventListener('change', () => {
    data.backgroundSounds.switch(backgroundSoundsSelect.value);
  });

  melodyInstrumentSelect.addEventListener('change', () => {
    changeMelodyInstrument(melodyInstrumentSelect.value);
  });

  // melodyInteractionSelect.addEventListener("change", () => {
  //   const mode = melodyInteractionSelect.value;
  //   melodyInteractionDivs[mode].style.display = "block";
  //   melodyInteractionDivs[1 - mode].style.display = "none";
  // });

  interpolationSlider.addEventListener('change', (e) => {
    e.stopPropagation();
    const index = Math.floor(interpolationSlider.value);
    changeInterpolationIndex(index);
  });

  secondInterpolationSlider.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  secondInterpolationSlider.addEventListener('change', (e) => {
    const index = Math.floor(secondInterpolationSlider.value);
    changeInterpolationIndex(index);
  });

  melodyVolumeSlider.addEventListener('input', (e) => {
    data.melody.changeGain(melodyVolumeSlider.value / 100);
  });
  chordsVolumeSlider.addEventListener('input', (e) => {
    data.chords.gain = e.target.value / 100;
  });

  bassVolumeSlider.addEventListener('input', () => {
    data.bass.gain.gain.value = bassVolumeSlider.value / 100;
  });
  bassToneSlider.addEventListener('input', () => {
    const frq = bassToneSlider.value * 2;
    data.bass.lpf.frequency.value = frq;
  });
  backgroundVolumeSlider.addEventListener('input', () => {
    data.backgroundSounds.gain.gain.value = backgroundVolumeSlider.value / 100;
  });

  backgroundToneSlider.addEventListener('input', () => {
    const frq = backgroundToneSlider.value * 200;
    data.backgroundSounds.hpf.frequency.value = frq;
  });

  masterReverbSlider.addEventListener('input', () => {
    const wet = masterReverbSlider.value / 100;
    data.master.reverb.wet.value = wet;
  });

  masterToneSlider.addEventListener('input', () => {
    const frq = masterToneSlider.value * 198 + 200;
    data.master.lpf.frequency.value = frq;
  });

  masterVolumeSlider.addEventListener('input', () => {
    const vol = masterVolumeSlider.value / 100;
    data.master.gain.gain.value = vol;
  });

  melodySwingSlider.addEventListener('input', () => {
    data.melody.swing = melodySwingSlider.value / 100;
  });
  chordsSwingSlider.addEventListener('input', () => {
    data.chords.swing = chordsSwingSlider.value / 100;
  });

  window.addEventListener('resize', () => {
    const canvas = data.canvas.canvas;
    canvasDiv.style.height = `${backgroundImage.clientWidth * (435 / 885)}px`;

    canvas.width = canvasDiv.clientWidth;
    canvas.height = canvasDiv.clientHeight;
  });

  // show canvas
  data.canvas.moveMelodyCanvasToRoom();

  // model
  sendInterpolationMessage();

  // callbacks
  data.melody.changeGain = function (v) {
    data.melody.gain = v;
    melodyVolumeSlider.value = v * 100;
  };

  setupPageVisibilityCallback();
}

function setupKeyboardEvents() {
  window.addEventListener('keydown', (e) => {
    const callbacks = {
      9: () => {
        switchCallback();
      },
      32: () => {
        toggleStart();
      },
    };
    if (callbacks[e.keyCode]) {
      e.preventDefault();
      callbacks[e.keyCode]();
    }
  });
}

async function onFirstTimeStarted() {
  const interval = 1000;
  await sleep(interval * 2);
  bubbleDiv.textContent = `It's crazy out there.`;

  await sleep(interval * 5);
  bubbleDiv.style.width = '120%';
  bubbleDiv.textContent = `Try click the window.`;

  await sleep(interval * 10);
  bubbleDiv.textContent = `Click me to give me coffee.`;

  await sleep(interval * 10);
  assets.catGroup.appendChild(bubbleDiv);
  bubbleDiv.style.width = '150%';
  bubbleDiv.textContent = `meow...`;

  await sleep(interval * 10);
  assets.avatarGroup.appendChild(bubbleDiv);
  bubbleDiv.style.width = '110%';
  bubbleDiv.textContent = 'Enjoy the magical room...';

  await sleep(interval * 10);
  bubbleDiv.style.width = '100%';
  bubbleDiv.style.display = 'none';
}

function onTransportStart() {
  data.backgroundSounds.samples
    .get(data.backgroundSounds.names[data.backgroundSounds.index])
    .start();
}

function onTransportStop() {
  data.backgroundSounds.samples
    .get(data.backgroundSounds.names[data.backgroundSounds.index])
    .stop();
}

function toggleDrumMute(value, changeFilter = false, time = 0) {
  if (value === undefined) {
    data.drum.mute = !data.drum.mute;
  } else {
    data.drum.mute = value;
  }

  if (changeFilter) {
    if (!data.drum.mute) {
      data.master.lpf.frequency.linearRampTo(20000, 1, time);
    } else {
      data.master.lpf.frequency.linearRampTo(200, 0.5, time);
    }
  }

  // sync ui
  drumToggle.checked = !data.drum.mute;
  assets.switchAvatar(data.drum.mute);
}

function changeChords(index = 0) {
  index = index % data.chords.midis.length;
  if (data.chords.part) {
    data.chords.part.cancel(0);
  }
  data.chords.index = index;
  data.chords.part = new Tone.Part((time, note) => {
    data.instruments[data.chords.instrumentIndex].triggerAttackRelease(
      toFreq(note.pitch - (data.chords.instrumentIndex === 0 ? 0 : 12)),
      note.duration,
      time + data.chords.swing * (75 / data.master.bpm) * Math.random() * 0.1,
      note.velocity * data.chords.gain
    );
  }, midiToToneNotes(data.chords.midis[data.chords.index])).start(0);

  backgroundImage.src = `./assets/rooom-${data.chords.index}.png`;
}

function changeMelodyByIndex(index = 0) {
  if (data.melody.part) {
    data.melody.part.cancel(0);
  }
  data.melody.index = index;
  if (index === data.melody.toneNotes.length - 1) {
    console.log('rnn');
    sendContinueMessage();
    return;
  }

  data.melody.part = new Tone.Part((time, note) => {
    data.melody.instrument.triggerAttackRelease(
      toFreq(note.pitch - 12),
      note.duration,
      time + Math.random() * (75 / data.master.bpm) * 0.3 * data.melody.swing,
      note.velocity * data.melody.gain
    );
  }, data.melody.toneNotes[data.melody.index]).start(0);

  data.melody.part.loop = false;

  firstMelodySelect.value = index;
  sendInterpolationMessage();
}

function changeMelody(readyMidi) {
  if (data.melody.part) {
    data.melody.part.cancel(0);
  }
  data.melody.part = new Tone.Part((time, note) => {
    data.melody.instrument.triggerAttackRelease(
      toFreq(note.pitch - 12),
      note.duration,
      time + Math.random() * (75 / data.master.bpm) * 0.3 * data.melody.swing,
      note.velocity * data.melody.gain
    );
  }, readyMidi).start(0);
  data.melody.part.loop = true;
  data.melody.part.loopEnd = '4:0:0';
}

function changeInterpolationIndex(index) {
  data.melody.interpolationIndex = index;
  changeMelody(data.melody.interpolationToneNotes[index]);

  interpolationSlider.value = index;
  secondInterpolationSlider.value = index;
}

function sendInterpolationMessage(m1, m2, id = 0) {
  data.melody.waitingInterpolation = true;
  melodyInteractionDivs[0].classList.add('disabledbutton');

  // console.log(`interpolate ${data.melody.index} ${data.melody.secondIndex}`);
  const firstMelody = data.melody.midis[data.melody.index];
  const left = m1 ? m1 : midiToModelFormat(firstMelody);

  const secondMelody = data.melody.midis[data.melody.secondIndex];
  const right = m2 ? m2 : midiToModelFormat(secondMelody);

  data.melody.interpolationData[0] = left;
  data.melody.interpolationData[NUM_INTERPOLATIONS - 1] = right;

  worker.postMessage({
    id,
    msg: 'interpolate',
    left,
    right,
  });
}

function sendContinueMessage() {
  data.canvas.melodyCanvas.style.opacity = 0.1;
  worker.postMessage({
    id: 1,
    msg: 'continue',
  });
}

function changeChordsInstrument(index) {
  for (let j = 0; j < NUM_INSTRUMENTS; j++) {
    if (j === parseInt(index)) {
      assets.chordsInstruments[j].style.display = 'block';
    } else {
      assets.chordsInstruments[j].style.display = 'none';
    }
  }

  data.chords.instrumentIndex = index;
}

function changeMelodyInstrument(index) {
  for (let j = 0; j < NUM_INSTRUMENTS; j++) {
    if (j === parseInt(index)) {
      assets.melodyInstruments[j].style.display = 'block';
    } else {
      assets.melodyInstruments[j].style.display = 'none';
    }
  }

  melodyInstrumentSelect.value = index;
  data.melody.instrumentIndex = index;
  data.melody.instrument = data.instruments[index];
}

function changeBpm(v) {
  bpmInput.value = v;
  bpmValueSpan.textContent = `${v}`;
  data.master.bpm = v;
  Tone.Transport.bpm.value = v;
}

function changeDrumPattern(index) {
  data.drum.patternIndex = index;
  drumPatternsSelect.value = index;
}

function checkStarted() {
  return Tone.Transport.state === 'started';
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
    quantizedStartStep: Math.round((note.ticks / totalTicks) * totalQuantizedSteps),
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

function modelFormatToToneNotes(d) {
  const { notes } = d;
  return notes.map((note) => {
    const { pitch, quantizedStartStep, quantizedEndStep } = note;

    return {
      time: `${Math.floor(quantizedStartStep / 8)}:${Math.floor((quantizedStartStep % 8) / 2)}:${
        (quantizedStartStep % 2) * 2
      }`,
      pitch,
      duration: (quantizedEndStep - quantizedStartStep) * (data.master.bpm / 60) * (1 / 4),
      velocity: 0.7,
    };
  });
}

function toFreq(m) {
  return Tone.Frequency(m, 'midi');
}

function setClock() {
  function checkTime(i) {
    if (i < 10) {
      i = '0' + i;
    }
    return i;
  }

  const time = document.createElement('P');
  time.textContent = '00:00';
  time.id = 'clock-text';
  assets.timeIntervalID = setInterval(() => {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    // var s = today.getSeconds();
    // add a zero in front of numbers<10
    m = checkTime(m);
    h = checkTime(h);
    if (time.textContent.includes(':')) {
      time.textContent = `${h} ${m}`;
    } else {
      time.textContent = `${h}:${m}`;
    }
  }, 500);
  return time;
}

function parseYoutubeId(url) {
  // https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}

function getYoutubeEmbedUrlFromId(id = '0HYq9kTOT70') {
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

function filterNotesInScaleSingle(notes) {
  return notes.filter(({ pitch }) => {
    const p = pitch % 12;
    return [0, 2, 4, 5, 7, 9, 11].includes(p);
  });
}

function removeElement(el) {
  el.parentNode.removeChild(el);
}

function dragElement(el, onClickCallback = () => {}, params = {}) {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  let dragging = false;
  el.onmousedown = dragMouseDown;
  el.addEventListener('click', (e) => {
    if (!dragging) {
      onClickCallback(e);
    }
    dragging = false;
  });

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
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
    if (!params.horizontal) {
      pos2 = pos4 - e.clientY;
    }
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:

    const w = el.parentElement.clientWidth;
    const h = el.parentElement.clientHeight;
    el.style.top = `${((el.offsetTop - pos2) / h) * 100}%`;
    el.style.left = `${((el.offsetLeft - pos1) / w) * 100}%`;
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function setupPageVisibilityCallback() {
  // https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

  let hidden;
  let visibilityChange;
  if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
  }

  if (typeof document.addEventListener === 'undefined' || hidden === undefined) {
    console.log(
      'This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.'
    );
  } else {
    document.addEventListener(
      visibilityChange,
      () => {
        if (document[hidden]) {
          stopTransport();
        }
      },
      false
    );
  }
}

function getApiKeyFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('key');
}

function checkApiKeyIsValid(key) {
  if (!key) {
    return false;
  }

  if (typeof key !== 'string') {
    return false;
  }

  if (key.length < 30) {
    return false;
  }

  return true;
}

function checkPeriodIsValid(p) {
  if (typeof p !== 'number') {
    return false;
  }

  if (p < 0 || p > 60000) {
    return false;
  }

  return true;
}

function getVideoId(apiKey, channelId) {
  return (
    'https://www.googleapis.com/youtube/v3/search' +
    '?eventType=live' +
    '&part=id' +
    `&channelId=${channelId}` +
    '&type=video' +
    `&key=${apiKey}`
  );
}

function getChatIdUrl(apiKey, videoId) {
  return (
    'https://www.googleapis.com/youtube/v3/videos' +
    '?part=liveStreamingDetails' +
    `&id=${videoId}` +
    `&key=${apiKey}`
  );
}

function getChatMessagesUrl(apiKey, chatId, pageToken) {
  return (
    'https://www.googleapis.com/youtube/v3/liveChat/messages' +
    `?liveChatId=${chatId}` +
    '&part=id,snippet,authorDetails' +
    '&maxResults=100' +
    (pageToken ? `&pageToken=${pageToken}` : '') +
    `&key=${apiKey}`
  );
}

async function fetchData(url, callback = () => {}, onError = () => {}) {
  try {
    let res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    alert(err);
  }
}

function handleMessage(msg) {
  const callbacks = {
    start: () => {
      toggleStart();
    },
    'turn on the light': () => {
      toggleStart();
    },
    'turn off the light': () => {
      toggleStart();
    },
    'click the window': () => {
      const n = data.backgroundSounds.names.length;
      data.backgroundSounds.switch((data.backgroundSounds.index + 1) % n);
    },
    'click the cat': () => {
      assets.catCallback();
    },
  };
  if (callbacks[msg]) {
    callbacks[msg]();
  }
}

async function onClickConnect() {
  if (fetchIntervalId) {
    disconnectYoutubeLiveChat();
    return;
  }

  connectYoutubeButton.classList.remove('is-success');
  connectYoutubeButton.classList.add('is-error');
  connectYoutubeButton.classList.add('disabledbutton');

  connectYoutubeButton.textContent = 'disconnect';
  youtubePromptText.textContent = '[loading...]';

  let lastReadTime = Date.now();
  let paramKey = getApiKeyFromParams();
  let apiKey = paramKey;
  let hint = 'API key';
  while (!checkApiKeyIsValid(apiKey)) {
    apiKey = prompt(hint, paramKey);
    hint = 'Invalid API key. Try again.';
  }
  let channelId = prompt('Channel Id', CHANNEL_ID);
  let listenPeriod = Number(prompt('Fetch every milliseconds: ', 5000));
  if (!apiKey) {
    apiKey = paramKey;
  }
  if (!channelId) {
    channelId = CHANNEL_ID;
  }
  if (!checkPeriodIsValid(listenPeriod)) {
    listenPeriod = 5000;
  }

  youtubePromptText.textContent = '[fetching live id...]';
  let liveId;
  let d = await fetchData(getVideoId(apiKey, channelId));

  if (!d.error) {
    liveId = d.items[0].id.videoId;
  } else {
    youtubePromptDiv.innerHTML = '';
    const el = document.createElement('P');
    el.textContent = d.error.message;
    youtubePromptDiv.appendChild(el);
    disconnectYoutubeLiveChat();
    return;
  }

  youtubePromptText.textContent = '[fetching chat id...]';
  let chatId;
  d = await fetchData(getChatIdUrl(apiKey, liveId));
  if (d.error) {
    youtubePromptDiv.innerHTML = '';
    const el = document.createElement('P');
    el.textContent = d.error.message;
    youtubePromptDiv.appendChild(el);
    disconnectYoutubeLiveChat();
    return;
  }
  chatId = d.items[0].liveStreamingDetails.activeLiveChatId;

  youtubePromptText.textContent = '[connected]';
  connectYoutubeButton.classList.remove('disabledbutton');
  let nextPageToken;
  fetchIntervalId = setInterval(async () => {
    d = await fetchData(getChatMessagesUrl(apiKey, chatId, nextPageToken));
    if (d.error) {
      youtubePromptDiv.innerHTML = '';
      const el = document.createElement('P');
      el.textContent = d.error.message;
      youtubePromptDiv.appendChild(el);
      disconnectYoutubeLiveChat();
      return;
    }
    youtubePromptDiv.innerHTML = '';
    if (!d.items) {
      return;
    }
    nextPageToken = d.nextPageToken;
    console.log('new messages', d.items);
    for (let i = 0; i < d.items.length; i++) {
      const item = d.items[i];
      let time = new Date(item.snippet.publishedAt).getTime();
      if (lastReadTime < time) {
        lastReadTime = time;
        const content = item.snippet.displayMessage;
        const authorName = item.authorDetails.displayName;
        const line = `${authorName}: ${content}`;
        const el = document.createElement('LI');
        el.textContent = line;
        youtubePromptDiv.appendChild(el);
        handleMessage(content);
      }
    }
  }, listenPeriod);
}

function disconnectYoutubeLiveChat() {
  connectYoutubeButton.classList.remove('disabledbutton');
  youtubePromptText.textContent = '[disconnected]';
  connectYoutubeButton.textContent = 'connect';
  connectYoutubeButton.classList.add('is-success');
  connectYoutubeButton.classList.remove('is-error');
  clearInterval(fetchIntervalId);
  fetchIntervalId = undefined;
}

function onClickCloseYoutube() {
  // youtubeDiv.style.display = "none";
  if (youtubeButtons.style.display === 'none') {
    collapseYoutubeDivButton.textContent = 'X';
    youtubeDiv.style.height = '20%';
    youtubeButtons.style.display = 'block';
    youtubePromptDiv.style.display = 'block';
  } else {
    collapseYoutubeDivButton.textContent = '=';
    youtubeDiv.style.height = 'auto';
    youtubeButtons.style.display = 'none';
    youtubePromptDiv.style.display = 'none';
  }
}

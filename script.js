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

const warningOverlay = document.getElementById('warning-overlay');
const startButton = document.getElementById('start-button');
const whateverButton = document.getElementById('whatever-button');
const bpmInput = document.getElementById('bpm-input');
const drumPatternsSelect = document.getElementById('drum-patterns-select');
const drumToggle = document.getElementById('drum-toggle');
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
const drumVolumeSlider = document.getElementById('drum-volume-slider');
const drumToneSlider = document.getElementById('drum-tone-slider');

const CLICK_CAT = 'click_cat';
const CLICK_WINDOW = 'click_window';
const CLICK_LIGHT = 'click_light';
const GENERATE_NEW_MELODY = 'generate_new_melody';
const RANDOMIZE_INTERPOLATION = 'randomize_interpolation';
const TRIGGER_MELODY = 'trigger_melody';
const TRIGGER_CHORDS = 'trigger_chords';
const TRIGGER_DRUM = 'trigger_drum';
const TRIGGER_BASS = 'trigger_bass';
const CHANGE_MELODY_INSTRUMENT = 'change_melody_instrument';
const CHANGE_CHORDS_INSTRUMENT = 'change_chords_instrument';
const CHANGE_MELODY_PATTERN = 'change_melody_pattern';
const CHANGE_CHORDS_PATTERN = 'change_chords_pattern';
const CHANGE_DRUM_PATTERN = 'change_drum_pattern';
const MAKE_MELODY_SWING = 'make_melody_swing';
const MAKE_CHORDS_SWING = 'make_chords_swing';
const DRINK_COFFEE = 'drink_coffee';
const WRITE_ON_BOARD = 'write_on_board';
const INCREASE_BPM = 'increase_bpm';
const DECREASE_BPM = 'decrease_bpm';
const MORE_REVERB = 'more_reverb';
const LESS_REVERB = 'less_reverb';
const MORE_FILTER = 'more_filter';
const LESS_FILTER = 'less_filter';

// TODO: prevent loading models
const LOAD_ML_MODELS = true;
const LOAD_EVENTS_COUNTS_THRESHOLD = LOAD_ML_MODELS ? 8 : 6;
const TOTAL_BAR_COUNTS = 8;
const TICKS_PER_BAR = 384;
const BEATS_PER_BAR = 4;
const TOTAL_TICKS = TOTAL_BAR_COUNTS * TICKS_PER_BAR;
const MODEL_BAR_COUNT = 2;
const MAIN_CANVAS_PADDING = 0;
const NUM_INTERPOLATIONS = 5;
const TRANSITION_PROB = 0.2;
const SYNTHS = 0;
const PIANO = 1;
const ACOUSTIC_GUITAR = 2;
const ELETRIC_GUITAR = 3;
const NUM_INSTRUMENTS = 4;
const NUM_PRESET_MELODIES = 4;
const NUM_PRESET_CHORD_PROGRESSIONS = 3;
const NUM_DRUM_PATTERNS = 3;
const CURRENT_NOTE_ENLARGE_RATIO = 1.0;
const DEFAULT_GUIDANCE_INTERVAL = 500;
const SAMPLES_BASE_URL = './samples';
const CHANNEL_ID = 'UCizuHuCAHmpTa6EFeZS2Hqg';
const MAGENTA_BLOG_LINK = 'https://g.co/magenta/lofi-player';
const DRAGGING_PREVENT_CLICK_EVENT_THRESHOLD_FRAMECOUNT = 8;

const worker = LOAD_ML_MODELS ? new Worker('worker.js') : null;
const callbacks = {};
const state = {
  loading: true,
  started: false,
  pageVisible: true,
  loadEventsCount: 0,
  commands: [],
  showPanel: false,
  idleBarsCount: 0,
  barsCount: 0,
  backgroundSounds: {
    mute: false,
    samples: [],
    names: ['rain', 'waves', 'street', 'kids'],
    index: 0,
    tone: 1,
  },
  instruments: {},
  melody: {
    mute: false,
    part: null,
    gain: 1,
    swing: 0,
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
    mute: true,
    part: null,
    index: 0,
    gain: 1,
    swing: 0,
    midis: null,
    instrumentIndex: 0,
  },
  bass: {
    mute: true,
    toneSliderValue: 20,
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
    gain: 1,
    tone: 0.5,
    names: ['kk', 'sn', 'hh'],
    samples: [],
    auto: false,
    patternIndex: 0,
    scale: {
      kk: 1,
      sn: 1,
      hh: 1,
    },
  },
  master: {
    autoBreak: false,
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
  effects: {},
  assets: {},
};
const assets = {
  defaultBoardText: 'Vibert Thio 2020.',
  catIndex: 0,
  windowUrls: ['./assets/window-0.png', './assets/window-1.png'],
  avatarUrls: [`./assets/avatar-1-0.png`, `./assets/avatar-1-1.png`, `./assets/avatar-1-2.png`],
  catUrls: ['./assets/cat-75-purple.gif', './assets/cat-90.gif', './assets/dog-100.gif'],
};

urlParamsToState();
addImages();
loadAssetsPositionFromState();
loadMidiFiles();
LOAD_ML_MODELS && initModel();
initSounds();
initCanvas();
initMessageCallbacks();

function onClickWhatever() {
  warningOverlay.style.display = 'none';
}

function initSounds() {
  Tone.Transport.bpm.value = state.master.bpm;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = '0:0:0';
  Tone.Transport.loopEnd = '8:0:0';

  Tone.Master.chain(
    state.master.masterCompressor,
    state.master.reverb,
    state.master.lpf,
    state.master.gain
  );
  state.master.reverb.generate().then(() => {
    console.log('master reverb ready');
    checkFinishLoading();
  });
  state.master.reverb.wet.value = masterReverbSlider.value / 100;

  const drumUrls = {};
  state.drum.names.forEach((n) => (drumUrls[n] = `${SAMPLES_BASE_URL}/drums/${n}.mp3`));
  state.drum.gainNode = new Tone.Gain(1).toMaster();
  state.drum.lpf = new Tone.Filter(10000, 'lowpass').connect(state.drum.gainNode);
  state.drum.samples = new Tone.Players(drumUrls, () => {
    console.log('drums loaded');
    checkFinishLoading();
  }).connect(state.drum.lpf);

  state.backgroundSounds.gate = new Tone.Gain(state.backgroundSounds.mute ? 0 : 1).toMaster();
  state.backgroundSounds.gainNode = new Tone.Gain(1).connect(state.backgroundSounds.gate);
  state.backgroundSounds.hpf = new Tone.Filter(20000, 'lowpass').connect(
    state.backgroundSounds.gainNode
  );
  const sampleUrls = {};
  state.backgroundSounds.names.forEach((n) => (sampleUrls[n] = `${SAMPLES_BASE_URL}/fx/${n}.mp3`));
  state.backgroundSounds.samples = new Tone.Players(sampleUrls, () => {
    console.log('background sounds loaded');
    checkFinishLoading();
  }).connect(state.backgroundSounds.hpf);

  state.effects.beep = new Tone.Player(`${SAMPLES_BASE_URL}/effects/beep.mp3`, () => {
    checkFinishLoading();
  }).toMaster();

  state.backgroundSounds.names.forEach((name) => {
    state.backgroundSounds.samples.get(name).loop = true;
  });
  state.seq = new Tone.Sequence(
    seqCallback,
    Array(128)
      .fill(null)
      .map((_, i) => i),
    '16n'
  );
  state.seq.start(0);

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

  state.instruments[SYNTHS] = new Tone.PolySynth(10, Tone.Synth, {
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1,
    },
  }).connect(chorus);

  state.instruments[PIANO] = SampleLibrary.load({
    instruments: 'piano',
  });
  state.instruments[ACOUSTIC_GUITAR] = SampleLibrary.load({
    instruments: 'guitar-acoustic',
  });
  state.instruments[ELETRIC_GUITAR] = SampleLibrary.load({
    instruments: 'guitar-electric',
  });

  const { bass } = state;
  bass.gate = new Tone.Gain(0).connect(reverb);
  bass.gain = new Tone.Gain(1).connect(bass.gate);
  bass.lpf = new Tone.Filter(200, 'lowpass').connect(bass.gain);
  bass.instrument = new Tone.Synth({
    oscillator: {
      type: 'square',
    },
    envelope: {
      attack: 0.0,
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

  state.instruments[PIANO].connect(chorus);
  state.instruments[ACOUSTIC_GUITAR].connect(chorus);
  state.instruments[ELETRIC_GUITAR].connect(chorus);

  state.melody.instrument = state.instruments[state.melody.instrumentIndex];

  Tone.Buffer.on('load', () => {
    checkFinishLoading();
    console.log('buffers loaded');
  });

  // event
  state.handleMessageLoop = new Tone.Loop(() => {
    consumeNextCommand();
  }, '1m').start(0);
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
      state.melody.interpolationData.splice(
        1,
        NUM_INTERPOLATIONS - 2,
        ...result.slice(1, NUM_INTERPOLATIONS - 1)
      );
      // state.melody.interpolationData = result;

      state.melody.interpolationToneNotes = result.map(modelFormatToToneNotes);
      state.melody.interpolationToneNotes[0] = state.melody.toneNotes[state.melody.index];
      state.melody.interpolationToneNotes[state.melody.interpolationToneNotes.length - 1] =
        state.melody.toneNotes[state.melody.secondIndex];

      state.melody.waitingInterpolation = false;

      changeInterpolationIndex(state.melody.interpolationIndex);

      // console.log("interpolationData", state.melody.interpolationData);
      // console.log("interpolationToneNotes", state.melody.interpolationToneNotes);
      state.canvas.melodyCanvas.style.opacity = 1;
      melodyInteractionDivs[0].classList.remove('disabledbutton');
    }
    if (e.data.msg === 'continue') {
      let { id, result } = e.data;
      result.notes = filterNotesInScaleSingle(result.notes);
      result.notes = result.notes.map((note) => {
        note.pitch += 24;
        return note;
      });

      if (state.melody.retrivedRnnGeneratedResult) {
        result = state.melody.retrivedRnnGeneratedResult;
        state.melody.retrivedRnnGeneratedResult = undefined;
      }
      state.melody.cachedRnnGeneratedResult = result;

      state.melody.interpolationData[0] = result[0];
      const notes = modelFormatToToneNotes(result);
      const n = state.melody.toneNotes.length;
      state.melody.toneNotes[n - 1] = notes; // update toneNotes
      changeMelody(notes); // change played melody part
      state.melody.index = n - 1; // change index
      firstMelodySelect.value = n - 1; // change ui index
      sendInterpolationMessage(result); // update interpolation

      state.melody.interpolationIndex = 0;
      interpolationSlider.value = 0;
      secondInterpolationSlider.value = 0;
    }
  };
}

function initCanvas() {
  const canvas = document.getElementById('main-canvas');
  state.canvas.canvas = canvas;

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
  state.canvas.melodyCanvas = melodyCanvas;
  state.canvas.moveMelodyCanvasToPanel = function () {
    removeElement(melodyCanvas);
    melodyCanvas.style.position = 'static';
    melodyCanvas.style.width = '80%';
    melodyCanvas.style.height = '50%';
    melodyCanvas.style.opacity = 1.0;
    interpolationDiv.append(melodyCanvas);
  };

  state.canvas.moveMelodyCanvasToRoom = function () {
    melodyCanvas.style.position = 'absolute';
    // melodyCanvas.style.top = "12%";
    // melodyCanvas.style.left = "23%";
    // melodyCanvas.style.width = '45%';
    // melodyCanvas.style.height = '41%';
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
    { horizontal: true, name: 'light', bounded: true }
  );

  assets.window = addImageToCanvasDiv(assets.windowUrls[state.backgroundSounds.mute ? 1 : 0], {
    class: 'large-on-hover-micro',
    width: '38%',
    left: '17%',
    zIndex: '0',
    top: '20.3%',
  });

  const rainGif = addImageToCanvasDiv('./assets/background/rain-0.gif', {
    width: '35%',
    top: '20%',
    left: '20%',
    zIndex: '-2',
  });

  const wavesGif = addImageToCanvasDiv('./assets/background/waves.gif', {
    width: '35%',
    left: '18%',
    zIndex: '-2',
    top: '22%',
  });

  const streetGif = addImageToCanvasDiv('./assets/background/city.gif', {
    width: '33%',
    left: '20%',
    zIndex: '-2',
    top: '22%',
  });

  const kidsGif = addImageToCanvasDiv('./assets/background/city-sunset.gif', {
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

  assets.avatarGroup = addImageToCanvasDiv(assets.avatarUrls[0], {
    class: 'large-on-hover-micro',
    width: '11%',
    left: '20%',
    zIndex: '4',
    group: true,
  });

  assets.avatar = assets.avatarGroup.childNodes[0];
  assets.avatarGroup.appendChild(bubbleDiv);
  assets.hiddenAvatars = [
    addImageToCanvasDiv(assets.avatarUrls[2], { display: 'none', width: '0' }),
    addImageToCanvasDiv(assets.avatarUrls[1], { display: 'none', width: '0' }),
  ];

  assets.cactus = addImageToCanvasDiv('./assets/cactus.png', {
    class: 'large-on-hover',
    width: '3%',
    bottom: '39%',
    left: '38%',
    group: true,
  });
  const cactusArrow = createCircleElement();
  if (!state.backgroundSounds.mute) {
    cactusArrow.classList.add('hidden');
  } else {
    assets.cactus.childNodes[0].classList.add('transparent');
  }
  assets.cactus.appendChild(cactusArrow);

  assets.chair = addImageToCanvasDiv('./assets/chair-red.png', {
    width: '10%',
    left: '10%',
    zIndex: '3',
  });

  dragElement(assets.chair, undefined, { horizontal: true, name: 'chair', bounded: true });

  assets.desk = addImageToCanvasDiv('./assets/desk.png', {
    class: 'large-on-hover-micro',
    width: '21%',
    left: '1%',
    zIndex: '3',
    group: true,
  });

  assets.lamp = addImageToCanvasDiv('./assets/lamp-on.png', {
    // class: 'large-on-hover',
    width: '20%',
    left: '20%',
    bottom: '100%',
    zIndex: '4',
  });
  assets.desk.appendChild(assets.lamp);
  assets.lampOn = true;

  assets.pens = addImageToCanvasDiv('./assets/pens.png', {
    // class: 'large-on-hover',
    width: '12%',
    right: '40%',
    bottom: '100%',
    zIndex: '1',
  });

  assets.desk.appendChild(assets.pens);
  dragElement(
    assets.desk,
    () => {
      switchPanel('master');
      togglePanel();
    },
    { horizontal: true, name: 'desk', bounded: true }
  );
  // dragElement(assets.pens, () => {}, { name: 'pens' });

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
  textInput.value = state.assets.boardText ? state.assets.boardText : assets.defaultBoardText;
  textInput.spellcheck = false;
  assets.textInput = textInput;
  assets.board.appendChild(textInput);
  textInput.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  dragElement(assets.board, undefined, { name: 'board', bounded: true });

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
  dragElement(
    assets.shelf,
    () => {
      changeChords(state.chords.index + 1);
    },
    {
      name: 'shelf',
      bounded: true,
    }
  );

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
  dragElement(assets.tvStand, undefined, { horizontal: true, name: 'tvStand', bounded: true });
  assets.radio.addEventListener('click', () => {
    sendContinueMessage();
  });

  assets.tvTable.addEventListener('click', () => {
    state.canvas.moveMelodyCanvasToPanel();
    switchPanel();
    togglePanel();
  });

  assets.sofa = addImageToCanvasDiv('./assets/sofa-1.png', {
    width: '35%',
    right: '3%',
    zIndex: '2',
    group: true,
  });
  dragElement(assets.sofa, undefined, { horizontal: true, name: 'sofa', bounded: true });

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
  dragElement(assets.cabinetRight, undefined, {
    horizontal: true,
    name: 'cabinetRight',
    bounded: true,
  });

  assets.time = setClock();

  assets.clock = addImageToCanvasDiv('./assets/clock-3.png', {
    class: 'large-on-hover',
    width: '78%',
    right: '10%',
    top: '-21%',
    // bottom: "100%",
    group: true,
  });
  const clockArrow = createCircleElement();

  assets.clock.appendChild(clockArrow);
  assets.clock.appendChild(assets.time);

  if (state.drum.mute) {
    assets.clock.childNodes[0].classList.add('transparent');
    assets.clock.childNodes[2].classList.add('transparent');
  } else {
    clockArrow.classList.add('hidden');
  }
  assets.cabinetRight.appendChild(assets.clock);

  assets.bassGroup = addImageToCanvasDiv('./assets/bass-wall.png', {
    class: 'large-on-hover',
    width: '6%',
    right: '10%',
    top: '10%',
    zIndex: '0',
    group: true,
  });
  assets.bass = assets.bassGroup.childNodes[0];
  assets.bassGroup.appendChild(createCircleElement());
  if (state.bass.mute) {
    assets.bass.classList.add('transparent');
  }

  assets.chordsInstruments = [
    addImageToCanvasDiv('./assets/synth.png', {
      class: 'large-on-hover',
      width: '30%',
      right: '30%',
      top: '-28%',
      zIndex: '2',
      display: 'none',
      group: true,
    }),
    addImageToCanvasDiv('./assets/piano.png', {
      class: 'large-on-hover',
      width: '30%',
      right: '30%',
      top: '-28%',
      zIndex: '2',
      display: 'none',
      group: true,
    }),
    addImageToCanvasDiv('./assets/acoustic-guitar.png', {
      class: 'large-on-hover',
      width: '19%',
      left: '40%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
      group: true,
    }),
    addImageToCanvasDiv('./assets/electric-guitar.png', {
      class: 'large-on-hover',
      width: '19%',
      left: '40%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
      group: true,
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
      group: true,
    }),
    addImageToCanvasDiv('./assets/piano.png', {
      class: 'large-on-hover',
      width: '30%',
      right: '52%',
      bottom: '45%',
      zIndex: '3',
      display: 'none',
      group: true,
    }),
    addImageToCanvasDiv('./assets/acoustic-guitar.png', {
      class: 'large-on-hover',
      width: '17%',
      left: '19%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
      group: true,
    }),
    addImageToCanvasDiv('./assets/electric-guitar.png', {
      class: 'large-on-hover',
      width: '17%',
      left: '19%',
      bottom: '-10%',
      zIndex: '3',
      display: 'none',
      group: true,
    }),
  ];

  for (let i = 0; i < NUM_INSTRUMENTS; i++) {
    const mi = assets.melodyInstruments[i];
    if (state.melody.mute) {
      mi.classList.add('transparent');
    }
    const melodyArrow = createCircleElement();
    if (state.melody.mute) {
      mi.classList.add('transparent');
    } else {
      melodyArrow.classList.add('hidden');
    }
    mi.appendChild(melodyArrow);
    assets.sofa.appendChild(mi);
    dragElement(mi, () => {
      switchPanel('melody');
      togglePanel();
    });

    const ci = assets.chordsInstruments[i];
    const chordsArrow = createCircleElement();
    if (state.chords.mute) {
      ci.classList.add('transparent');
    } else {
      chordsArrow.classList.add('hidden');
    }
    ci.appendChild(chordsArrow);
    assets.sofa.appendChild(ci);
    dragElement(ci, () => {
      switchPanel('chords');
      togglePanel();
    });
  }

  assets.lamp.addEventListener('click', () => {
    state.effects.beep.start();
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
    state.canvas.moveMelodyCanvasToRoom();
  });

  assets.makeAvatarLiftFoot = () => {
    const { avatar, avatarUrls } = assets;
    avatar.src = avatarUrls[2];
  };
  assets.makeAvatarDropFoot = () => {
    const { avatar, avatarUrls } = assets;
    avatar.src = avatarUrls[0];
  };
  assets.switchAvatar = (drinking) => {
    const { avatar } = assets;
    if (drinking === undefined) {
      if (avatar.src === assets.avatarUrls[0]) {
        avatar.src = assets.avatarUrls[1];
      } else {
        avatar.src = assets.avatarUrls[0];
      }
    } else {
      avatar.src = drinking ? assets.avatarUrls[1] : assets.avatarUrls[0];
    }
  };
  dragElement(
    assets.avatarGroup,
    () => {
      toggleDrum(undefined, true, Tone.now());
    },
    { horizontal: true, name: 'avatarGroup', bounded: true }
  );

  assets.catCallback = () => {
    assets.cat.style.display = 'none';
    assets.catIndex = (assets.catIndex + 1) % assets.catUrls.length;
    assets.cat.src = assets.catUrls[assets.catIndex];
    if (assets.catIndex === 0) {
      changeMasterBpm(75);
      changeDrumPattern(2);
    } else if (assets.catIndex === 1) {
      changeMasterBpm(90);
      changeDrumPattern(0);
    } else {
      changeMasterBpm(100);
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
      state.backgroundSounds.switch(0);
      state.backgroundSounds.gainNode.gain.value = 1.0;
    } else if (assets.catIndex === 1) {
      changeChords(1);
      changeChordsInstrument(2);
      changeMelodyByIndex(1);
      changeMelodyInstrument(3);
      state.backgroundSounds.switch(1);
      state.backgroundSounds.gainNode.gain.value = 0.7;
    } else {
      changeChords(2);
      changeChordsInstrument(2);
      changeMelodyByIndex(2);
      changeMelodyInstrument(0); // electric guitar
      state.backgroundSounds.switch(3);
      state.backgroundSounds.gainNode.gain.value = 1.0;
    }

    assets.cat.onload = () => {
      assets.cat.style.display = 'block';
    };
  };
  dragElement(
    assets.catGroup,
    assets.catCallback,
    {
      horizontal: false,
    },
    {
      name: 'catGroup',
    }
  );

  // const amp = addImageToCanvasDiv("./assets/amp.png", {
  //   class: "large-on-hover",
  //   height: "12%",
  //   right: "25%",
  //   bottom: "3%",
  //   zIndex: "3",
  // });

  assets.window.addEventListener('click', () => {
    if (checkStarted()) {
      const n = state.backgroundSounds.names.length;
      state.backgroundSounds.switch((state.backgroundSounds.index + 1) % n);
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

  dragElement(
    assets.logo,
    () => {
      // stopTransport();
      window.open(MAGENTA_BLOG_LINK, '_blank');
    },
    { name: 'logo', bounded: true }
  );

  dragElement(
    assets.bassGroup,
    () => {
      // state.bass.gain.gain.value = state.bass.gain.gain.value > 0.5 ? 0 : 1;
      switchPanel('bass');
      togglePanel();
    },
    {
      name: 'bassGroup',
      bounded: true,
    }
  );
  dragElement(
    assets.cactus,
    () => {
      switchPanel('background');
      togglePanel();
    },
    {
      horizontal: true,
      name: 'cactus',
    }
  );

  dragElement(
    assets.clock,
    () => {
      switchPanel('drum');
      togglePanel();
    },
    {
      name: 'clock',
    }
  );
  dragElement(
    assets.shelfWithBooks,
    () => {
      switchPanel('info');
      togglePanel();
    },
    {
      name: 'shelfWithBooks',
      bounded: true,
    }
  );

  state.backgroundSounds.switch = function (index) {
    state.backgroundSounds.samples
      .get(state.backgroundSounds.names[state.backgroundSounds.index])
      .stop();
    state.backgroundSounds.index = index;
    backgroundSoundsSelect.value = index;
    if (checkStarted()) {
      state.backgroundSounds.samples
        .get(state.backgroundSounds.names[state.backgroundSounds.index])
        .start(0);
    }

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
    if (params.class.includes(' ')) {
      img.classList.add(...params.class.split(' '));
    } else {
      img.classList.add(params.class);
    }
  }
  img.style.position = 'absolute';

  if (params.display) {
    img.style.display = params.display;
  } else {
    img.style.display = 'block';
  }

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

  // requestAnimationFrame(() => {
  //   draw();
  // });
}

function drawMainCanvas() {
  let ctx = state.canvas.canvas.getContext('2d');
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  // progress;
  if (checkStarted()) {
    ctx.fillStyle = 'rgba(200, 200, 200, 1)';
    ctx.fillRect(0, 0, width * Tone.Transport.progress, height * 0.05);
  }
}

function drawMelodyCanvas() {
  let ctx = state.canvas.melodyCanvas.getContext('2d');
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  if (
    state.melody.interpolationData &&
    state.melody.interpolationData[state.melody.interpolationIndex]
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
      state.melody.interpolationData[state.melody.interpolationIndex]
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

  if (checkStarted()) {
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
    const ww = (0.85 * (w * (quantizedEndStep - quantizedStartStep))) / totalQuantizedSteps;

    let current = false;

    if (checkStarted()) {
      const p = (Tone.Transport.progress * 2) % 1;
      if (
        p > quantizedStartStep / totalQuantizedSteps &&
        p < quantizedEndStep / totalQuantizedSteps
      ) {
        current = true;
      }
    }

    if (current) {
      ctx.fillStyle = '#373fff';
      const hhh = hh * (1 + CURRENT_NOTE_ENLARGE_RATIO);
      const yyy = ypos - hh * CURRENT_NOTE_ENLARGE_RATIO * 0.5;
      ctx.fillRect(xpos, yyy, ww, hhh);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(xpos, ypos, ww, hh);
    }

    ctx.restore();
  }

  if (checkStarted()) {
    ctx.fillStyle = '#373fff';
    ctx.fillRect(w * ((Tone.Transport.progress * 2) % 1), 0, -5, h);
  }
  ctx.restore();
}

function seqCallback(time, b) {
  if (!state.drum.mute) {
    if (state.drum.patternIndex === 0) {
      if (b % 16 === 0) {
        state.drum.scale.kk = 1;
        state.drum.samples.get('kk').start(time);
      }
      if (b % 16 === 8) {
        state.drum.scale.sn = 1;
        state.drum.samples.get('sn').start(time);
      }
      if (b % 2 === 0) {
        state.drum.scale.hh = 1;
        state.drum.samples.get('hh').start(time);
      }
    } else if (state.drum.patternIndex === 1) {
      if (b % 32 === 0 || b % 32 === 20) {
        state.drum.samples.get('kk').start(time);
      }
      if (b % 16 === 8) {
        state.drum.samples.get('sn').start(time);
      }
      if (b % 2 === 0) {
        state.drum.samples.get('hh').start(time + 0.07);
      }
    } else if (state.drum.patternIndex === 2) {
      if (b % 16 === 0 || b % 16 === 10 || (b % 32 >= 16 && b % 16 === 11)) {
        state.drum.samples.get('kk').start(time);
      }
      if (b % 8 === 4) {
        state.drum.samples.get('sn').start(time);
      }
      if (b % 2 === 0) {
        state.drum.samples.get('hh').start(time + 0.07);
      }
    }

    if (b % 16 === 7) {
      // tap foot
      assets.makeAvatarLiftFoot();
    } else if (b % 16 === 8) {
      assets.makeAvatarDropFoot();
    }
  }

  if (state.pageVisible && b % 2 === 0) {
    draw();
  }

  // Markov chain
  if (state.master.autoBreak) {
    if (b % 32 === 31) {
      state.idleBarsCount += 1;
      state.barsCount += 1;

      if (state.drum.mute) {
        if (Math.random() > 0.05) {
          toggleDrum(false, true, time);
          if (state.idleBarsCount > 8) {
            state.idleBarsCount = 0;
            randomChange();
          }

          if (state.barsCount > 400) {
            state.barsCount = 0;
            reset();
          }
        }
      } else {
        if (Math.random() < TRANSITION_PROB) {
          toggleDrum(true, true, time);
        }
      }
    }
  }
}

async function loadMidiFiles() {
  state.chords.midis = await Promise.all([
    Midi.fromUrl('./midi/IV_IV_I_I/IV_IV_I_I_C_1.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/IV_IV_I_I_C_3.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/IV_IV_I_I_C_2.mid'),
    // Midi.fromUrl("./midi/i_III_iv_v_Am.mid"),
    // Midi.fromUrl("./midi/VI_i_VI_v_Am.mid"),
  ]);

  changeChords(state.chords.index);

  state.melody.midis = await Promise.all([
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_1_C.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_2_C.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_3_C.mid'),
    Midi.fromUrl('./midi/IV_IV_I_I/melody/m_4_C.mid'), // NUM_PRESET_MELODIES -> 4
  ]);
  state.melody.midis[NUM_PRESET_MELODIES] = state.melody.midis[0]; // placeholder
  state.melody.toneNotes = state.melody.midis.map(midiToToneNotes);

  secondMelodySelect.value = state.melody.secondIndex;
  changeMelodyByIndex(state.melody.index);

  console.log('midi loaded');
  checkFinishLoading();
}

function checkFinishLoading() {
  state.loadEventsCount += 1;
  console.log(`[${state.loadEventsCount}/${LOAD_EVENTS_COUNTS_THRESHOLD}]`);
  if (state.loading && state.loadEventsCount >= LOAD_EVENTS_COUNTS_THRESHOLD) {
    state.loading = false;
    console.log('Finish loading!');
    onFinishLoading();
  } else if (state.loading) {
    const percentage = Math.floor((state.loadEventsCount / LOAD_EVENTS_COUNTS_THRESHOLD) * 100);
    startButton.textContent = `loading...${percentage}/100%`;
  }
}

function toggleStart() {
  const ac = Tone.context._context;
  if (ac.state !== 'started') {
    ac.resume();
  }

  if (checkStarted()) {
    stopTransport();
  } else {
    startTransport();
  }
}

function startTransport() {
  Tone.Transport.start();
  onTransportStart();
  startButton.textContent = 'stop';
  assets.light.src = './assets/light-on.png';
  canvasOverlay.style.display = 'none';
}

function stopTransport() {
  Tone.Transport.stop();
  onTransportStop();
  startButton.textContent = 'start';
  assets.light.src = './assets/light-off.png';
  canvasOverlay.style.display = 'flex';
}

function onFinishLoading() {
  canvasOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  startButton.textContent = 'start';
  startButton.classList.remove('disabled');
  startButton.addEventListener('click', () => {
    if (!state.started) {
      state.started = true;
      onFirstTimeStarted();
    }
    toggleStart();
  });

  // callbacks

  state.drum.changeGain = function (v) {
    state.drum.gain = v;
    drumVolumeSlider.value = v * 100;
    state.drum.gainNode.gain.value = v;
  };

  state.drum.changeFilter = function (v) {
    state.drum.tone = v;
    const frq = v * 10000 + 200;
    state.drum.lpf.frequency.value = frq;
    drumToneSlider.value = v * 100;
  };

  state.melody.changeGain = function (v) {
    state.melody.gain = v;
    melodyVolumeSlider.value = v * 100;
  };

  state.melody.changeSwing = function (v) {
    state.melody.swing = v;
    melodySwingSlider.value = v * 100;
  };

  state.chords.changeGain = function (v) {
    state.chords.gain = v;
    chordsVolumeSlider.value = v * 100;
  };

  state.chords.changeSwing = function (v) {
    state.chords.swing = v;
    chordsSwingSlider.value = v * 100;
  };

  state.bass.changeFilter = function (v) {
    const frq = v * 4;
    state.bass.lpf.frequency.value = frq;
    bassToneSlider.value = v;
  };
  state.bass.changeGain = function (v) {
    state.bass.gain.gain.value = v;
    bassVolumeSlider.value = v * 100;
  };

  state.backgroundSounds.changeVolume = function (v) {
    state.backgroundSounds.gainNode.gain.value = v;
    backgroundVolumeSlider.value = v * 100;
  };
  state.backgroundSounds.changeFilter = function (v) {
    const frq = v * 20000;
    state.backgroundSounds.hpf.frequency.value = frq;
    backgroundToneSlider.value = v * 100;
  };

  state.master.changeReverb = function (v) {
    masterReverbSlider.value = v * 100;
    state.master.reverb.wet.linearRampTo(v, 1, Tone.now());
  };

  state.master.changeFilter = function (v) {
    masterToneSlider.value = (v / 20000) * 100;
    state.master.lpf.frequency.linearRampTo(f, 1, Tone.now());
  };

  // add event listeners

  changeMasterBpm(state.master.bpm);
  bpmInput.addEventListener('input', (e) => {
    changeMasterBpm(bpmInput.value);
  });

  drumToggle.checked = !state.drum.mute;
  drumToggle.addEventListener('change', (e) => {
    toggleDrum(!drumToggle.checked);
  });

  if (state.drum.volumeSliderValue) {
    state.drum.changeGain(state.drum.volumeSliderValue / 100);
  } else {
    state.drum.changeGain(state.drum.gain);
  }
  drumVolumeSlider.addEventListener('input', () => {
    state.drum.changeGain(drumVolumeSlider.value / 100);
  });

  if (state.drum.toneSliderValue) {
    state.drum.changeFilter(state.drum.toneSliderValue / 100);
  } else {
    state.drum.changeFilter(state.drum.tone);
  }
  drumToneSlider.addEventListener('input', () => {
    state.drum.changeFilter(drumToneSlider.value / 100);
  });

  changeDrumPattern(state.drum.patternIndex);
  drumPatternsSelect.addEventListener('change', () => {
    changeDrumPattern(parseInt(drumPatternsSelect.value, 10));
  });

  toggleChords(state.chords.mute);
  chordsMuteCheckbox.addEventListener('change', () => {
    toggleChords(!chordsMuteCheckbox.checked);
  });
  chordsSelect.addEventListener('change', () => {
    changeChords(chordsSelect.value);
  });

  changeChordsInstrument(state.chords.instrumentIndex);
  chordsInstrumentSelect.addEventListener('change', () => {
    changeChordsInstrument(chordsInstrumentSelect.value);
  });

  firstMelodySelect.addEventListener('change', () => {
    changeMelodyByIndex(parseInt(firstMelodySelect.value));
  });

  secondMelodySelect.addEventListener('change', () => {
    state.melody.secondIndex = secondMelodySelect.value;
    sendInterpolationMessage(state.melody.interpolationData[0]);
  });

  state.backgroundSounds.switch(state.backgroundSounds.index);
  toggleBackgroundSounds(state.backgroundSounds.mute);
  backgroundSoundsMuteCheckbox.addEventListener('change', () => {
    toggleBackgroundSounds(!backgroundSoundsMuteCheckbox.checked);
  });

  backgroundSoundsSelect.addEventListener('change', () => {
    state.backgroundSounds.switch(Number(backgroundSoundsSelect.value));
  });

  toggleMelody(state.melody.mute);
  melodyMuteCheckbox.addEventListener('change', () => {
    toggleMelody(!melodyMuteCheckbox.checked);
  });

  changeMelodyInstrument(state.melody.instrumentIndex);
  melodyInstrumentSelect.addEventListener('change', () => {
    changeMelodyInstrument(melodyInstrumentSelect.value);
  });

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

  if (state.melody.volumeSliderValue) {
    state.melody.changeGain(state.melody.volumeSliderValue / 100);
  }
  melodyVolumeSlider.addEventListener('input', () => {
    state.melody.changeGain(melodyVolumeSlider.value / 100);
  });

  toggleChords(state.chords.mute);
  if (state.chords.volumeSliderValue) {
    state.chords.changeGain(state.chords.volumeSliderValue / 100);
  }
  chordsVolumeSlider.addEventListener('input', () => {
    state.chords.changeGain(chordsVolumeSlider.value / 100);
  });

  toggleBass(state.bass.mute);
  bassMuteCheckbox.addEventListener('change', () => {
    toggleBass(!bassMuteCheckbox.checked);
  });

  if (state.bass.volumeSliderValue) {
    state.bass.changeGain(state.bass.volumeSliderValue / 100);
  }
  bassVolumeSlider.addEventListener('input', () => {
    state.bass.changeGain(bassVolumeSlider.value / 100);
  });

  if (state.bass.toneSliderValue) {
    state.bass.changeFilter(state.bass.toneSliderValue);
  }
  bassToneSlider.addEventListener('input', () => {
    state.bass.changeFilter(bassToneSlider.value);
  });

  if (state.backgroundSounds.volumeSliderValue) {
    state.backgroundSounds.changeVolume(state.backgroundSounds.volumeSliderValue / 100);
  }

  if (state.backgroundSounds.toneSliderValue) {
    state.backgroundSounds.changeFilter(state.backgroundSounds.toneSliderValue / 100);
  }

  backgroundVolumeSlider.addEventListener('input', () => {
    state.backgroundSounds.changeVolume(backgroundVolumeSlider.value / 100);
  });

  backgroundToneSlider.addEventListener('input', () => {
    state.backgroundSounds.changeFilter(backgroundToneSlider.value / 100);
  });

  masterAutoBreakCheckbox.addEventListener('change', () => {
    state.master.autoBreak = masterAutoBreakCheckbox.checked;
  });

  masterReverbSlider.addEventListener('input', () => {
    const wet = masterReverbSlider.value / 100;
    state.master.reverb.wet.value = wet;
  });

  masterToneSlider.addEventListener('input', () => {
    const frq = masterToneSlider.value * 198 + 200;
    state.master.lpf.frequency.value = frq;
  });

  masterVolumeSlider.addEventListener('input', () => {
    changeMasterVolume(masterVolumeSlider.value / 100);
  });

  state.melody.changeSwing(state.melody.swing);
  melodySwingSlider.addEventListener('input', () => {
    state.melody.changeSwing(melodySwingSlider.value / 100);
  });

  state.chords.changeSwing(state.chords.swing);
  chordsSwingSlider.addEventListener('input', () => {
    state.chords.changeSwing(chordsSwingSlider.value / 100);
  });

  shareButton.addEventListener('click', () => {
    shareButtonHint.style.display = 'block';
    const url = stateToUrlParams();
    hiddenUrlInput.value = url;
    hiddenUrlInput.select();
    hiddenUrlInput.setSelectionRange(0, 99999); /*For mobile devices*/
    document.execCommand('copy');

    setTimeout(() => {
      shareButtonHint.style.display = 'none';
    }, 2000);
  });

  window.addEventListener('resize', () => {
    const canvas = state.canvas.canvas;
    canvasDiv.style.height = `${backgroundImage.clientWidth * (435 / 885)}px`;

    canvas.width = canvasDiv.clientWidth;
    canvas.height = canvasDiv.clientHeight;

    draw();
  });

  // show canvas
  state.canvas.moveMelodyCanvasToRoom();

  // model
  sendInterpolationMessage();

  setupPageVisibilityCallback();
  setupKeyboardEvents();
}

function setupKeyboardEvents() {
  window.addEventListener('keydown', (e) => {
    const callbacks = {
      9: () => {
        if (youtubeDiv.style.display !== 'block') {
          youtubeDiv.style.display = 'block';
          shareButtonDiv.style.display = 'none';
        } else {
          youtubeDiv.style.display = 'none';
          shareButtonDiv.style.display = 'block';
        }
      },
      89: () => {
        onClickConnect();
      },
      //32: () => {
      //   toggleStart();
      //},
    };
    if (callbacks[e.keyCode]) {
      e.preventDefault();
      callbacks[e.keyCode]();
    }
  });
}

async function onFirstTimeStarted() {
  // if (window.innerWidth < 720) {
  //   return;
  // }
  const interval = DEFAULT_GUIDANCE_INTERVAL;
  await sleep(interval);
  bubbleDiv.style.display = 'block';

  await sleep(interval * 5);
  bubbleDiv.style.width = '10rem';
  bubbleDiv.textContent = `Can you hear the piano?`;

  await sleep(interval * 5);
  bubbleDiv.style.width = '12rem';
  bubbleDiv.textContent = `Tinker with the objects in this room and listen carefully.`;

  // await sleep(interval * 10);
  // bubbleDiv.textContent = `Click on me to give me coffee.`;

  await sleep(interval * 15);
  assets.catGroup.appendChild(bubbleDiv);
  bubbleDiv.style.width = '5rem';
  bubbleDiv.textContent = `meow...`;

  await sleep(interval * 10);
  assets.avatarGroup.appendChild(bubbleDiv);
  bubbleDiv.style.width = '8rem';
  bubbleDiv.textContent = 'Enjoy the magical room.';

  await sleep(interval * 10);
  bubbleDiv.style.width = '10rem';
  bubbleDiv.style.display = 'none';
}

function onTransportStart() {
  if (state.backgroundSounds.mute) {
    return;
  }
  state.backgroundSounds.samples
    .get(state.backgroundSounds.names[state.backgroundSounds.index])
    .start();
}

function onTransportStop() {
  state.backgroundSounds.samples
    .get(state.backgroundSounds.names[state.backgroundSounds.index])
    .stop();
}

function toggleBackgroundSounds(value) {
  if (value !== undefined) {
    state.backgroundSounds.mute = value;
  } else {
    state.backgroundSounds.mute = !state.backgroundSounds.mute;
  }

  if (state.backgroundSounds.mute) {
    assets.cactus.childNodes[0].classList.add('transparent');
    assets.cactus.childNodes[1].classList.remove('hidden');
    state.backgroundSounds.gate.gain.value = 0;
    assets.window.src = assets.windowUrls[1];
  } else {
    assets.cactus.childNodes[0].classList.remove('transparent');
    assets.cactus.childNodes[1].classList.add('hidden');
    state.backgroundSounds.gate.gain.value = 1;
    assets.window.src = assets.windowUrls[0];

    if (checkStarted()) {
      state.backgroundSounds.samples
        .get(state.backgroundSounds.names[state.backgroundSounds.index])
        .start();
    }
  }

  backgroundSoundsMuteCheckbox.checked = !state.backgroundSounds.mute;
}

function toggleChords(value) {
  if (value !== undefined) {
    state.chords.mute = value;
  } else {
    state.chords.mute = !state.chords.mute;
  }

  if (state.chords.mute) {
    assets.chordsInstruments.forEach((i) => {
      i.classList.add('transparent');
      i.childNodes[1].classList.remove('hidden');
    });
  } else {
    assets.chordsInstruments.forEach((i) => {
      i.classList.remove('transparent');
      i.childNodes[1].classList.add('hidden');
    });
  }

  chordsMuteCheckbox.checked = !state.chords.mute;
}

function toggleMelody(value) {
  if (value !== undefined) {
    state.melody.mute = value;
  } else {
    state.melody.mute = !state.melody.mute;
  }

  if (state.melody.mute) {
    assets.melodyInstruments.forEach((i) => {
      i.classList.add('transparent');
      i.childNodes[1].classList.remove('hidden');
    });
  } else {
    assets.melodyInstruments.forEach((i) => {
      i.classList.remove('transparent');
      i.childNodes[1].classList.add('hidden');
    });
  }

  melodyMuteCheckbox.checked = !state.melody.mute;
}

function toggleBass(value) {
  if (value !== undefined) {
    state.bass.mute = value;
  } else {
    state.bass.mute = !state.bass.mute;
  }

  if (state.bass.mute) {
    state.bass.gate.gain.value = 0;
    assets.bass.classList.add('transparent');
    assets.bassGroup.childNodes[1].classList.remove('hidden');
  } else {
    state.bass.gate.gain.value = 1;
    assets.bass.classList.remove('transparent');
    assets.bassGroup.childNodes[1].classList.add('hidden');
  }

  bassMuteCheckbox.checked = !state.bass.mute;
}

function toggleDrum(value, changeFilter = false, time = 0) {
  if (value === undefined) {
    state.drum.mute = !state.drum.mute;
  } else {
    state.drum.mute = value;
  }

  if (state.drum.mute) {
    assets.clock.childNodes[0].classList.add('transparent');
    assets.clock.childNodes[2].classList.add('transparent');
    assets.clock.childNodes[1].classList.remove('hidden');
  } else {
    assets.clock.childNodes[0].classList.remove('transparent');
    assets.clock.childNodes[2].classList.remove('transparent');
    assets.clock.childNodes[1].classList.add('hidden');
  }

  if (changeFilter) {
    if (!state.drum.mute) {
      state.master.lpf.frequency.linearRampTo(20000, 1, time);
    } else {
      state.master.lpf.frequency.linearRampTo(200, 0.5, time);
    }
  }

  // sync ui
  drumToggle.checked = !state.drum.mute;
  assets.switchAvatar(state.drum.mute);
}

function changeChords(index = 0) {
  index = index % state.chords.midis.length;
  if (state.chords.part) {
    state.chords.part.cancel(0);
  }
  state.chords.index = index;
  state.chords.part = new Tone.Part((time, note) => {
    !state.chords.mute &&
      state.instruments[state.chords.instrumentIndex].triggerAttackRelease(
        toFreq(note.pitch - (state.chords.instrumentIndex === 0 ? 0 : 12)),
        note.duration,
        time + state.chords.swing * (75 / state.master.bpm) * Math.random() * 0.1,
        note.velocity * state.chords.gain
      );
  }, midiToToneNotes(state.chords.midis[state.chords.index])).start(0);

  backgroundImage.src = `./assets/rooom-${state.chords.index}.png`;
  chordsSelect.value = index;
}

function changeMelodyByIndex(index = 0) {
  if (state.melody.part) {
    state.melody.part.cancel(0);
  }
  state.melody.index = index;
  if (index === state.melody.toneNotes.length - 1) {
    sendContinueMessage();
    return;
  }

  state.melody.part = new Tone.Part((time, note) => {
    !state.melody.mute &&
      state.melody.instrument.triggerAttackRelease(
        toFreq(note.pitch - 12),
        note.duration,
        time + Math.random() * (75 / state.master.bpm) * 0.3 * state.melody.swing,
        note.velocity * state.melody.gain
      );
  }, state.melody.toneNotes[state.melody.index]).start(0);

  state.melody.part.loop = false;

  firstMelodySelect.value = index;
  sendInterpolationMessage();

  draw();
}

function randomlyChangeMelodyByIndex() {
  const index = Math.floor(Math.random() * NUM_PRESET_MELODIES);
  changeMelodyByIndex(index);
}

function changeMelody(readyMidi) {
  if (state.melody.part) {
    state.melody.part.cancel(0);
  }
  state.melody.part = new Tone.Part((time, note) => {
    !state.melody.mute &&
      state.melody.instrument.triggerAttackRelease(
        toFreq(note.pitch - 12),
        note.duration,
        time + Math.random() * (75 / state.master.bpm) * 0.3 * state.melody.swing,
        note.velocity * state.melody.gain
      );
  }, readyMidi).start(0);
  state.melody.part.loop = true;
  state.melody.part.loopEnd = '4:0:0';

  draw();
}

function changeInterpolationIndex(index) {
  state.melody.interpolationIndex = index;
  changeMelody(state.melody.interpolationToneNotes[index]);

  interpolationSlider.value = index;
  secondInterpolationSlider.value = index;
}

function randomlyChangeInterpolationIndex() {
  const index = Math.floor(Math.random() * state.melody.interpolationToneNotes.length);
  changeInterpolationIndex(index);
}

function sendInterpolationMessage(m1, m2, id = 0) {
  state.melody.waitingInterpolation = true;
  melodyInteractionDivs[0].classList.add('disabledbutton');

  // console.log(`interpolate ${state.melody.index} ${state.melody.secondIndex}`);
  const firstMelody = state.melody.midis[state.melody.index];
  const left = m1 ? m1 : midiToModelFormat(firstMelody);

  const secondMelody = state.melody.midis[state.melody.secondIndex];
  const right = m2 ? m2 : midiToModelFormat(secondMelody);

  state.melody.interpolationData[0] = left;
  state.melody.interpolationData[NUM_INTERPOLATIONS - 1] = right;

  LOAD_ML_MODELS &&
    worker.postMessage({
      id,
      msg: 'interpolate',
      left,
      right,
    });
}

function sendContinueMessage() {
  state.canvas.melodyCanvas.style.opacity = 0.1;
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

  state.chords.instrumentIndex = index;
}

function randomlyChangeChordsInstrument() {
  const index = Math.floor(Math.random() * NUM_INSTRUMENTS);
  changeChordsInstrument(index);
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
  state.melody.instrumentIndex = index;
  state.melody.instrument = state.instruments[index];
}

function randomlyChangeMelodyInstrument() {
  const index = Math.floor(Math.random() * NUM_INSTRUMENTS);
  changeMelodyInstrument(index);
}

function changeMasterVolume(v) {
  masterVolumeSlider.value = v * 100;
  state.master.gain.gain.value = v;
}

function changeMasterBpm(v) {
  v = Math.min(Math.max(60, v), 100);
  bpmInput.value = v;
  state.master.bpm = v;
  Tone.Transport.bpm.value = v;
}

function changeMasterReverb(v) {
  masterReverbSlider.value = v * 100;
  state.master.reverb.wet.linearRampTo(v, 1, Tone.now());
}

function changeMasterFilter(v) {
  masterToneSlider.value = (v / 20000) * 100;
  state.master.lpf.frequency.linearRampTo(v, 1, Tone.now());
}

function changeDrumPattern(index) {
  state.drum.patternIndex = index;
  drumPatternsSelect.value = index;
}

function reset() {
  changeMasterBpm(90);
  changeDrumPattern(0);
  toggleMelody(false);
  toggleChords(false);
  toggleBass(false);
  toggleDrum(false);
  toggleBackgroundSounds(false);
  changeChords(1);
  changeChordsInstrument(2);
  changeMelodyByIndex(1);
  changeInterpolationIndex(0);
  changeMelodyInstrument(3);
  state.backgroundSounds.switch(1);
  state.backgroundSounds.gainNode.gain.value = 0.7;
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
      duration: (quantizedEndStep - quantizedStartStep) * (state.master.bpm / 60) * (1 / 4),
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

function randomChange() {
  let seed = Math.random();
  if (seed > 0.95) {
    randomlyChangeChordsInstrument();
  } else if (seed < 0.05) {
    randomlyChangeMelodyInstrument();
  }

  seed = Math.random();
  if (seed > 0.5) {
    randomlyChangeInterpolationIndex();
    return;
  }

  seed = Math.random();
  if (seed > 0.9) {
    randomlyChangeMelodyByIndex();
    return;
  } else if (seed < 0.1) {
    sendContinueMessage();
    return;
  }

  seed = Math.random();
  if (seed > 0.95) {
    const index = Math.floor(Math.random() * NUM_PRESET_CHORD_PROGRESSIONS);
    changeChords(index);
    return;
  } else if (seed < 0.05) {
    const index = Math.floor(Math.random() * 4);
    state.backgroundSounds.switch(index);
  }
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

function createCircleElement() {
  const el = document.createElement('DIV');
  el.classList.add('circle', 'blink');
  return el;
}

function removeElement(el) {
  el.parentNode.removeChild(el);
}

function dragElement(el, onClickCallback = () => {}, params = {}) {
  let shiftX = 0;
  let shiftY = 0;
  let posX = 0;
  let posY = 0;
  let dragging = false;
  let draggingFrameCount = 0;
  el.onmousedown = dragMouseDown;
  el.addEventListener('click', (e) => {
    if (!dragging) {
      onClickCallback(e);
    }
    dragging = false;
  });

  function dragMouseDown(e) {
    draggingFrameCount = 0;
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    // get the mouse cursor position at startup:
    posX = e.clientX;
    posY = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (draggingFrameCount++ > DRAGGING_PREVENT_CLICK_EVENT_THRESHOLD_FRAMECOUNT) {
      dragging = true;
    }
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    shiftX = posX - e.clientX;
    if (!params.horizontal) {
      shiftY = posY - e.clientY;
    }
    posX = e.clientX;
    posY = e.clientY;

    // set the element's new position:
    const w = el.parentElement.clientWidth;
    const h = el.parentElement.clientHeight;
    let top = ((el.offsetTop - shiftY) / h) * 100;
    let left = ((el.offsetLeft - shiftX) / w) * 100;
    if (params.bounded) {
      const ww = Number(el.style.width.substring(0, el.style.width.length - 1));
      top = Math.max(Math.min(top, 95), -5);
      left = Math.max(Math.min(left, 100 - ww), 0);
    }
    el.style.top = `${top}%`;
    el.style.left = `${left}%`;

    if (params.name) {
      state.assets[params.name] = {
        top: el.style.top,
        left: el.style.left,
      };
    }
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
          // if (checkStarted()) {
          //   stopTransport();
          // }
          state.pageVisible = false;
        } else {
          state.pageVisible = true;
        }
      },
      false
    );
  }
}

function sleep(m) {
  return new Promise((r) => setTimeout(r, m));
}

/**
 *
 * Save & Restore
 *
 */

function stateToUrlParams() {
  const savedState = {
    master: {
      bpm: state.master.bpm,
      reverb: state.master.reverb.wet.value,
      filter: state.master.lpf.frequency.value,
      volume: state.master.gain.gain.value,
    },
    melody: {
      mute: state.melody.mute,
      index: state.melody.index,
      secondIndex: state.melody.secondIndex,
      interpolationIndex: state.melody.interpolationIndex,
      instrumentIndex: state.melody.instrumentIndex,
      volumeSliderValue: melodyVolumeSlider.value,
      swing: state.melody.swing,
      retrivedRnnGeneratedResult: state.melody.cachedRnnGeneratedResult,
    },
    chords: {
      mute: state.chords.mute,
      index: state.chords.index,
      instrumentIndex: state.chords.instrumentIndex,
      volumeSliderValue: chordsVolumeSlider.value,
      swing: state.chords.swing,
    },
    backgroundSounds: {
      mute: state.backgroundSounds.mute,
      volumeSliderValue: backgroundVolumeSlider.value,
      toneSliderValue: backgroundToneSlider.value,
      index: state.backgroundSounds.index,
    },
    drum: {
      mute: state.drum.mute,
      patternIndex: state.drum.patternIndex,
      volumeSliderValue: drumVolumeSlider.value,
      toneSliderValue: drumToneSlider.value,
    },
    bass: {
      mute: state.bass.mute,
      volumeSliderValue: bassVolumeSlider.value,
      toneSliderValue: bassToneSlider.value,
    },
    assets: {
      boardText: assets.textInput.value,
    },
  };

  // save position to urls
  const names = Object.keys(state.assets);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name === 'boardText') {
      continue;
    }
    savedState.assets[name] = {
      top: state.assets[name].top,
      left: state.assets[name].left,
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const result = JSON.stringify(savedState);
  urlParams.set('data', result);
  window.history.pushState(null, null, '?' + urlParams.toString());
  return window.location.href;
}

function urlParamsToState() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ss = JSON.parse(urlParams.get('data'));
    if (!ss) {
      return;
    }

    if (ss.master) {
      const { master } = ss;
      changeMasterVolume(master.volume);
      changeMasterBpm(master.bpm);
      changeMasterFilter(master.filter);
      changeMasterReverb(master.reverb);
    }

    const groups = ['melody', 'chords', 'bass', 'drum', 'backgroundSounds', 'assets'];
    for (let k = 0; k < groups.length; k++) {
      const group = groups[k];
      if (!ss[group]) {
        continue;
      }
      const paramKeys = Object.keys(ss[group]);
      for (let i = 0; i < paramKeys.length; i++) {
        const key = paramKeys[i];
        state[group][key] = ss[group][key];
      }
    }
  } catch (e) {
    console.error(e);
    window.history.pushState(null, null, '/');
  }
}

function loadAssetsPositionFromState() {
  const names = Object.keys(state.assets);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name === 'boardText') {
      continue;
    }
    assets[name].style.top = state.assets[name].top;
    assets[name].style.left = state.assets[name].left;
  }
}

/**
 *
 * Fetch YouTube Live Chats
 *
 */

function getApiKeyFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('key');
}

function getChannelIdFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('channelId');
}

function getListenPeriodFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('listenPeriod');
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

  if (p <= 0 || p > 60000) {
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

async function fetchData(url, callback = () => {}) {
  try {
    let res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    alert(err);
  }
}

function handleMessage(msg, author = 'test') {
  const commands = state.commands;
  const commandId = parseMessageToCommand(msg);
  if (commandId === null) {
    return;
  }

  let args;
  if (commandId === WRITE_ON_BOARD) {
    args = { textContent: msg.substring(6) };
  }

  const command = {
    authorName: author,
    content: msg,
    id: commandId,
    args,
  };

  const n = commands.length;
  if (n < 4) {
    commands.push(command);
  } else if (n < 8) {
    if (Math.random() < 0.8) {
      commands.push(command);
    }
  }
}

function checkKeywords(str, keys = []) {
  for (let i = 0; i < keys.length; i++) {
    if (!str.includes(keys[i])) {
      return false;
    }
  }
  return true;
}

async function testMessageCallbacks() {
  handleMessage('trigger bass');
  handleMessage('trigger chords');
  handleMessage('trigger drum');
  handleMessage('trigger melody');
  // handleMessage('trigger melody');
  // handleMessage('more reverb');
  // handleMessage('make melody swing');
  // handleMessage('slow');
  // handleMessage('fast');
  // handleMessage('more filter');
  // handleMessage('cat');
  // handleMessage('window');
  // handleMessage('rnn');
  // handleMessage('less filter');
  // handleMessage('interpolation');
}

function initMessageCallbacks() {
  callbacks[CLICK_CAT] = () => {
    assets.catCallback();
  };
  callbacks[CLICK_WINDOW] = () => {
    const n = state.backgroundSounds.names.length;
    state.backgroundSounds.switch((state.backgroundSounds.index + 1) % n);
  };
  callbacks[CLICK_LIGHT] = () => {
    toggleStart();
  };
  callbacks[GENERATE_NEW_MELODY] = () => {
    sendContinueMessage();
  };
  callbacks[RANDOMIZE_INTERPOLATION] = () => {
    const index = Math.floor(Math.random() * state.melody.interpolationToneNotes.length);
    changeInterpolationIndex(index);
  };
  callbacks[TRIGGER_MELODY] = () => {
    toggleMelody();
  };
  callbacks[TRIGGER_CHORDS] = () => {
    toggleChords();
  };
  callbacks[TRIGGER_DRUM] = () => {
    toggleDrum();
  };
  callbacks[TRIGGER_BASS] = () => {
    toggleBass();
  };
  callbacks[CHANGE_MELODY_INSTRUMENT] = () => {
    const index = Math.floor(Math.random() * NUM_INSTRUMENTS);
    changeMelodyInstrument(index);
  };
  callbacks[CHANGE_CHORDS_INSTRUMENT] = () => {
    const index = Math.floor(Math.random() * NUM_INSTRUMENTS);
    changeChordsInstrument(index);
  };
  callbacks[CHANGE_MELODY_PATTERN] = () => {
    const index = Math.floor(Math.random() * NUM_PRESET_MELODIES);
    changeMelodyByIndex(index);
  };
  callbacks[CHANGE_CHORDS_PATTERN] = () => {
    const index = Math.floor(Math.random() * NUM_PRESET_CHORD_PROGRESSIONS);
    changeChords(index);
  };
  callbacks[CHANGE_DRUM_PATTERN] = () => {
    const index = Math.floor(Math.random() * NUM_DRUM_PATTERNS);
    changeDrumPattern(index);
  };
  callbacks[MAKE_MELODY_SWING] = () => {
    if (state.melody.swing > 0.1) {
      state.melody.changeSwing(0);
    } else {
      state.melody.changeSwing(0.3);
    }
  };
  callbacks[MAKE_CHORDS_SWING] = () => {
    if (state.chords.swing > 0.1) {
      state.chords.changeSwing(0);
    } else {
      state.chords.changeSwing(0.3);
    }
  };
  callbacks[DRINK_COFFEE] = () => {
    toggleDrum(undefined, true, Tone.now());
  };
  callbacks[WRITE_ON_BOARD] = ({ textContent }) => {
    assets.textInput.value = textContent;
  };
  callbacks[INCREASE_BPM] = () => {
    changeMasterBpm(Number(state.master.bpm) + 10);
  };
  callbacks[DECREASE_BPM] = () => {
    changeMasterBpm(Number(state.master.bpm) - 10);
  };
  callbacks[MORE_REVERB] = () => {
    state.master.changeReverb(Math.min(1, state.master.reverb.wet.value + 0.3));
  };
  callbacks[LESS_REVERB] = () => {
    state.master.changeReverb(Math.max(0, state.master.reverb.wet.value - 0.3));
  };
  callbacks[MORE_FILTER] = () => {
    state.master.changeFilter(20000);
  };
  callbacks[LESS_FILTER] = () => {
    state.master.changeFilter(200);
  };
}

function parseMessageToCommand(msg) {
  msg = msg.toLowerCase();
  if (msg.includes('cat')) {
    return CLICK_CAT;
  }

  if (msg.includes('window') || msg.includes('background')) {
    return CLICK_WINDOW;
  }

  // if (msg.includes('light')) {
  //   return CLICK_LIGHT;
  // }

  if ((msg.includes('generate') && msg.includes('melody')) || msg.includes('rnn')) {
    return GENERATE_NEW_MELODY;
  }

  if (msg.includes('interpolation')) {
    return RANDOMIZE_INTERPOLATION;
  }

  if (msg.includes('trigger')) {
    if (msg.includes('melody')) {
      return TRIGGER_MELODY;
    }
    if (msg.includes('chord')) {
      return TRIGGER_CHORDS;
    }
    if (msg.includes('drum')) {
      return TRIGGER_DRUM;
    }
    if (msg.includes('bass')) {
      return TRIGGER_BASS;
    }
  }

  if (msg.includes('instrument')) {
    if (msg.includes('melody')) {
      return CHANGE_MELODY_INSTRUMENT;
    }
    if (msg.includes('chord')) {
      return CHANGE_CHORDS_INSTRUMENT;
    }
  }

  if (msg.includes('pattern')) {
    if (msg.includes('melody')) {
      return CHANGE_MELODY_PATTERN;
    }
    if (msg.includes('chord')) {
      return CHANGE_CHORDS_PATTERN;
    }
    if (msg.includes('drum')) {
      return CHANGE_DRUM_PATTERN;
    }
  }

  if (msg.includes('swing')) {
    if (msg.includes('melody')) {
      return MAKE_MELODY_SWING;
    }
    if (msg.includes('chord')) {
      return MAKE_CHORDS_SWING;
    }
  }

  if (msg.includes('coffee') || msg.includes('break')) {
    return DRINK_COFFEE;
  }

  if (msg.includes('write')) {
    return WRITE_ON_BOARD;
  }

  if (msg.includes('fast') || msg.includes('hype')) {
    return INCREASE_BPM;
  }

  if (msg.includes('slow') || msg.includes('chill')) {
    return DECREASE_BPM;
  }

  if (msg.includes('reverb')) {
    if (msg.includes('more') || msg.includes('add')) {
      return MORE_REVERB;
    }
    if (msg.includes('less')) {
      return LESS_REVERB;
    }
  }

  if (msg.includes('filter')) {
    if (msg.includes('more') || msg.includes('add')) {
      return MORE_FILTER;
    }
    if (msg.includes('less')) {
      return LESS_FILTER;
    }
  }

  if (msg.includes('reverb') && msg.includes('more')) {
    return MORE_REVERB;
  }

  if (msg.includes('reverb') && msg.includes('less')) {
    return LESS_REVERB;
  }

  return null;
}

function consumeNextCommand() {
  if (!state.commands) {
    return;
  }
  if (state.commands.length === 0) {
    return;
  }

  const { authorName, content, id, args } = state.commands.shift();
  console.log(`${id}`);

  if (callbacks[id]) {
    state.idleBarsCount = 0;
    showTextInBubbleFor(`${authorName}: ${content}`);
    callbacks[id](args);
  }
}

async function showTextInBubbleFor(text, time = 2000) {
  bubbleDiv.textContent = text;
  bubbleDiv.style.display = 'block';
  setTimeout(() => {
    bubbleDiv.style.display = 'none';
  }, time);
}

async function onClickConnect() {
  try {
    if (state.fetchintervalid) {
      disconnectYoutubeLiveChat();
      return;
    }

    connectYoutubeButton.classList.remove('is-success');
    connectYoutubeButton.classList.add('is-error');
    connectYoutubeButton.classList.add('disabledbutton');

    connectYoutubeButton.textContent = 'disconnect';
    youtubePromptText.textContent = '[loading...]';

    let lastReadTime = Date.now();
    let paramApiKey = getApiKeyFromParams();
    let apiKey = paramApiKey;
    let hint = 'API key';
    while (!checkApiKeyIsValid(apiKey)) {
      apiKey = prompt(hint, paramKey);
      hint = 'Invalid API key. Try again.';
    }
    if (!apiKey) {
      apiKey = paramApiKey;
    }

    let paramChannelId = getChannelIdFromParams();
    let channelId = paramChannelId;
    if (!channelId) {
      channelId = prompt('Channel Id', CHANNEL_ID);
    }
    if (!channelId) {
      channelId = CHANNEL_ID;
    }

    let paramListenPeriod = Number(getListenPeriodFromParams());
    let listenPeriod = paramListenPeriod;
    if (!checkPeriodIsValid(listenPeriod)) {
      listenPeriod = Number(prompt('Fetch every milliseconds: ', 5000));
      if (!checkPeriodIsValid(listenPeriod)) {
        listenPeriod = 5000;
      }
    }

    console.log('listenPeriod', listenPeriod);
    console.log('channelId', channelId);
    console.log('apiKey', apiKey);

    youtubePromptText.textContent = '[fetching live id...]';
    let liveId;
    let d = await fetchData(getVideoId(apiKey, channelId));

    if (!d.error) {
      liveId = d.items[d.items.length - 1].id.videoId;
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
    const intervalCallback = async () => {
      d = await fetchData(getChatMessagesUrl(apiKey, chatId, nextPageToken));

      if (d.pollingIntervalMillis) {
        listenPeriod = d.pollingIntervalMillis;
      }
      state.fetchintervalid = setTimeout(intervalCallback, listenPeriod);

      if (d.error) {
        youtubePromptDiv.innerHTML = '';
        const el = document.createElement('P');
        el.textContent = d.error.message;
        youtubePromptDiv.appendChild(el);
        // disconnectYoutubeLiveChat();
        return;
      }
      youtubePromptDiv.innerHTML = '';
      if (!d.items) {
        return;
      }
      nextPageToken = d.nextPageToken;
      console.log(`${d.items.length} new messages`);
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
          handleMessage(content, authorName);
        }
      }
    };
    state.fetchintervalid = setTimeout(intervalCallback, listenPeriod);
    console.log('Connected to youtube.');
  } catch (e) {
    console.warn('[youtube connection error]', e);
  }
}

function disconnectYoutubeLiveChat() {
  connectYoutubeButton.classList.remove('disabledbutton');
  youtubePromptText.textContent = '[disconnected]';
  connectYoutubeButton.textContent = 'connect';
  connectYoutubeButton.classList.add('is-success');
  connectYoutubeButton.classList.remove('is-error');
  clearInterval(state.fetchintervalid);
  state.fetchintervalid = undefined;
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

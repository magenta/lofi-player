/**
 * @fileoverview A sample library and quick-loader for tone.js
 *
 * @author N.P. Brosowsky (nbrosowsky@gmail.com)
 * https://github.com/nbrosowsky/tonejs-instruments
 */

/**
 * @license
 * MIT License
 * 
 * Copyright (c) 2018 Nicholaus P. Brosowsky
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * 
 * SAMPLES RELEASED UNDER [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/)
 * =============================================================================
 */

var SampleLibrary = {
  minify: false,
  ext: ".[mp3|ogg]", // use setExt to change the extensions on all files // do not change this variable //
  baseUrl: "./samples/",
  list: [
    "bass-electric",
    "bassoon",
    "cello",
    "clarinet",
    "contrabass",
    "flute",
    "french-horn",
    "guitar-acoustic",
    "guitar-electric",
    "guitar-nylon",
    "harmonium",
    "harp",
    "organ",
    "piano",
    "saxophone",
    "trombone",
    "trumpet",
    "tuba",
    "violin",
    "xylophone"
  ],
  onload: null,

  setExt: function (newExt) {
    var i;
    for (i = 0; i <= this.list.length - 1; i++) {
      for (var property in this[this.list[i]]) {
        this[this.list[i]][property] = this[this.list[i]][property].replace(
          this.ext,
          newExt
        );
      }
    }
    this.ext = newExt;
    return console.log("sample extensions set to " + this.ext);
  },

  load: function (arg) {
    var t, rt, i;
    arg ? (t = arg) : (t = {});
    t.instruments = t.instruments || this.list;
    t.baseUrl = t.baseUrl || this.baseUrl;
    t.onload = t.onload || this.onload;

    // update extensions if arg given
    if (t.ext) {
      if (t.ext != this.ext) {
        this.setExt(t.ext);
      }
      t.ext = this.ext;
    }

    rt = {};

    // if an array of instruments is passed...
    if (Array.isArray(t.instruments)) {
      for (i = 0; i <= t.instruments.length - 1; i++) {
        var newT = this[t.instruments[i]];
        //Minimize the number of samples to load
        if (this.minify === true || t.minify === true) {
          var minBy = 1;
          if (Object.keys(newT).length >= 17) {
            minBy = 2;
          }
          if (Object.keys(newT).length >= 33) {
            minBy = 4;
          }
          if (Object.keys(newT).length >= 49) {
            minBy = 6;
          }

          var filtered = Object.keys(newT).filter(function (_, i) {
            return i % minBy != 0;
          });
          filtered.forEach(function (f) {
            delete newT[f];
          });
        }

        rt[t.instruments[i]] = new Tone.Sampler(newT, {
          baseUrl: t.baseUrl + t.instruments[i] + "/",
          onload: t.onload
        });
      }

      return rt;

      // if a single instrument name is passed...
    } else {
      newT = this[t.instruments];

      //Minimize the number of samples to load
      if (this.minify === true || t.minify === true) {
        minBy = 1;
        if (Object.keys(newT).length >= 17) {
          minBy = 2;
        }
        if (Object.keys(newT).length >= 33) {
          minBy = 4;
        }
        if (Object.keys(newT).length >= 49) {
          minBy = 6;
        }

        filtered = Object.keys(newT).filter(function (_, i) {
          return i % minBy != 0;
        });
        filtered.forEach(function (f) {
          delete newT[f];
        });
      }

      var s = new Tone.Sampler(newT, {
        baseUrl: t.baseUrl + t.instruments + "/",
        onload: t.onload
      });

      return s;
    }
  },

  "bass-electric": {
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    "A#4": "As4.[mp3|ogg]",
    "A#5": "As5.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    "C#5": "Cs5.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    E5: "E5.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    G5: "G5.[mp3|ogg]"
  },

  bassoon: {
    A3: "A3.[mp3|ogg]",
    C2: "C2.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    G1: "G1.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    A1: "A1.[mp3|ogg]",
    A2: "A2.[mp3|ogg]"
  },

  cello: {
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "G#3": "Gs3.[mp3|ogg]",
    "G#4": "Gs4.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    "A#4": "As4.[mp3|ogg]",
    B2: "B2.[mp3|ogg]",
    B3: "B3.[mp3|ogg]",
    B4: "B4.[mp3|ogg]",
    C2: "C2.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    E2: "E2.[mp3|ogg]"
  },

  clarinet: {
    D3: "D3.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    D5: "D5.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    "F#5": "Fs5.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    "A#4": "As4.[mp3|ogg]",
    D2: "D2.[mp3|ogg]"
  },

  contrabass: {
    C1: "C1.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]",
    D1: "D1.[mp3|ogg]",
    E1: "E1.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    "F#0": "Fs0.[mp3|ogg]",
    "F#1": "Fs1.[mp3|ogg]",
    G0: "G0.[mp3|ogg]",
    "G#1": "Gs1.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    A1: "A1.[mp3|ogg]",
    "A#0": "As0.[mp3|ogg]",
    B2: "B2.[mp3|ogg]"
  },

  flute: {
    A5: "A5.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    E5: "E5.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]"
  },

  "french-horn": {
    D2: "D2.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    "D#1": "Ds1.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    G1: "G1.[mp3|ogg]",
    A0: "A0.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    C1: "C1.[mp3|ogg]",
    C3: "C3.[mp3|ogg]"
  },

  "guitar-acoustic": {
    F3: "F3.[mp3|ogg]",
    "F#1": "Fs1.[mp3|ogg]",
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    G1: "G1.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    "G#1": "Gs1.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "G#3": "Gs3.[mp3|ogg]",
    A1: "A1.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    "A#1": "As1.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    B1: "B1.[mp3|ogg]",
    B2: "B2.[mp3|ogg]",
    B3: "B3.[mp3|ogg]",
    C2: "C2.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    D1: "D1.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    "D#1": "Ds1.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    E1: "E1.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    F1: "F1.[mp3|ogg]",
    F2: "F2.[mp3|ogg]"
  },

  "guitar-electric": {
    "D#3": "Ds3.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    "D#5": "Ds5.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    "F#5": "Fs5.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    A5: "A5.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]"
  },

  "guitar-nylon": {
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    "F#5": "Fs5.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G5: "G3.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "G#4": "Gs4.[mp3|ogg]",
    "G#5": "Gs5.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    A5: "A5.[mp3|ogg]",
    "A#5": "As5.[mp3|ogg]",
    B1: "B1.[mp3|ogg]",
    B2: "B2.[mp3|ogg]",
    B3: "B3.[mp3|ogg]",
    B4: "B4.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    "C#5": "Cs5.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    D5: "D5.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    E5: "E5.[mp3|ogg]"
  },

  harmonium: {
    C2: "C2.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    "C#5": "Cs5.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    D5: "D5.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "G#3": "Gs3.[mp3|ogg]",
    "G#4": "Gs4.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    "A#4": "As4.[mp3|ogg]"
  },

  harp: {
    C5: "C5.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    D6: "D6.[mp3|ogg]",
    D7: "D7.[mp3|ogg]",
    E1: "E1.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E5: "E5.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    F6: "F6.[mp3|ogg]",
    F7: "F7.[mp3|ogg]",
    G1: "G1.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G5: "G5.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    A6: "A6.[mp3|ogg]",
    B1: "B1.[mp3|ogg]",
    B3: "B3.[mp3|ogg]",
    B5: "B5.[mp3|ogg]",
    B6: "B6.[mp3|ogg]",
    C3: "C3.[mp3|ogg]"
  },

  organ: {
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]",
    "D#1": "Ds1.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    "D#5": "Ds5.[mp3|ogg]",
    "F#1": "Fs1.[mp3|ogg]",
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    "F#5": "Fs5.[mp3|ogg]",
    A1: "A1.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    A5: "A5.[mp3|ogg]",
    C1: "C1.[mp3|ogg]",
    C2: "C2.[mp3|ogg]"
  },

  piano: {
    A0: "A0.[mp3|ogg]",
    A1: "A1.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    A5: "A5.[mp3|ogg]",
    A6: "A6.[mp3|ogg]",
    "A#0": "As0.[mp3|ogg]",
    "A#1": "As1.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    "A#4": "As4.[mp3|ogg]",
    "A#5": "As5.[mp3|ogg]",
    "A#6": "As6.[mp3|ogg]",
    B0: "B0.[mp3|ogg]",
    B1: "B1.[mp3|ogg]",
    B2: "B2.[mp3|ogg]",
    B3: "B3.[mp3|ogg]",
    B4: "B4.[mp3|ogg]",
    B5: "B5.[mp3|ogg]",
    B6: "B6.[mp3|ogg]",
    C0: "C0.[mp3|ogg]",
    C1: "C1.[mp3|ogg]",
    C2: "C2.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]",
    C7: "C7.[mp3|ogg]",
    "C#0": "Cs0.[mp3|ogg]",
    "C#1": "Cs1.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    "C#5": "Cs5.[mp3|ogg]",
    "C#6": "Cs6.[mp3|ogg]",
    D0: "D0.[mp3|ogg]",
    D1: "D1.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    D5: "D5.[mp3|ogg]",
    D6: "D6.[mp3|ogg]",
    "D#0": "Ds0.[mp3|ogg]",
    "D#1": "Ds1.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    "D#5": "Ds5.[mp3|ogg]",
    "D#6": "Ds6.[mp3|ogg]",
    E0: "E0.[mp3|ogg]",
    E1: "E1.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    E5: "E5.[mp3|ogg]",
    E6: "E6.[mp3|ogg]",
    F0: "F0.[mp3|ogg]",
    F1: "F1.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    F5: "F5.[mp3|ogg]",
    F6: "F6.[mp3|ogg]",
    "F#0": "Fs0.[mp3|ogg]",
    "F#1": "Fs1.[mp3|ogg]",
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    "F#5": "Fs5.[mp3|ogg]",
    "F#6": "Fs6.[mp3|ogg]",
    G0: "G0.[mp3|ogg]",
    G1: "G1.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    G5: "G5.[mp3|ogg]",
    G6: "G6.[mp3|ogg]",
    "G#0": "Gs0.[mp3|ogg]",
    "G#1": "Gs1.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "G#3": "Gs3.[mp3|ogg]",
    "G#4": "Gs4.[mp3|ogg]",
    "G#5": "Gs5.[mp3|ogg]",
    "G#6": "Gs6.[mp3|ogg]"
  },

  saxophone: {
    "D#4": "Ds4.[mp3|ogg]",
    E2: "E2.[mp3|ogg]",
    E3: "E3.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    "F#2": "Fs2.[mp3|ogg]",
    "F#3": "Fs3.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    G2: "G2.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "G#3": "Gs3.[mp3|ogg]",
    "G#4": "Gs4.[mp3|ogg]",
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    B2: "B2.[mp3|ogg]",
    B3: "B3.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    "C#2": "Cs2.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    "C#4": "Cs4.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]"
  },

  trombone: {
    "A#2": "As2.[mp3|ogg]",
    C2: "C2.[mp3|ogg]",
    C3: "C3.[mp3|ogg]",
    "C#1": "Cs1.[mp3|ogg]",
    "C#3": "Cs3.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    "D#1": "Ds1.[mp3|ogg]",
    "D#2": "Ds2.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    F1: "F1.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    "G#1": "Gs1.[mp3|ogg]",
    "G#2": "Gs2.[mp3|ogg]",
    "A#0": "As0.[mp3|ogg]",
    "A#1": "As1.[mp3|ogg]"
  },

  trumpet: {
    C5: "C5.[mp3|ogg]",
    D4: "D4.[mp3|ogg]",
    "D#3": "Ds3.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    F3: "F3.[mp3|ogg]",
    F4: "F4.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    A2: "A2.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    "A#3": "As3.[mp3|ogg]",
    C3: "C3.[mp3|ogg]"
  },

  tuba: {
    "A#1": "As1.[mp3|ogg]",
    "A#2": "As2.[mp3|ogg]",
    D2: "D2.[mp3|ogg]",
    D3: "D3.[mp3|ogg]",
    "D#1": "Ds1.[mp3|ogg]",
    F0: "F0.[mp3|ogg]",
    F1: "F1.[mp3|ogg]",
    F2: "F2.[mp3|ogg]",
    "A#0": "As0.[mp3|ogg]"
  },

  violin: {
    A3: "A3.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    A5: "A5.[mp3|ogg]",
    A6: "A6.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]",
    C7: "C7.[mp3|ogg]",
    E4: "E4.[mp3|ogg]",
    E5: "E5.[mp3|ogg]",
    E6: "E6.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    G5: "G5.[mp3|ogg]",
    G6: "G6.[mp3|ogg]"
  },

  xylophone: {
    C7: "C7.[mp3|ogg]",
    G3: "G3.[mp3|ogg]",
    G4: "G4.[mp3|ogg]",
    G5: "G5.[mp3|ogg]",
    G6: "G6.[mp3|ogg]",
    C4: "C4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]"
  }
};

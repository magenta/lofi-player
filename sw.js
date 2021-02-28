self.addEventListener('install', e => {
  e.waitUntil(
  (async function() {
    const cache = await caches.open("piano-genie-assets");
    
    const resources = [
      "index.html",
      "style.css",
      "script.js",
      "worker.js",
      "manifest.json",
      "third_party/Tonejs-Instruments.js",
      'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
      "https://unpkg.com/nes.css@2.3.0/css/nes.min.css",
      "https://unpkg.com/tone@13.8.25/build/Tone.js",
      "https://unpkg.com/@tonejs/midi@2.0.26/build/Midi.js",
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.4.0/dist/tf.min.js",
      "https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/core.js",
      "https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/music_vae.js",
      "https://cdn.jsdelivr.net/npm/@magenta/music@1.17.0/es6/music_rnn.js",

      "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small/config.json",
      "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small/weights_manifest.json",
      
      "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv/config.json",
      "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv/weights_manifest.json",

      "midi/IV_IV_I_I/melody/m_4_C.mid",
    ];

    for (let i = 1; i <= 5; i++) {
      resources.push(`https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small/group1-shard${i}of5`)
    }
    
    for (let i = 1; i <= 2; i++) {
      resources.push(`https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv/group1-shard${i}of2`)
    }

    const local = cache.addAll(resources);
    await Promise.all([local]);
  })()
  );
});

self.addEventListener('fetch', e => {
  // Fix the trailing slash.
  let request = e.request;
  if(request.url.endsWith("/")) {
    request = new Request(request.url + "index.html", e);
  }
  
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
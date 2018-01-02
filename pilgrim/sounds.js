const ctx = new AudioContext()

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min))
}

function createNoise(amount) {
  const node = ctx.createScriptProcessor(1024, 2, 2)
  node.onaudioprocess = ({ inputBuffer, outputBuffer }) => {
    for (let c = 0; c < outputBuffer.numberOfChannels; c++) {
      const inputData = inputBuffer.getChannelData(c)
      const outputData = outputBuffer.getChannelData(c)

      for (let i = 0; i < outputData.length; i++) {
        const noisedSample = inputData[i] + amount * (1 - 2 * Math.random())
        outputData[i] = Math.max(Math.min(1, noisedSample), -1)
      }
    }
  }
  return node
}

function createRumble() {
  const tri = ctx.createOscillator()
  tri.type = 'sine'
  tri.frequency.value = 80

  const square = ctx.createOscillator()
  square.type = 'triangle'
  square.frequency.value = 30

  const squareGain = ctx.createGain()
  squareGain.gain.value = 3

  const squareMod = ctx.createOscillator()
  squareMod.type = 'sine'
  squareMod.frequency.value = 0.15
  squareMod.start()

  const squareModGain = ctx.createGain()
  squareModGain.gain.value = 0.2
  squareMod.connect(squareModGain)
  squareModGain.connect(square.frequency)

  square.connect(squareGain)
  squareGain.connect(tri.frequency)
  square.start()

  const saw = ctx.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.value = 300
  const sawGain = ctx.createGain()
  sawGain.gain.value = 1
  saw.connect(sawGain)
  sawGain.connect(tri.frequency)
  saw.start()

  const noise = createNoise(0.03)

  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = 250
  lpf.Q.value = 3

  const lpfLfo = ctx.createOscillator()
  lpfLfo.type = 'sine'
  lpfLfo.frequency.value = 0.02
  const lpfLfoGain = ctx.createGain()
  lpfLfoGain.gain.value = 200
  lpfLfo.connect(lpfLfoGain)
  lpfLfoGain.connect(lpf.frequency)
  lpfLfo.start()

  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 260

  const hpfLfo = ctx.createOscillator()
  hpfLfo.type = 'sine'
  hpfLfo.frequency.value = 0.04
  const hpfLfoGain = ctx.createGain()
  hpfLfoGain.gain.value = 40
  hpfLfo.connect(hpfLfoGain)
  hpfLfoGain.connect(hpf.frequency)
  hpfLfo.start()

  const rumbleOut = ctx.createGain()

  tri.connect(noise)
  noise.connect(lpf)
  lpf.connect(hpf)
  hpf.connect(rumbleOut)
  
  tri.start()

  return rumbleOut
}

function createHarmony() {
  const tone = ctx.createOscillator()
  tone.type = 'sine'
  tone.frequency.value = 320 * 1

  const toneMod = ctx.createOscillator()
  toneMod.type = 'sine'
  toneMod.frequency.value = 30
  const toneModGain = ctx.createGain()
  toneModGain.gain.value = 2
  toneMod.connect(toneModGain)
  toneModGain.connect(tone.frequency)
  toneMod.start()

  const toneMajor = ctx.createOscillator()
  toneMajor.type = 'sine'
  toneMajor.frequency.value = 160 * 1.25

  const toneMajorMod = ctx.createOscillator()
  toneMajorMod.type = 'triangle'
  toneMajorMod.frequency.value = 40
  const toneMajorModGain = ctx.createGain()
  toneMajorModGain.gain.value = 100
  toneMajorMod.connect(toneMajorModGain)
  toneMajorModGain.connect(toneMajor.frequency)
  toneMajorMod.start()

  const bpf = ctx.createBiquadFilter()
  bpf.type = 'bandpass'
  bpf.Q.value = 0.4
  bpf.frequency.value = 1400

  const bpfLfo = ctx.createOscillator()
  bpfLfo.type = 'sine'
  bpfLfo.frequency.value = 0.1
  const bpfLfoGain = ctx.createGain()
  bpfLfoGain.gain.value = 400
  bpfLfo.connect(bpfLfoGain)
  bpfLfoGain.connect(bpf.frequency)
  bpfLfo.start()

  const toneGain = ctx.createGain()

  tone.connect(bpf)
  toneMajor.connect(bpf)
  bpf.connect(toneGain)

  tone.start()
  toneMajor.start()

  return toneGain
}

function createWind(lowCutFreq, highCutFreq, volumeLfo, pannerLfo) {
  const noise = createNoise(0.1)

  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = highCutFreq
  lpf.Q.value = 3

  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = lowCutFreq
  hpf.Q.value = 3

  const volume = ctx.createGain()
  const panner = ctx.createStereoPanner()
  const output = ctx.createGain()

  noise.connect(lpf)
  lpf.connect(hpf)
  hpf.connect(volume)
  volume.connect(panner)
  panner.connect(output)

  volumeLfo.connect(volume.gain)
  pannerLfo.connect(panner.pan)

  output.lpf = lpf
  output.hpf = hpf

  return output
}

function createRealisticWind(lowCutFreq, highCutFreq, volumeLfo, pannerLfo, maxDuration) {
  const wind = createWind(lowCutFreq, highCutFreq, volumeLfo, pannerLfo)
  wind.gain.value = 0.3

  windGain = createWindLfo(maxDuration)
  wind.connect(windGain)

  const output = ctx.createGain()
  windGain.connect(output)

  function updateHpf() {
    const gain = windGain.gain.value
    wind.hpf.frequency.value = highCutFreq + gain * (highCutFreq / 2)
    window.requestAnimationFrame(updateHpf)
  }

  updateHpf()

  return output
}

function createLfo(frequency, depth) {
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = frequency

  const lfoGain = ctx.createGain()
  lfoGain.gain.value = depth

  lfo.connect(lfoGain)
  lfo.start()

  return lfoGain
}

function createWindLfo(maxDuration) {
  const amp = ctx.createGain()

  let value = 0.01

  function updateRamps() {
    const duration = 1 + Math.random() * maxDuration
    value = value > 0.5 
      ? Math.random() * 0.15 
      :  0.85 + Math.random() * 0.15
    amp.gain.exponentialRampToValueAtTime(value, ctx.currentTime + duration)
    setTimeout(updateRamps, duration * 1000 + 20)
  }

  updateRamps()
  amp.gain.value = 0.01

  return amp
}

function createSynth() {
  const synth = new WebSynth(ctx)
  synth.vco1.set_glide_time(2)
  synth.vco1.wave = WAVE.TRI
  synth.vco1.oct = 0
  synth.vco2.set_glide_time(2)
  synth.vco2.wave = WAVE.TRI
  synth.vco2.fine = 0.03
  synth.vco2.gain = 0.05
  synth.eg.set_a(4)
  synth.eg.set_d(8)
  synth.eg.set_s(0.1)
  synth.eg.set_r(10)
  synth.delay.set(100)
  
  synth.playNote = function(note, duration = 200) {
    synth.play(note)
    setTimeout(() => synth.stop(), duration - 100)
  }

  return synth
}

function createPad(volumeLfo, lpfLfo) {
  const output = ctx.createGain()

  const synths = [0, 0, 0, 0].map(() => {
    const synth = createSynth()
    synth.vco1.set_glide_time(2)
    synth.vco1.wave = WAVE.TRI
    synth.vco1.oct = 3
    synth.vco2.set_glide_time(2)
    synth.vco2.wave = WAVE.TRI
    synth.vco2.oct = 2
    synth.vco2.fine = 0.03
    synth.vco2.gain = 0.05
    synth.eg.set_d(200)
    synth.eg.set_s(30)
    synth.delay.delayTime = 2
    synth.delay.set(100)

    return synth
  })

  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = 300
  lpf.Q.value = 3

  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 150
  hpf.Q.value = 3

  const gain = ctx.createGain()

  synths.forEach((synth, i) => {
    const panner = ctx.createStereoPanner()
    panner.pan.value = -0.8 + 1.6 * (i / (synths.length - 1))
    synth.volume.connect(panner)
    synth.delay.connect(panner)
    panner.connect(lpf)
  })

  output.playChord = function(notes, duration = 800) {
    notes.forEach((note, i) => synths[i].playNote(note, duration))
  }

  lpfLfo.connect(lpf.frequency)
  lpf.connect(hpf)
  hpf.connect(gain)
  gain.connect(output)

  volumeLfo.connect(gain.gain)

  output.lpf = lpf
  return output
}

function play(assets) {
  // const rumble = createRumble()
  // rumble.gain.value = 0.1

  // const harmony = createHarmony()
  // harmony.gain.value = 0.01
  // const harmonyReverb = ctx.createConvolver()
  // harmonyReverb.buffer = assets.reverb

  // const wind1 = createWind(1000, 1100, createLfo(0.02, 0.9), createLfo(0.05, 0.8))
  // wind1.gain.value = 0.014
  // const wind2 = createWind(400, 420, createLfo(0.031, 0.65), createLfo(0.02, 0.4))
  // wind2.gain.value = 0.01

  const exp = 1.2

  const realWind1 = createRealisticWind(20, 200, createLfo(0.047, 0.3), createLfo(0.3, 0.8), 4)
  realWind1.gain.value = 1 * exp
  const realWind2 = createRealisticWind(20, 300, createLfo(0.062, 0.8), createLfo(0.23, 0.8), 5)
  realWind2.gain.value = 0.75 * exp
  const realWind3 = createRealisticWind(20, 150, createLfo(0.0311, 0.2), createLfo(0.071, 0.6), 8)
  realWind3.gain.value = 3 * exp
  const realWind4 = createRealisticWind(20, 400, createLfo(0.0211, 0.7), createLfo(0.061, 0.6), 3)
  realWind4.gain.value = 0.8 * exp

  // const synth = createSynth()
  // const synthVolume = ctx.createGain()
  // synthVolume.gain.value = 0.02

  // const notes = [12, 14, 16, 19]
  // const durations = [200, 200, 200, 400, 400, 800, 1600]
  // let n = 0

  // function playNextNote(note, duration = 800) {
  //   synth.playNote(note, duration)

  //   setTimeout(() => {
  //     const nextNote = notes[randomInt(0, notes.length)]
  //     const octave = Math.floor(Math.random() * 3)
  //     playNextNote(nextNote + octave * 12)
  //   }, durations[randomInt(0, durations.length)])
  // }
  // playNextNote(notes[0])

  const pad = createPad(createLfo(5, 0.15), createLfo(0.06, 150))
  pad.gain.value = 0.05

  const chords = [
    [12, 16, 19, 21],
    [11, 18, 19, 21],
    [11, 16, 19],
    [9, 14, 18, 19],
  ].map(chord => chord.map(note => note + 12))
  let c = 0
  // function playNextChord(chord, duration = 6400) {
  //   pad.playChord(chord, duration)

  //   setTimeout(() => {
  //     const nextChord = chords[++c % chords.length]
  //     playNextChord(nextChord, duration)
  //   }, duration)
  // }
  // playNextChord(chords[0])

  on('windForce', force => {
    pad.lpf.frequency.value = 100 + ((1 + force.normalize().y) / 2) * 400
  })

  let lastSunY = 0
  on('sun.position.y', y => {
    console.log(y)

    if ((lastSunY < 0 && 0 < y) || (y < 0 && 0 < lastSunY)) {
      c++

      const chord = Math.random() < 0.7
        ? chords[c % chords.length]
        : chords[Math.floor(Math.random()) * chords.length]
      pad.playChord(chord, 3600)
    }

    lastSunY = y
  })

  // const synthVerb = ctx.createConvolver()
  // synthVerb.buffer = assets.reverb
  // const synthVerbDry = ctx.createGain()
  // synthVerbDry.gain.value = 0.7
  // const synthVerbWet = ctx.createGain()
  // synthVerbWet.gain.value = 0.3

  const masterNoise = createNoise(0.0005)

  const reverb = ctx.createConvolver()
  reverb.buffer = assets.reverb
  const reverbDry = ctx.createGain()
  reverbDry.gain.value = 0.25
  const reverbWet = ctx.createGain()
  reverbWet.gain.value = 1

  const master = ctx.createGain()
  master.gain.value = 0.8

  // rumble.connect(masterNoise)
  // harmony.connect(harmonyReverb)
  // harmonyReverb.connect(masterNoise)
  // wind1.connect(masterNoise)
  // wind2.connect(masterNoise)
  realWind1.connect(masterNoise)
  realWind2.connect(masterNoise)
  realWind3.connect(masterNoise)
  realWind4.connect(masterNoise)

  // synthVerb.connect(synthVerbWet)
  // synthVerbWet.connect(master)
  // synthVerbDry.connect(master)
  // synth.volume.connect(synthVolume)
  // synth.delay.connect(synthVolume)
  // synthVolume.connect(synthVerbDry)
  // synthVolume.connect(synthVerb)
  // pad.connect(synthVerbDry)
  // pad.connect(synthVerb)
  pad.connect(masterNoise)

  masterNoise.connect(reverbDry)
  masterNoise.connect(reverb)
  reverb.connect(reverbWet)
  reverbDry.connect(master)
  reverbWet.connect(master)
  master.connect(ctx.destination)
}

fetchAsAudioBuffer(ctx, 'reverb0_1-4-15000-1000.mp3').then(buffer => {
  play({ reverb: buffer })
})

/*
 * helpers
 */

function fetchAsArrayBuffer(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest()

    xhr.open("GET", url, true)
    xhr.responseType = "arraybuffer"

    xhr.onload = function() {
      if (xhr.response) {
        resolve(xhr.response)
      }
    }
    xhr.onerror = reject

    xhr.send()
  });
}

function decodeAudioData(audioContext, arrayBuffer) {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject)
  })
}

function fetchAsAudioBuffer(audioContext, url) {
  if (Array.isArray(url)) {
    return Promise.all(url.map((url) => {
      return fetchAsAudioBuffer(audioContext, url)
    }))
  }
  return fetchAsArrayBuffer(url).then((arrayBuffer) => {
    return decodeAudioData(audioContext, arrayBuffer)
  })
}

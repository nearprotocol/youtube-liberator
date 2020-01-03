'use strict'

/* eslint-env browser */

const Ipfs = window.Ipfs
const VideoStream = window.videostream

const log = console.log;

document.addEventListener('DOMContentLoaded', async () => {
  const ipfs = await Ipfs.create({
    repo: 'ipfs-' + Math.random()
  })
  document.ipfs = ipfs;
  await ipfs.swarm.connect("/ip4/104.248.180.57/tcp/4002/ws/ipfs/QmSttCRFW3ibTPBkbimmrfuy1M622qAZ7D1W1s7Wp66mLz");

  log('IPFS: Initialising')

  // Set up event listeners on the <video> element from index.html
  const videoElement = createVideoElement()
  const hashInput = document.getElementById('hash')
  const goButton = document.getElementById('gobutton')
  let stream

  goButton.onclick = function (event) {
    event.preventDefault()

    log(`IPFS: Playing ${hashInput.value.trim()}`)

    // Set up the video stream an attach it to our <video> element
    const videoStream = new VideoStream({
      createReadStream: function createReadStream (opts) {
        const start = opts.start

        // The videostream library does not always pass an end byte but when
        // it does, it wants bytes between start & end inclusive.
        // catReadableStream returns the bytes exclusive so increment the end
        // byte if it's been requested
        const end = opts.end ? start + opts.end + 1 : undefined

        log(`Stream: Asked for data starting at byte ${start} and ending at byte ${end}`)

        // If we've streamed before, clean up the existing stream
        if (stream && stream.destroy) {
          stream.destroy()
        }

        // This stream will contain the requested bytes
        stream = ipfs.catReadableStream(hashInput.value.trim(), {
          offset: start,
          length: end && end - start
        })

        // Log error messages
        stream.on('error', (error) => log(error))

        if (start === 0) {
          // Show the user some messages while we wait for the data stream to start
          statusMessages(stream, log)
        }

        return stream
      }
    }, videoElement)

    videoElement.addEventListener('error', () => log(videoStream.detailedError))
  }

  log('IPFS: Ready')
  log('IPFS: Then press the "Go!" button to start playing a video')

  hashInput.disabled = false
  goButton.disabled = false
})

const statusMessages = (stream) => {
  let time = 0
  const timeouts = [
    'Stream: Still loading data from IPFS...',
    'Stream: This can take a while depending on content availability',
    'Stream: Hopefully not long now',
    'Stream: *Whistles absentmindedly*',
    'Stream: *Taps foot*',
    'Stream: *Looks at watch*',
    'Stream: *Stares at floor*',
    'Stream: *Checks phone*',
    'Stream: *Stares at ceiling*',
    'Stream: Got anything nice planned for the weekend?'
  ].map(message => {
    time += 5000

    return setTimeout(() => {
      log(message)
    }, time)
  })

  stream.once('data', () => {
    log('Stream: Started receiving data')
    timeouts.forEach(clearTimeout)
  })
  stream.once('error', () => {
    timeouts.forEach(clearTimeout)
  })
}

const createVideoElement = () => {
  const videoElement = document.getElementById('video')
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play()
      .catch(log)
  })

  const events = [
    'playing',
    'waiting',
    'seeking',
    'seeked',
    'ended',
    'loadedmetadata',
    'loadeddata',
    'canplay',
    'canplaythrough',
    'durationchange',
    'play',
    'pause',
    'suspend',
    'emptied',
    'stalled',
    'error',
    'abort'
  ]
  events.forEach(event => {
    videoElement.addEventListener(event, () => {
      log(`Video: ${event}`)
    })
  })

  videoElement.addEventListener('error', () => {
    log(videoElement.error)
  })

  return videoElement
}

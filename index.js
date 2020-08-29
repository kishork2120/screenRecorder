const start = document.getElementById("start");
const stop = document.getElementById("stop");
const video = document.querySelector("video");
const download = document.getElementById('download');
let recorder, stream;

const mergeAudioStreams = (desktopStream, voiceStream) => {
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  let hasDesktop = false;
  let hasVoice = false;
  if (desktopStream && desktopStream.getAudioTracks().length > 0) {
    // If you don't want to share Audio from the desktop it should still work with just the voice.
    const source1 = context.createMediaStreamSource(desktopStream);
    const desktopGain = context.createGain();
    desktopGain.gain.value = 0.7;
    source1.connect(desktopGain).connect(destination);
    hasDesktop = true;
  }
  
  if (voiceStream && voiceStream.getAudioTracks().length > 0) {
    const source2 = context.createMediaStreamSource(voiceStream);
    const voiceGain = context.createGain();
    voiceGain.gain.value = 0.7;
    source2.connect(voiceGain).connect(destination);
    hasVoice = true;
  }
    
  return (hasDesktop || hasVoice) ? destination.stream.getAudioTracks() : [];
};

async function startRecording() {
  stream = await navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: "screen" },
    audio: true
  });
  voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
  const tracks = [
    ...stream.getVideoTracks(), 
    ...mergeAudioStreams(stream, voiceStream)
  ];
  stream = new MediaStream(tracks);
  recorder = new MediaRecorder(stream, {mimeType: 'video/webm; codecs=vp8,opus'});

  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = e => {
    const completeBlob = new Blob(chunks, { type: chunks[0].type });
    let url = URL.createObjectURL(completeBlob);
    video.src = url;
    download.href = url;
    download.download = 'test.webm';
    download.click();
  };

  recorder.start();
}

start.addEventListener("click", () => {
  start.setAttribute("disabled", true);
  stop.removeAttribute("disabled");

  startRecording();
});

stop.addEventListener("click", () => {
  stop.setAttribute("disabled", true);
  start.removeAttribute("disabled");

  recorder.stop();
  stream.getVideoTracks()[0].stop();
  stream.getAudioTracks()[0].stop();
});

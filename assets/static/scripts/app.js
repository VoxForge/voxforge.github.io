// testing with Chrome: requires https; can bypass this with:
// google-chrome --user-data-dir=~/temp --unsafely-treat-insecure-origin-as-secure="http://flask.voxforge1.org"
// need Google Chrome version > 58 for wavesurfer to work correctly


// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder
//navigator.getUserMedia = ( navigator.getUserMedia ||
//                       navigator.webkitGetUserMedia ||
//                       navigator.mozGetUserMedia ||
//                       navigator.msGetUserMedia);

// set up basic variables for app
var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var upload = document.querySelector('.upload');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

// recording thread
var worker = new Worker('/assets/static/scripts/EncoderWorker.js');
// zip and upload thread
var zip_worker = new Worker('/assets/static/scripts/ZipWorker.js');
// if page reloaded kill background worker threads before page reload
// to prevent zombie worker threads in FireFox
$( window ).unload(function() {
  worker.terminate();
  zip_worker.terminate();
});

var microphone = null;
var microphoneLevel = null;
var processor = undefined;  
var analyser = null;
var mediaStreamOutput = null;

var wavesurfer;

var timeout_obj;

// disable stop button while not recording

stop.disabled = true;
upload.disabled = true;

// visualiser setup - create web audio api context and canvas

var audioCtx = new (window.AudioContext || webkitAudioContext)();
//var canvasCtx = canvas.getContext("2d");
//var analyser = audioCtx.createAnalyser();

// #############################################################################
//main block for doing the audio recording

// See: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

var constraints = { audio: true };
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {

    // First get ahold of the legacy getUserMedia, if present
    //var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    var getUserMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
    // Some browsers just don't implement it - return a rejected promise with an error
    // to keep a consistent interface
    if (!getUserMedia) {
      console.log('getUserMedia not supported on your browser!');
      document.querySelector('.info-display').innerText = 
        'Your device does not support the HTML5 API needed to record audio';  
      document.querySelector('.prompt_id').innerText = "";
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}

console.log('getUserMedia supported.');

//   var constraints = { audio: true };
//  var onSuccess = function(stream) {
//    setupAudioNodes(stream);
//    record.onclick = function() { recordClicked() }
//    stop.onclick = function() { stopClicked()  }
//    upload.onclick = function() { saveRecordings() }
//  }
//  var onError = function(err) {
//    window.alert("Could not get audio input - reason: " + err);
//    console.log('The following error occured: ' + err);
//  }
//  navigator.getUserMedia( constraints, onSuccess, onError);

// see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    setupAudioNodes(stream);
    record.onclick = function() { recordClicked() }
    stop.onclick = function() { stopClicked()  }
    upload.onclick = function() { saveRecordings() }
  })
  .catch(function(err) {
    window.alert("Could not get audio input - reason: " + err);
    console.log('The following error occured: ' + err);
  });
//} else {
//  console.log('getUserMedia not supported on your browser!');
//  document.querySelector('.info-display').innerText = 
//	'Your device does not support the HTML5 API needed to record audio (this is a known problem on iOS)';  
//  document.querySelector('.prompt_id').innerText = "";
//}
/*
* AudioDestinationNode has no output (since it is the output, no more 
* AudioNodes can be linked after it in the audio graph) and one input
*/
function setupAudioNodes(stream) {
  microphone = audioCtx.createMediaStreamSource(stream);
  microphoneLevel = audioCtx.createGain();
  analyser = audioCtx.createAnalyser();
  processor = audioCtx.createScriptProcessor(undefined , 2, 2);
  //mediaStreamOutput = audioCtx.createMediaStreamDestination();
  mediaStreamOutput = audioCtx.destination;

  microphone.channelCount = 1;
  microphoneLevel.channelCount = 1;
  microphoneLevel.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.7);
  mediaStreamOutput.channelCount = 1;

  microphone.connect(microphoneLevel); 

  profile.sample_rate = audioCtx.sampleRate;
  profile.sample_rate_format = "32 bit float";
  profile.channels = mediaStreamOutput.channelCount;

  console.log('channels: ' + mediaStreamOutput.channelCount);
  console.log('audioCtx.sampleRate: ' + audioCtx.sampleRate);
  console.log('microphoneLevel.gain.value: ' + microphoneLevel.gain.value);
}

function getBuffers(event) {
  var buffers = [];
  for (var ch = 0; ch < 2; ++ch)
    buffers[ch] = event.inputBuffer.getChannelData(ch);
  return buffers;
}

//see https://github.com/higuma/wav-audio-encoder-js 
function recordClicked() {
  // hide profile info; otherwise recorded audio will not display properly 
  // at bottom of page
  $("#profile-display").hide();
  $("#profile-button-display").show();
  $("#directions-display").hide();
  $("#directions-button-display").show();
  $('.info-display').show();

  microphoneLevel.connect(analyser);
  microphoneLevel.connect(processor); 
  processor.connect(audioCtx.destination);

  visualize();

  processor.onaudioprocess = function(event) {
    worker.postMessage({ 
      command: 'record', 
      buffers: getBuffers(event) 
    });
  };

  startRecording();

  stop.disabled = false;
  record.disabled = true;
}

function stopClicked() {
  // delay stop of recording after user hits stop so they don't cut off
  // their speech too early
  setTimeout( function () {
    $('.info-display').hide();

    microphoneLevel.disconnect();
    processor.disconnect();
    worker.postMessage({ 
      command: 'finish'
    });

    record.style.background = "";
    record.style.color = ""; 
    stop.disabled = true;
    record.disabled = false;

    clearTimeout(timeout_obj);

    if ( prompts.maxPromptsReached() ) {
      // to give browser enough time to process the last audio recording
      setTimeout( function () {
        promptToSave();
        return;
      }, 300);
    }
  }, 400);
}

worker.onmessage = function(event) { 
  saveWorkerRecording(event.data.blob); 
}; // reply from worker after encoding completed

// run after worker completes encoding
function saveWorkerRecording(blob) {
  var prompt_sentence = document.querySelector('.info-display').innerText;
  var prompt_id = document.querySelector('.prompt_id').innerText;
  // prompt_sentence already has leading and trailing space???
  //var clipName = prompt_id + " " + prompt_sentence;
  var clipName = prompt_id + prompt_sentence;

  var clipContainer = document.createElement('article');
  var clipLabel = document.createElement('prompt');
  var audio = document.createElement('audio');
  // needs to be a div so that mouse controls work properly
  var waveform = document.createElement('div');
  var deleteButton = document.createElement('button');
 
  clipContainer.classList.add('clip');
  clipLabel.classList.add('clip-label');
  audio.setAttribute('controls', '');
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'delete';
  clipLabel.textContent = clipName;

  var waveform_display_id = "waveformContainer_" + prompt_id;
  waveform.setAttribute("id", waveform_display_id);
  waveform.setAttribute("style", 
      "border-style: solid; min-width:100px; ");

  var style = document.createElement('div');
  style.setAttribute("style", "text-align: center");

  var button_display_id = "button_" + prompt_id;
  var button = document.createElement(button_display_id);
  button.className = "btn btn-primary";
  button.textContent = 'Play';
  button.setAttribute("onclick", "wavesurfer.playPause()");
  var i = document.createElement('i');
  i.className = "glyphicon glyphicon-play";
  button.appendChild(i);

  style.appendChild(button);
  waveform.appendChild(style);

  clipContainer.appendChild(clipLabel);
  clipContainer.appendChild(deleteButton);
  clipContainer.appendChild(waveform);
  clipContainer.appendChild(audio);

  soundClips.insertBefore(clipContainer, soundClips.children[0]);

  audio.controls = true;

  var audioURL = window.URL.createObjectURL(blob);
  audio.src = audioURL;
  console.log(prompt_id + " recorder stopped; audio: " + audioURL);

  // see http://wavesurfer-js.org/docs/
  wavesurfer = WaveSurfer.create({
    container: '#' + waveform_display_id,
    scrollParent: true,
    waveColor : 'OliveDrab',
    minPxPerSec: 200
  });
  wavesurfer.load(audioURL);

  deleteButton.onclick = function(e) {
    evtTgt = e.target;
    evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    updateProgress();
  }
}

function updateProgress() {
  var progress = prompts.getProgressDescription();
  document.querySelector('.progress-display').innerText = progress;
}

function startRecording() {
  document.querySelector('.progress-display').innerText = "";
  document.querySelector('.info-display').innerText = "";
  document.querySelector('.prompt_id').innerText = "";

  var prompt = prompts.getNextPrompt();
  if (prompt === null) {
    promptToSave();
    return;
  }
  updateProgress();

  // delay display of prompt so user will not start speaking before recorder
  // starts 
  setTimeout( function() {
    document.querySelector('.prompt_id').innerText = prompts.getPromptId();
    document.querySelector('.info-display').innerText = prompts.getPromptSentence();
  }, 250);

  worker.postMessage({
    command: 'start',
    sampleRate: audioCtx.sampleRate,
    numChannels: 1
  });

  console.log('recording audioCtx.sampleRate: ' + audioCtx.sampleRate) + ' ***may be different...depends on your hardware';

  console.log( prompts.getPromptId() + " " +  prompts.getPromptSentence() );
  record.style.background = "";

  // stop recording after 15 seconds
  timeout_obj = setTimeout(endRecording, 15000);
}

function promptToSave() {
  if (confirm('Are you ready to upload your submission?\nIf not, press cancel now,' + 
	      ' and then press Upload once you are ready.')) {
    saveRecordings();
  }
  upload.disabled = false;
  console.log('===done promptToSave===');
}

function endRecording() {
  microphoneLevel.disconnect();
  processor.disconnect();
  worker.postMessage({ 
    command: 'finish' 
  });

  console.log("recorder stopped");
  record.style.background = "";
  record.style.color = "";
}

function saveRecordings() {
  var allClips = document.querySelectorAll('.clip');
  var clipIndex = 0;
  var audioArray = [];

  function audioArrayLoop() {
    var clip = allClips[clipIndex];
    clip.style.display = 'None';
    var audioBlobUrl = clip.querySelector('audio').src;
    var prompt = clip.querySelector('prompt').innerText;
    var prompt_id = prompt.split(/(\s+)/).shift();
    prompts.prompts_recorded[clipIndex] = prompt + '\n';

    // Ajax is asynchronous - once the request is sent script will 
    // continue executing without waiting for the response.
    var xhr = new XMLHttpRequest();
    // get blob from browser memory; 
    xhr.open('GET', audioBlobUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      if (this.status == 200) {
        var blob = this.response;
        // add current audio blob to zip file in browser memory
        //zip.file(prompt_id + '.wav', blob);
        audioArray.push ({
            filename: prompt_id + '.wav', 
            audioBlob: blob
        });
        clipIndex += 1;
        if (clipIndex < allClips.length) {
          audioArrayLoop();
        } else {
          // must be called here because ajax is asynchronous
          // Q1: why doesnt allDone get called many times as the call stack unrolls???
          // is it becuase status no longer 200???
          allDone(audioArray);
        }
      }
    };
    xhr.send();
    console.log('===done audioToArray===');
  }
  
  audioArrayLoop();
}

function allDone(audioArray) {
  zip_worker.onmessage = zipworkerDone;

  var readme_blob = new Blob(profile.toArray(), {type: "text/plain;charset=utf-8"});
  var prompts_blob = new Blob(prompts.toArray(), {type: "text/plain;charset=utf-8"});
  var profile_json_blob = new Blob([profile.toJsonString()], {type: "text/plain;charset=utf-8"});
  var prompts_json_blob = new Blob([prompts.toJsonString()], {type: "text/plain;charset=utf-8"});
  zip_worker.postMessage({
    command: 'zipAndUpload',
    username: profile.getUserName(),
    temp_submission_name: profile.getTempSubmissionName(),
    readme: readme_blob,
    prompts: prompts_blob,
    profile: profile_json_blob,
    prompts_json: prompts_json_blob,
    audio: audioArray,
  });

  function zipworkerDone(event) { 
    if (event.data.status === "transferComplete") {
      console.log('message from worker: Upload to VoxForge server completed');
    } else if (event.data.status === "savedInBrowserStorage") {
      console.log('message from worker: problem with Internet connection, submission saved in browser storage');
      alert("No Internet connection, submission saved in browser storage.  \nIt will be uploaded next time you make a submission when Internet is up.");
    } else if (event.data.status === "foundSavedFailedUploads") {
      console.log('message from worker: found submissions saved to browser, uploading them...');
    } else {
      console.log('message from worker: transfer error: ' + event.data.status);
    }

    // location.reload(true); 
  }; // reply from worker after encoding completed

  document.cookie = 'all_done=true; path=/';
  profile.addProfile2Cookie();
  upload.disabled = true;
  prompts.resetIndices();
  $( '.sound-clips' ).empty();
  console.log('===done allDone===');
}


//TODO 1. test ms edge offline save when no internet (on laptop?)
//2. re-test changes with Android 4.4.2


// #########################################################################

// copied from https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createAnalyser
function visualize() {
  var canvasCtx = canvas.getContext("2d");

  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  WIDTH = canvas.width
  HEIGHT = canvas.height;

  function draw() {

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
  }

  draw();
}


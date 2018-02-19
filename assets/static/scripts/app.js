/*
Many thanks to Peter Warden for the open-speech-recording app
(https://github.com/petewarden/open-speech-recording) that was used
as a starting point.

Copyright 2018 VoxForge

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
https://www.acunetix.com/websitesecurity/cross-site-scripting/
XSS - How Cross-site Scripting works
In order to run malicious JavaScript code in a victim’s browser, 
an attacker must first find a way to inject a payload into a web page that 
the victim visits. 
In order for an XSS attack to take place the vulnerable website needs 
to ***directly include user input in its pages***. An attacker can then 
insert a string that will be used within the web page and treated as
code by the victim’s browser.
This app does not display other users' input in its pages, so no XSS 
vulnerability...

TODO: CSRF - Cross site request forgery

// for testing with Chrome: requires https; can bypass this with:
// google-chrome --user-data-dir=~/temp --unsafely-treat-insecure-origin-as-secure="http://flask.voxforge1.org"
// need Google Chrome version > 58 for wavesurfer to work correctly
*/

// #############################################################################

/**
*  if page reloaded kill background worker threads before page reload
* to prevent zombie worker threads in FireFox
*/
$( window ).unload(function() {
  worker.terminate();
  zip_worker.terminate();
});

/**
* Global variable declaration
*/
var microphone = null;
var microphoneLevel = null;
var processor = undefined;  
var analyser = null;
var mediaStreamOutput = null;
var wavesurfer = [];
var clip_id = 0;
var timeout_obj;

// set up basic variables for app
var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
stop.disabled = true;
var upload = document.querySelector('.upload');
upload.disabled = true;
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

// recording Web Worker
var worker = new Worker('/assets/static/scripts/EncoderWorker.js');
// zip and upload thread
var zip_worker = new Worker('/assets/static/scripts/ZipWorker.js');

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var RECORDING_TIMEOUT = 15000; // 15 seconds

// #############################################################################
/* main block for doing the audio recording */

/**
* Older browsers might not implement mediaDevices at all, so we set an empty 
* object first
* see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*/
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

var constraints = { audio: true };
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {

    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
    // Some browsers just don't implement it - return a rejected promise with 
    // an error to keep a consistent interface
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

/**
* prompts the user for permission to use a media input which produces a 
* MediaStream with tracks containing the requested types of media - i.e. audio track
*
* see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*/
navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    console.log('getUserMedia supported.');
    setupAudioNodes(stream);
    record.onclick = function() { recordClicked() }
    stop.onclick = function() { stopClicked()  }
    upload.onclick = function() { saveRecordings() }
  })
  .catch(function(err) {
    window.alert("Could not get audio input - reason: " + err);
    console.log('The following error occured: ' + err);
  });

/**
* set up audio nodes that are connected together in a graph so that the 
* source microphone input can be captured, and volume node can be created 
* (currently not used), an analyzer to create visually display the amplitude
* of the captured audio, a processor to capture the raw audio, and 
* a destination audiocontext to capture audio
*/
function setupAudioNodes(stream) {
  microphone = audioCtx.createMediaStreamSource(stream);
  microphoneLevel = audioCtx.createGain();
  analyser = audioCtx.createAnalyser();
  processor = audioCtx.createScriptProcessor(undefined , 2, 2);
  mediaStreamOutput = audioCtx.destination;

  microphone.channelCount = 1;
  microphoneLevel.channelCount = 1;
  microphoneLevel.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.7);
  mediaStreamOutput.channelCount = 1;

  microphone.connect(microphoneLevel); 

  profile.sample_rate = audioCtx.sampleRate;
  // TODO need to validate this or at least get it from audio context somehow
  profile.sample_rate_format = "32 bit float";
  profile.channels = mediaStreamOutput.channelCount;

  console.log('channels: ' + mediaStreamOutput.channelCount);
  console.log('audioCtx.sampleRate: ' + audioCtx.sampleRate);
  console.log('microphoneLevel.gain.value: ' + microphoneLevel.gain.value);
}

/**
* captures audio buffer data from processor worker
*/
function getBuffers(event) {
  var buffers = [];
  for (var ch = 0; ch < 2; ++ch)
    buffers[ch] = event.inputBuffer.getChannelData(ch);
  return buffers;
}

/**
* user has clicked record... connect required audio nodes
*
//see https://github.com/higuma/wav-audio-encoder-js 
*/
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

/**
* update number of prompts recorded and total number of prompts to record
*/
function updateProgress() {
  var progress = prompts.getProgressDescription();
  document.querySelector('.progress-display').innerText = progress;
}

/**
* user has clicked record... tell worker to start recording audio 
*/
function startRecording() {
  document.querySelector('.progress-display').innerText = "";
  document.querySelector('.info-display').innerText = "";
  document.querySelector('.prompt_id').innerText = "";

  var prompt = prompts.getNextPrompt();
  if (prompt === null) {
    askToUploadSubmission();
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

  console.log('recording audioCtx.sampleRate: ' + audioCtx.sampleRate);

  console.log( prompts.getPromptId() + " " +  prompts.getPromptSentence() );
  record.style.background = "";

  // stop recording after 15 seconds
  timeout_obj = setTimeout(endRecording, RECORDING_TIMEOUT);
}

/**
* send message to worker to stop recording
* only executed if the user tries to record more than 15secs of audio
*/
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

/**
* after parent process sends a request to the work to 'finish' recording,
* worker sends the recorded data as an audio blob
*/
worker.onmessage = function(event) { 
  saveWorkerRecording(event.data.blob); 
}; 

/**
* run after worker completes audio recording; creates a waveform display of 
* recorded audio and displays text of associated prompt line.  User can
* then review and if needed delete an erroneous recording.
*/
//TODO user ability to re-record audio prompt
function saveWorkerRecording(blob) {
  var clipContainer = document.createElement('article');
  clipContainer.classList.add('clip');
  var prompt_id = document.querySelector('.prompt_id').innerText;

  /**
  * displays the speech recording's transcription
  */
  function createClipLabel() {
    var prompt_sentence = document.querySelector('.info-display').innerText;
    var clipLabel = document.createElement('prompt');
    clipLabel.classList.add('clip-label');
    clipLabel.textContent = prompt_id + prompt_sentence;
  
    return clipLabel;
  }

  /**
  * delete a recorded prompt; 
  * TODO: makes more sense to let the user re-record a prompt....
  */
  function createDeleteButton() {
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';

    deleteButton.onclick = function(e) {
      evtTgt = e.target;
      evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);

      updateProgress();

      var prompt_id = document.querySelector('.prompt_id').innerText;
      var prompt_sentence = document.querySelector('.info-display').innerText;
      prompts.deletePrompt(prompt_id, prompt_sentence);
      console.log("prompt deleted: " + prompt_id);
    }

    return deleteButton;
  }

  var audioURL = window.URL.createObjectURL(blob);
  /**
  * This creates an additional audio player that may not be really required given
  * that Wavesurfer now works correctly.  Still usefull to let user adjust volume
  */
  function createAudioPlayer() {
    var audioPlayer = document.createElement('audio');
    audioPlayer.setAttribute('controls', '');
    audioPlayer.controls = true;
    audioPlayer.src = audioURL;
    console.log(prompt_id + " recorder stopped; audio: " + audioURL);

    return audioPlayer;
  }

  /**
  * this just creates the container (i.e. element in the shadow DOM) to be used
  * by WaveSurfer to display the audio waveform; Wavesurfer needs the container 
  * to exist before being called, so this creates the it...
  */
  var waveform_display_id = "waveformContainer_" + prompt_id;
  function createWaveformElement() {
    var waveformElement = document.createElement('div');
    // hook for wavesurfer
    waveformElement.setAttribute("id", waveform_display_id);
    waveformElement.setAttribute("style", 
        "border-style: solid; min-width:100px; ");

    var style = document.createElement('div');
    style.setAttribute("style", "text-align: center");

    // playbutton inside wavesurfer display
    var button_display_id = "button_" + prompt_id;
    var button = document.createElement(button_display_id);
    button.className = "btn btn-primary";
    button.textContent = 'Play'; 
    button.setAttribute("onclick", "wavesurfer[" + clip_id + "].playPause()");
    var i = document.createElement('i');
    i.className = "glyphicon glyphicon-play";
    button.appendChild(i);

    style.appendChild(button);
    waveformElement.appendChild(style);

    console.log("clip_id: " + clip_id);

    return waveformElement;
  }

  clipContainer.appendChild(createClipLabel());
  clipContainer.appendChild(createDeleteButton());
  clipContainer.appendChild(createWaveformElement());
  clipContainer.appendChild(createAudioPlayer());

  soundClips.insertBefore(clipContainer, soundClips.children[0]);

  // add waveform to waveformElement
  // see http://wavesurfer-js.org/docs/
  wavesurfer[clip_id] = WaveSurfer.create({
    container: '#' + waveform_display_id,
    scrollParent: true,
    waveColor : 'OliveDrab',
    minPxPerSec: 200
  });
  wavesurfer[clip_id].load(audioURL);

  clip_id++;
}

/**
* display window to ask user if they want to upload their recordings to 
* VoxForge server
*/
function askToUploadSubmission() {
  if (confirm('Are you ready to upload your submission?\nIf not, press cancel now,' + 
	      ' and then press Upload once you are ready.')) {
    saveRecordings();
  }
  upload.disabled = false;
  console.log('===done askToUploadSubmission===');
}

/**
* user has clicked stop... disconnect recording audio nodes
*
* the actual stopping of recording is delayed because some users hit it early
* and cut off the end of their recording
*/
function stopClicked() {

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
        askToUploadSubmission();
        return;
      }, 300);
    }
  }, 400);
}

/**
* collect all recorded audio into an array (audioArray) then calls function 
* that calls web worker that actually creates the zip file for download
* to VoxForge server
*/
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
        audioArray.push ({
            filename: prompt_id + '.wav', 
            audioBlob: blob
        });
        clipIndex += 1;
        if (clipIndex < allClips.length) {
          audioArrayLoop();
        } else {
          // must be called here because ajax is asynchronous
          // Q1: why doesnt createZipFile get called many times as the call stack unrolls???
          // ... because status no longer status == 200???
          createZipFile(audioArray);
        }
      }
    };
    xhr.send();
    console.log('===done audioToArray===');
  }
  
  audioArrayLoop();
}

/**
* call web worker to create zip file and upload to VoxForge server
*/
function createZipFile(audioArray) {
  zip_worker.onmessage = zipworkerDone;

  var readme_blob = new Blob(profile.toArray(), {type: "text/plain;charset=utf-8"});
  var prompts_blob = new Blob(prompts.toArray(), {type: "text/plain;charset=utf-8"});
  var profile_json_blob = new Blob([profile.toJsonString()], {type: "text/plain;charset=utf-8"});
  var prompts_json_blob = new Blob([prompts.toJsonString()], {type: "text/plain;charset=utf-8"});
  zip_worker.postMessage({
    command: 'zipAndUpload',
    username: profile.getUserName(),
    language: page_language,
    temp_submission_name: profile.getTempSubmissionName(),
    readme_blob: readme_blob,
    prompts_blob: prompts_blob,
    profile_json_blob: profile_json_blob,
    prompts_json_blob: prompts_json_blob,
    audio: audioArray,
  });

  /** 
  * display upload to VoxForge server status to user
  */
  function showUploadStatus(message) {
    $('#upload_status_display').show();
    $('#upload_status_display').text(message);
    $('#upload_status_display').css({ 'color': 'green', 'font-size': '50%' });
    setTimeout( function () {
      //document.querySelector('.upload_status_display').innerText = "";
      $('#upload_status_display').hide();
      return;
    }, 3000);
  }

  /**
  * receives replies from work thread and displays status accordingly
  *
  * this is a worker callback inside the worker context
  */
  function zipworkerDone(event) { 
    if (event.data.status === "transferComplete") {
      console.log('message from worker: Upload to VoxForge server completed');
      showUploadStatus("Upload successfull!");
    } else if (event.data.status === "savedInBrowserStorage") {
      console.log('message from worker: problem with Internet connection, submission saved in browser storage');
      alert("No Internet connection, submission saved in browser storage.  \nIt will be uploaded next time you make a submission with Internet up.");
    } else if (event.data.status === "foundSavedFailedUploads") {
      console.log('message from worker: found submissions saved to browser, uploading them...');
      showUploadStatus("Found saved submission(s), uploading to VoxForge server.");
    } else {
      console.log('message from worker: transfer error: ' + event.data.status);
    }
  };

  document.cookie = 'all_done=true; path=/';
  profile.addProfile2LocalStorage();
  upload.disabled = true;
  prompts.resetIndices();
  $( '.sound-clips' ).empty();
  clip_id = 0;
  console.log('===done allDone===');
}

/**
* creates an audio analyzer so can display graph that approximates a vuew meter
* so that user knows that app can hear his voice.
* 
* see https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createAnalyser
*/
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


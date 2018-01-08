// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)

// navigator.getUserMedia shim
navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

// URL shim
window.URL = window.URL || window.webkitURL;

// audio context + .createScriptProcessor shim
var audioContext = new AudioContext;
if (audioContext.createScriptProcessor == null)
  audioContext.createScriptProcessor = audioContext.createJavaScriptNode;

// elements (jQuery objects)
var    $microphone = $('#microphone'),
    $microphoneLevel = $('#microphone-level'),
    $recording = $('#recording'),
    $timeDisplay = $('#time-display'),
    $record = $('#record'),
    $cancel = $('#cancel'),
    $dateTime = $('#date-time'),
    $recordingList = $('#recording-list');

// initialize input element states (required for reloading page on Firefox)
$microphone.attr('disabled', false);
$microphone[0].checked = false;
$microphoneLevel.attr('disabled', false);
$microphoneLevel[0].valueAsNumber = 0;

/*
master diagram
--------------
                               ---+--->(input)--->(processor)
                               ^                          |
              microphoneLevel  |                          v
(microphone)--------|>---------+                    (destination)
*/

var     microphone = undefined,     // obtained by user click
    microphoneLevel = audioContext.createGain(),
//    input = audioContext.createGain(),
    processor = undefined;      // created on recording
microphoneLevel.gain.value = .7;
//microphoneLevel.connect(input);

$microphoneLevel.on('input', function() {
  var level = $microphoneLevel[0].valueAsNumber / 100;
  microphoneLevel.gain.value = level * level;
});

// obtaining microphone input
$microphone.click(function() {
  if (microphone == null)
    navigator.getUserMedia(
        { audio: true },
        function(stream) {
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(microphoneLevel);
          $microphone.attr('disabled', true);
          $microphoneLevel.removeClass('hidden');
        },
        function(error) {
          $microphone[0].checked = false;
          window.alert("Could not get audio input.");
        }
      );
});

// save/delete recording
function saveRecording(blob) {
  var time = new Date(),
      url = URL.createObjectURL(blob),
      html = "<p recording='" + url + "'>" +
             "<audio controls src='" + url + "'></audio> " +
             time +
             " <a class='btn btn-default' href='" + url +
                  "' download='recording.wav'>" +
             "Save...</a> " +
             "<button class='btn btn-danger' recording='" +
                      url + "'>Delete</button>" +
             "</p>";
  $recordingList.prepend($(html));
}

$recordingList.on('click', 'button', function(event) {
  var url = $(event.target).attr('recording');
  $("p[recording='" + url + "']").remove();
  URL.revokeObjectURL(url);
});

// recording process
var worker = new Worker('static/scripts/EncoderWorker.js');

worker.onmessage = function(event) { saveRecording(event.data.blob); };

function getBuffers(event) {
  var buffers = [];
  for (var ch = 0; ch < 2; ++ch)
    buffers[ch] = event.inputBuffer.getChannelData(ch);
  return buffers;
}

function startRecordingProcess() {
  processor = audioContext.createScriptProcessor(undefined , 2, 2);
  microphoneLevel.connect(processor);
  processor.connect(audioContext.destination);

  worker.postMessage({
    command: 'start',
    sampleRate: audioContext.sampleRate,
    numChannels: 1
  });
  processor.onaudioprocess = function(event) {
    worker.postMessage({ command: 'record', buffers: getBuffers(event) });
  };
}

function stopRecordingProcess(finish) {
  microphoneLevel.disconnect();
  processor.disconnect();
  worker.postMessage({ command: finish ? 'finish' : 'cancel' });
}

// if page reloaded kill background worker thread
$( window ).unload(function() {
  worker.terminate();
});


// recording buttons interface
var startTime = null    // null indicates recording is stopped

function minSecStr(n) { return (n < 10 ? "0" : "") + n; }

function updateDateTime() {
  $dateTime.html((new Date).toString());
  if (startTime != null) {
    var sec = Math.floor((Date.now() - startTime) / 1000);
    $timeDisplay.html(minSecStr(sec / 60 | 0) + ":" + minSecStr(sec % 60));
  }
}

window.setInterval(updateDateTime, 200);

function disableControlsOnRecord(disabled) {
  if (microphone == null)
    $microphone.attr('disabled', disabled);
}

function startRecording() {
  startTime = Date.now();
  $recording.removeClass('hidden');
  $record.html('STOP');
  $cancel.removeClass('hidden');
  disableControlsOnRecord(true);
  startRecordingProcess();
}

function stopRecording(finish) {
  startTime = null;
  $timeDisplay.html('00:00');
  $recording.addClass('hidden');
  $record.html('RECORD');
  $cancel.addClass('hidden');
  disableControlsOnRecord(false);
  stopRecordingProcess(finish);
}

$record.click(function() {
  if (startTime != null)
    stopRecording(true);
  else
    startRecording();
});

$cancel.click(function() { 
  stopRecording(false); 
});

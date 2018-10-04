/**
* uses created an audio analyser so can display graph that approximates a view 
* meter so that user knows that app can hear his voice.
* 
* see https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatTimeDomainData
*/

function visualize(visualizer, analyser) {
  var canvasCtx = visualizer.getContext("2d");

  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  WIDTH = visualizer.width;
  HEIGHT = visualizer.height;
  // TODO do we need to limit the number of time visualize refreshes per second
  // so that it can run on Android processors without causing audio to drop?
  function draw() {

    // this is more efficient than calling with processor.onaudioprocess
    // and sending floatarray with each call...
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
 
      var v = dataArray[i] / 128.0; // uint8
      var y = v * HEIGHT/2; // uint8

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(visualizer.width, visualizer.height/2);
    canvasCtx.stroke();
  }

  draw();
}


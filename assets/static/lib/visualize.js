/**
* uses created an audio analyser so can display graph that approximates a view 
* meter so that user knows that app can hear his voice.
* 
* see https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatTimeDomainData
*/
//function visualize(view, analyser) {
function visualize(dataArray, bufferLength) {
  var canvasCtx = view.canvas.getContext("2d");

  //var bufferLength = analyser.frequencyBinCount;
  //var dataArray = new Uint8Array(bufferLength);
  var animationId;

  WIDTH = view.canvas.width
  HEIGHT = view.canvas.height;

  function draw() {

    //requestAnimationFrame(draw);

    //analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
 
      //var v = dataArray[i] / 128.0; // uint8
      //var y = v * HEIGHT/2; // uint8

      var v = dataArray[i] * 200.0; // 32bitfloat
      var y = HEIGHT/2 + v; // 32bitfloat
      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(view.canvas.width, view.canvas.height/2);
    canvasCtx.stroke();
  }

  //draw();
  // Register our draw function with requestAnimationFrame. 
  if (typeof animationId === 'undefined') {
    animationId = requestAnimationFrame(draw);
  }
}


/*
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


// if change here, remember to update index.php: $ALLOWEDURL & $UPLOADFOLDER
//var uploadURL = 'https://jekyll_voxforge.org/index.php'; // test
// Chrome does not like self signed certificates... need to test in prod...
// make sure you terminate old service workers: chrome://inspect/#service-workers
// then clear browser caches
// F12; Network>Disable Cache
// F12 Application>Service Workers>Update on reload
//In 'chrome://flags' set 'Allow invalid certificates from resources loaded from localhost'
// don't use Jekyll port number for testing...
//NOW IN voxforge_sw.js
//var uploadURL = 'https://jekyll_voxforge.org/index.php'; // chrome testing
//var uploadURL = 'https://upload.voxforge1.org'; // prod

// zip and upload Web Worker
var zip_worker = new Worker('/assets/static/scripts/ZipWorker.js');
var upload_worker = new Worker('/assets/static/scripts/UploadWorker.js');
/**
* if page reloaded kill background worker threads before page reload
* to prevent zombie worker threads in FireFox
*/
$( window ).unload(function() {
  zip_worker.terminate();
  upload_worker.terminate();
});

/**
* collect all recorded audio into an array (audioArray) then calls function 
* that calls web worker that actually creates the zip file for download
* to VoxForge server
*
* Notes:
* service workers: https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html
*/
function upload( when_audio_processing_completed_func ) {

    var allClips = document.querySelectorAll('.clip');
    var clipIndex = 0;
    var audioArray = [];

    /**
    * recursive function that loops over audio clips and asynchronously
    * loads them into audioArray.  This can cause some timing issues if
    * there are many audio files... therefore only reset user facing display
    * after all text and audio is sent to web worker for background processing
    *
    * uses xhr internally to collect read audio damples from shadow DOM
    */
    // TODO convert to promise syntax to make things clearer
    function audioArrayLoop() {
      var clip = allClips[clipIndex];
      clip.style.display = 'None';
      var audioBlobUrl = clip.querySelector('audio').src;
      var prompt = clip.querySelector('prompt').innerText;
      var prompt_id = prompt.split(/(\s+)/).shift();
      //prompts.prompts_recorded[clipIndex] = prompt + '\n';
      prompts.prompts_recorded.push(prompt + '\n');

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

            callWorker2createZipFile(audioArray);

          }
        }
      };
      xhr.send();
    }

    /**
    * call web worker to create zip file and upload to VoxForge server
    */
    function callWorker2createZipFile(audioArray) {
      // need to copy to blobs here (rather than in web worker) because if pass 
      // them as references to ZipWorker, they will be overwritten when page refreshes
      // and not be accessible withing web worker
      zip_worker.postMessage({
        command: 'zipAndSave',

        speechSubmissionAppVersion: SPEECHSUBMISSIONAPPVERSION,
        username: profile.getUserName(),
        language: page_language,
        temp_submission_name: profile.getTempSubmissionName(),

        readme_blob: new Blob(profile.toArray(), {type: "text/plain;charset=utf-8"}),
        prompts_blob: new Blob(prompts.toArray(), {type: "text/plain;charset=utf-8"}),
        license_blob: new Blob(profile.licensetoArray(), {type: "text/plain;charset=utf-8"}),
        profile_json_blob: new Blob([profile.toJsonString()], {type: "text/plain;charset=utf-8"}),
        prompts_json_blob: new Blob([prompts.toJsonString()], {type: "text/plain;charset=utf-8"}),
        audio: audioArray,
      });

      /**
      * receives replies from work thread and displays status accordingly
      *
      * this is a worker callback inside the worker context
      */
      zip_worker.onmessage = function zipworkerDone(event) { 
        if (event.data.status === "savedInBrowserStorage") {
          console.info('message from worker: zip file creation completed');
          // FireFox: TypeError: swRegistration.sync is undefine
          // sync is not supported in FireFox  WTF!!!
          // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/sync
          // see: https://wicg.github.io/BackgroundSync/spec/#sync-manager-interface
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1217544 - planned for FFv61

          navigator.serviceWorker.ready.then(function(swRegistration) {
            if (typeof swRegistration.sync !== 'undefined') {

              // request a one-off sync to upload the saved submission
              // will upload if there is connectivity, if there is none, will
              // keep on trying to upload until connectivity is made
              // and then will delete saved submission from browser storage

              // Second call to sync takes longer than you think, but it will work
              // eventually... service worker seems to collect up all the calls to
              // service worker and does uploads consecutively
              // wait about 1-2 minutes
              return swRegistration.sync.register('myFirstSync').then(function() {
                console.info('service worker sync succeeded - submission will be uploaded shortly');
               }, function() {
                console.error('service worker sync failed, will retry later');
              });

            } else {

              console.warn('Browser does not support background sync using service workers, trying web worker');
              webWorkerUpload();

            }
          });
          console.info('set myFirstSync event to tell service worker to upload');
        } else {
          console.error('message from worker: transfer error: ' + event.data.status);
        }
      };

      when_audio_processing_completed_func();
    }

    /** 
    * display upload progress in console for debugging
    */
    function updateProgress (evt) {
      if (evt.lengthComputable) {
        var percentComplete = (evt.loaded / evt.total) * 100;
        console.info('percentComplete %', Math.round(percentComplete) );
      } else {
        console.warn('percentComplete - Unable to compute progress information since the total size is unknown');
      }
    }

    /** 
    * use web worker rather than service worker for upload to voxforge server
    */
    function webWorkerUpload() {
        upload_worker.postMessage({
          command: 'upload',
        });

        upload_worker.onmessage = function webWorkerUploadDone(event) { 
          if (event.data.status === "OK") {
            console.info('message from upload web worker: submission uploaded to server');
          } else {
            console.error('message from upload web worker: transfer error: ' + event.data.status);
          }
        };
    }

    audioArrayLoop();
}




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

/*
* Chrome and self signed certificates... need to make sure you install rootCA
* in Chrome certificate store...

* make sure you terminate old service workers: chrome://inspect/#service-workers
* then clear browser caches
* F12; Network>Disable Cache
* F12 Application>Service Workers>Update on reload

* In 'chrome://flags' set 'Allow invalid certificates from resources loaded from localhost' ... does not work
* need to install rootCA in browser...
*/


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
        short_submission_name: profile.getShortSubmissionName(),

        readme_blob: new Blob(profile.toArray(), {type: "text/plain;charset=utf-8"}),
        prompts_blob: new Blob(prompts.toArray(), {type: "text/plain;charset=utf-8"}),
        license_blob: new Blob(profile.licensetoArray(), {type: "text/plain;charset=utf-8"}),
        profile_json_blob: new Blob([profile.toJsonString()], {type: "text/plain;charset=utf-8"}),
        prompts_json_blob: new Blob([prompts.toJsonString()], {type: "text/plain;charset=utf-8"}),
        audio: audioArray,
      });

      /**
      * receives replies from worker thread and displays status accordingly
      * this is a worker callback inside the worker context
      */
      zip_worker.onmessage = function zipworkerDone(event) { 
        if (event.data.status === "savedInBrowserStorage") {
          console.info('message from worker: savedInBrowserStorage (zip file creation and save completed)');

          uploadZippedSubmission();
        } else {
          console.error('message from worker: transfer error: ' + event.data.status);
        }
      };

      // wait until zip_worker postMesasge completed before resetting everything
      when_audio_processing_completed_func(); 
    }


    /**
    *
    * for testing CORS make sure you have rootCA cert installed
    * on browser to be tested (Linux, Android, Unix...)
    * otherwise operation will fail silently

    * FireFox: TypeError: swRegistration.sync is undefined
    * background sync is not supported in FireFox
    * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/sync
    * see: https://wicg.github.io/BackgroundSync/spec/#sync-manager-interface
    * https://bugzilla.mozilla.org/show_bug.cgi?id=1217544 - planned for FFv61
    *
    * - Chrome on Linux and Windows 10 supports service workers for fetching
    * and background sync; 
    * - Chrome on Android 5 - works with service workers
    * - Chrome on Android 4.4.2 - needs valid root certificate installed
    * in browser for local testing; but in prod, where we are using
    * cors where each domain has different ssl certificate; only web
    * worker seems to work, service worker fails silently...
    * - Firefox on Linux & Windows 10 supports service workers for fetching 
    * but not background sync, therefore use Web Worker for uploads; 
    * FireFox works on Andoid 4.4.2 - now needs a root certificate
    * see: https://wiki.mozilla.org/CA:AddRootToFirefox
    *
    * - Edge on Windows 10 does not support service workers at all... try
    * Web Workers... but edge does not support InnoDB... Localforage 
    * was supposed to work around this issue.... so no support for
    * Edge for now...
    */

    /** 
    * worker Processing - depending on browser support, use background sync and 
    * a service worker to upload submission, use a web worker that uploads in 
    * background; or perform a synchronous upload neither is supported

    * service worker - background sync (e.g. current Chrome on Linux/Win10/Android 5 and up)
    * swRegistration.sync.register: requests a one-off sync to upload the saved 
    * submission.  It will upload if there is connectivity, if there is none, 
    * it will keep on trying to upload until connectivity is made
    * and then will delete saved submission from browser storage

    * Second call to sync takes longer than you think, but it will work
    * eventually... service worker seems to collect up all the calls to
    * service worker and does uploads consecutively
    * wait about 1-2 minutes
    *
    * web worker - background upload  (e.g. current Firefox on Linux/Win10/Android 4.4.2 and up)
    * some browsers implement service workers for caching files but not 
    * background sync... therefore use Web Worker to upload submission and 
    * upload any previously saved submissions (in browser storage)
    */

        // Chrome Android 4.4.2 fails silently when using service worker...
        // force use of webworker for background upload
/**
1) from jekyll_voxforge.org with upload to: jekyll_voxforge.org
1.1.1) so when using Chrome Android 4.4.2 with only a public certicate and no 
corresponding root certificate stored on Android (Security>Credential Storage>Trusted Credentials
get following browser error when trying to run service worker:
    An SSL certificate error occurred when fetching the script.
    Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID /voxforge_sw.js 
    ServiceWorker registration failed:  DOMException: Failed to register 
    a ServiceWorker: An SSL certificate error occurred when fetching the script. app.js:299 
1.1.2) works OK with WebWorker
1.2) Chrome Android 4.4.2 with rootCA installed on browser and service worker
works!

2.1) try on voxforge.github.io, service worker does not work, get:
    Uncaught (in promise) Request failed voxforge_sw.js:1

2.3) need to try with webworker....

2.2) try with asyncMainThreadUpload, get error:
    POST https://upload.voxforge1.org/ net::ERR_CERT_AUTHORITY_INVALID  processSavedSubmissions.js:76

- try with rootCA installed on browser and web worker
- try with no rootCA and web worker

- then try CORS (from jekyll_voxforge.org with upload to: jekyll2_voxforge.org)
for all of these...

More testing:
first error:
An SSL certificate error occurred when fetching the script.
Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID /voxforge_sw.js 

added header to index.php:
header("Service-Worker-Allowed: /"); # allow service worker to root context

now error is: 
An SSL certificate error occurred when fetching the script.
app.js:299 ServiceWorker registration failed:  
DOMException: Failed to register a ServiceWorker: 
An SSL certificate error occurred when fetching the script.

on Chrome Android 4.4.2 https://upload.voxforge1.org/en/read/
certificate is shown as invalid

on Chrome LInux https://upload.voxforge1.org/en/read/
certificate is shown as *valid*

!!!!!!!!!!!!!!!!!!!!! app and php need to be on same domain.... might work with 
same subdomains...
*/
    function uploadZippedSubmission() {
      if (platform.os.family === "Android" && platform.name === "Chrome Mobile" &&
          parseInt(platform.os.version) < 5)
      {

          // Android 4.4.2 Chrome implementation of background sync with service
          // workers does not like the voxforge1.org SSL certificate
          // and background sync will not work with service workers, but it still 
          // tries to perform background syncand returns an error:
                // An SSL certificate error occurred when fetching the script.
                // app.js:299 ServiceWorker registration failed:  
                // DOMException: Failed to register a ServiceWorker: 
                // An SSL certificate error occurred when fetching the script.
          // therefore to override this behaviour, tried web worker:
          // get an net::ERR_CERT_AUTHORITY_INVALID error
          // Therefore upload from main thread using async call
    
           asyncMainThreadUpload(); // still need web workers to perform the zip,and recroding...
      } else {
            if (typeof navigator.serviceWorker !== 'undefined') { 
                navigator.serviceWorker.ready.then(function(swRegistration) { // service workers supported
                  if (typeof swRegistration.sync !== 'undefined') { 
                    serviceWorkerUpload(swRegistration); // background sync supported
                  } else { 
                    webWorkerUpload(); // background sync not supported
                  }
                });
            } else { // service workers not supported
              if( !! window.Worker ) { // web workers supported
                  webWorkerUpload();
              } else {
                  asyncMainThreadUpload();
              }

            }
      }
    }

    /** 
    * upload submission from main thread, asynchronously...
    */
    function asyncMainThreadUpload() {
      // TODO make sure not deadlock with service/web workers...
      // TODO: should try web workers first...
      console.info('submission uploaded (in main thread) asynchronously to VoxForge server');


      processSavedSubmissions()
      .then(function(result) {
        console.info('async upload message: ' + result);
      })
      .catch(function(err) {
        console.error('async upload message: ' + err);
      });
    }

    /** 
    * send message to service worker to start submission upload.
    * will continue to try to upload even if no Internet, until connection
    * restablished, and if successful, remove uploaded submission from
    * browser storage
    */
    function serviceWorkerUpload(swRegistration) {
      swRegistration.sync.register('voxforgeSync').then(function() {
        console.info('service worker background sync event called - submission will be uploaded shortly');
       }, function() {
        console.error('service worker background sync failed, will retry later');
      });
    }

    /** 
    * send message to web worker to upload submission.  If fails, submission
    * stays in InnoDB until next time user makes submission, and then new
    * submission and any saved submissions will be uploaded, and removed
    * from browser storage after successful upload
    */
    function webWorkerUpload() {
        console.warn('Browser service worker does not support background sync... using web worker');

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

    audioArrayLoop();
}




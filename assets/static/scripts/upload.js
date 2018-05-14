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


/**
* use service worker to perform background sync to upload submissions
* to server (if browser supports it: Chrome:yes, Firefox:no), and to 
* cache all javascript files so app can be run offline

pass parameters to service worker:
http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.WvXYnWCEeis
*/
if ('serviceWorker' in navigator) {
// https://github.com/GoogleChromeLabs/sw-precache/issues/104
// https://github.com/GoogleChromeLabs/sw-precache/blob/master/demo/app/js/service-worker-registration.js#L25

  window.addEventListener('load', function() {
    const swUrl = '/voxforge_sw.js?uploadURL=' + encodeURIComponent(uploadURL);
    //navigator.serviceWorker.register('/voxforge_sw.js')
    navigator.serviceWorker.register(swUrl)
    .then(function(reg) {
      console.log('ServiceWorker registration successful with scope: ', reg.scope);
    }, function(err) {
      console.warn('ServiceWorker registration failed: ', err);
      window.alert('Error: no SSL certificate installed on device - VoxForge uploads will fail silently');
    })
  });
}



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

    processAudio()
    .then(callWorker2createZipFile)
    .then(uploadZippedSubmission);

    // ### inner functions #################################################

    /**
    * recursive function that loops over audio clips and asynchronously
    * loads them into audioArray.  This can cause some timing issues if
    * there are many audio files... therefore only reset user facing display
    * after all text and audio is sent to web worker for background processing
    *
    * uses xhr internally to collect read audio samples from shadow DOM
    */
    function processAudio() {
      return new Promise(function (resolve, reject) {

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

                //callWorker2createZipFile(audioArray);
                resolve(audioArray); // audioArray passed as parameter to next function in call chain
              }
            }
          };
          xhr.onerror = function() {
            reject("error processing audio from DOM");
          };
          xhr.send();
        } // audioArrayLoop

        audioArrayLoop();

      }); // Promise
    };// processAudio
    /**
    * call web worker to create zip file and upload to VoxForge server
    */
    function callWorker2createZipFile(audioArray) {
      return new Promise(function (resolve, reject) {

        // need to copy to blobs here (rather than in web worker) because if pass 
        // them as references to ZipWorker, they will be overwritten when page refreshes
        // and not be accessible withing web worker
        zip_worker.postMessage({
          command: 'zipAndSave',

          speechSubmissionAppVersion: SPEECHSUBMISSIONAPPVERSION,
          temp_submission_name: profile.getTempSubmissionName(),
          short_submission_name: profile.getShortSubmissionName(),
          username: profile.getUserName(),
          language: page_language,
          suffix: profile.getSuffix(),

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
            console.info('webworker says: savedInBrowserStorage (zip file creation and save completed)');

            //uploadZippedSubmission();
            resolve('OK');
          } else {
            var m = 'webworker says: zip error: ' + event.data.status;
            console.error(m);
            reject(m);
          }
        };

        // wait until zip_worker postMesasge completed before resetting everything
        when_audio_processing_completed_func(); 

      }); // Promise
    } // callWorker2createZipFile

    /**
    * for testing CORS make sure you have rootCA cert installed
    * on browser to be tested (Linux, Android, Unix...)
    * otherwise operation will fail (silently on Android...)

    * FireFox: TypeError: swRegistration.sync is undefined
    * background sync is not supported in FireFox
    * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/sync
    * see: https://wicg.github.io/BackgroundSync/spec/#sync-manager-interface
    * https://bugzilla.mozilla.org/show_bug.cgi?id=1217544 - planned for FFv61
    *
    * - Chrome on Linux and Windows 10 supports service workers for fetching
    * and background sync; 
    * - Chrome on Android >5 - works with service workers
    * - Chrome on Android 4.4.2 - move to canadian hoster has SSL certificate 
    * that now works with 4.4.2....
    * - Firefox on Linux & Windows 10 supports service workers for fetching 
    * but not background sync, therefore use Web Worker for uploads; 
    * FireFox works on Andoid 4.4.2 - now needs a root certificate
    * see: https://wiki.mozilla.org/CA:AddRootToFirefox
    *
    * - Edge on Windows 10 does not support service workers at all... try
    * Web Workers... 
    * TODO Edge does not support FormData... create alternate form (again...) to 
    * support Edge.  no support for Edge for now...
    */

    /** 
    * worker Processing - depending on browser support, use service worker and 
    * background sync to upload submission, if not available, use a web
    * worker that uploads in background; or 
    * TODO perform a synchronous upload
    * if neither is supported... which makes no sense since using web workers
    * to record and zip submission....
    *
    * service worker - background sync (e.g. current Chrome on Linux/Win10/Android 5 and up)
    * swRegistration.sync.register: requests a one-off sync to upload the saved 
    * submission.  It will upload if there is connectivity, if there is none, 
    * it will keep on trying to upload until connectivity is made
    * and then will delete saved submission from browser storage
    *
    * web worker - background upload  (e.g. current Firefox on Linux/Win10/Android 4.4.2 and up)
    * some browsers implement service workers for caching files but not 
    * background sync (e.g. Firefox), therefore use Web Worker to upload 
    * submission and upload any previously saved submissions (in browser 
    * storage)
    */
    function uploadZippedSubmission() {
        if (typeof navigator.serviceWorker !== 'undefined') { 
            navigator.serviceWorker.ready
            .then(function(swRegistration) { // service workers supported
              if (typeof swRegistration.sync !== 'undefined') { 
                serviceWorkerUpload(swRegistration);  // background sync supported
              } else { 
                console.warn('service worker does not support background sync... using web worker');
                webWorkerUpload(); // background sync not supported
              }
            });
        } else { // service workers not supported
          if( !! window.Worker ) { // web workers supported
              webWorkerUpload();
          } else { // should never get here...
              asyncMainThreadUpload();
          }
        }

        // ### inner functions #################################################
        /** 
        * upload submission from main thread, asynchronously...
        * TODO is this even required anymore???
        * might be useful to allow user to upload manually...
        */
        function asyncMainThreadUpload() {
          // TODO make sure not deadlock with service/web workers...
          // TODO: should try web workers first...
          // TODO localize in Read.md page...
          console.info('submission uploaded (in main thread) asynchronously to VoxForge server');

          processSavedSubmissions()
          .then(function(result) {
            console.info('async upload message: ' + result);
            window.alert( "the following submissions were successfully uploaded " +
                          "using async procedure: " + result );   
          })
          .catch(function(err) {
            console.error('async upload message: ' + err);
          });
        }

        /** 
        * send message to service worker to start submission upload.
        *
        * supposed continue to try to upload even if no Internet, until connection
        * restablished, and if successful, remove uploaded submission from
        * browser storage, but this does not seem to work in Windows, Linux, 
        * just Android
        */
        function serviceWorkerUpload(swRegistration) {
          // for processing of return values from service worker, see 
          // service worker event above (i.e. navigator.serviceWorker.addEventListener... )
          swRegistration.sync.register('voxforgeSync')
          .then(function() {
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
            upload_worker.postMessage({
              command: 'upload',
              uploadURL: uploadURL,
            });

            upload_worker.onmessage = function webWorkerUploadDone(event) { 
              var returnObj = event.data;
              console.log("*** webworker says: " + returnObj.status);

              processWorkerEventMessage(page_alert_message.webworker, returnObj);
            };
        }

    } // uploadZippedSubmission
}

/** 
* Listen for return messages from service worker
*
// http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.Wsz7C-yEdNA
// https://github.com/jbmoelker/serviceworker-introduction/issues/1
// https://miguelmota.com/blog/getting-started-with-service-workers/
// when debugging, need to wait for service worker to trigger - 1-2 minutes
// create breakpoints in voxforge_sw.js to know when this occurs...
// Handler for messages coming from the service worker
*/
navigator.serviceWorker.addEventListener('message', function(event){
  var returnObj = event.data;
  console.log("serviceworker says: " + returnObj.status);

  processWorkerEventMessage(page_alert_message.serviceworker, returnObj);
});

/** 
* process messages from service worker or web worker
*/
function processWorkerEventMessage(workertype, returnObj) {
    switch (returnObj.status) {
      case 'AllUploaded':
        var filesUploaded = returnObj.filesUploaded;
        var submissionText = (filesUploaded.length > 1 ? page_alert_message.submission_plural : page_alert_message.submission_singular);
        var m = filesUploaded.length + " " + 
                submissionText + " " +
                page_alert_message.uploaded_message  + "\n    " +
                filesUploaded.join("\n    ");
        console.info(workertype + ": " + m);
        window.alert(m);
        break;

      case 'noneUploaded': // files saved to browser storage
        var filesNotUploaded =  returnObj.filesNotUploaded;
        var submissionText = (filesNotUploaded.length > 1 ? page_alert_message.submission_plural : page_alert_message.submission_singular);
        var m = page_alert_message.localstorage_message + "\n" +
              page_alert_message.browsercontains_message.trim() + " " + // remove newline
              filesNotUploaded.length + " " + 
              submissionText + ":\n    " + 
              filesNotUploaded.join("\n    "); 
        if (returnObj.err) {
            m = m + "\n========================\n";
            m = m + "\n\nserver error message: " + returnObj.err;
        }

        console.info(workertype + ": " + m);
        window.alert(m);
        break;

      case 'partialUpload':
        var filesNotUploaded = returnObj.filesNotUploaded;
        var filesUploaded = returnObj.filesUploaded;
        var savedText = (filesNotUploaded.length > 1 ? page_alert_message.submission_plural : page_alert_message.submission_singular);
        var uploadedText = (filesNotUploaded.length > 1 ? page_alert_message.submission_plural : page_alert_message.submission_singular);

        var m = "Partial Upload:\n\n" +
              filesUploaded.length + " " + 
              savedText + " " +
              page_alert_message.uploaded_message + 
              "    " + filesUploaded.join("\n    ") +
              "\n========================\n" +
              page_alert_message.browsercontains_message.trim() + " " + // removes newline
              filesNotUploaded.length + " " + 
              uploadedText + ":\n" + 
              "    " + filesNotUploaded.join("\n    ");
        if (returnObj.err) {
            m = m + "\n========================\n";
            m = m + "\n\nserver error message: " + returnObj.err;
        }

        console.info(workertype + ": " + m);
        window.alert(m);
        break;

      default:
        console.error('message from upload worker: transfer error: ' +
                      returnObj.status + " " + returnObj.message);
  }
}


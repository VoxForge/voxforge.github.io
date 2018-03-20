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
// Chrome does like self signed certificates... need to test in prod...
// make sure you terminate old service workers: chrome://inspect/#service-workers
// then clear browser caches
// F12; Network>Disable Cache
//In 'chrome://flags' set 'Allow invalid certificates from resources loaded from localhost'
// don't use Jekyll port number for testing...
var uploadURL = 'https://127.0.0.1/index.php'; // chrome testing
//var uploadURL = 'https://upload.voxforge1.org'; // prod

// zip and upload Web Worker
var zip_worker = new Worker('/assets/static/scripts/ZipWorker.js');

/**
* if page reloaded kill background worker threads before page reload
* to prevent zombie worker threads in FireFox
*/
$( window ).unload(function() {
  zip_worker.terminate();
});

/**
* collect all recorded audio into an array (audioArray) then calls function 
* that calls web worker that actually creates the zip file for download
* to VoxForge server
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
    */
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

            createZipFile(audioArray);

          }
        }
      };
      xhr.send();
    }




    /**
    * call web worker to create zip file and upload to VoxForge server
    */
    function createZipFile(audioArray) {
      // need to copy to blobs here (rather than web worker) because if pass 
      // them as-is to ZipWorker, they will be overwritten when page refreshes
      // and not be accessible withing web worker
      var username = profile.getUserName();
      var language = page_language;

      var readme_blob = new Blob(profile.toArray(), {type: "text/plain;charset=utf-8"});
      var prompts_blob = new Blob(prompts.toArray(), {type: "text/plain;charset=utf-8"});
      var license_blob = new Blob(profile.licensetoArray(), {type: "text/plain;charset=utf-8"});
      var profile_json_blob = new Blob([profile.toJsonString()], {type: "text/plain;charset=utf-8"});
      var prompts_json_blob = new Blob([prompts.toJsonString()], {type: "text/plain;charset=utf-8"});
      zip_worker.postMessage({
        command: 'zip',
        readme_blob: readme_blob,
        prompts_blob: prompts_blob,
        license_blob: license_blob,
        profile_json_blob: profile_json_blob,
        prompts_json_blob: prompts_json_blob,
        audio: audioArray,
      });

      /**
      * receives replies from work thread and displays status accordingly
      *
      * this is a worker callback inside the worker context
      */
      zip_worker.onmessage = function zipworkerDone(event) { 
        if (event.data.status === "zipFileCreationComplete") {
          console.info('message from worker: Upload to VoxForge server completed');
          uploadZipFile(uploadURL, language, username, event.data.zip_file_in_memory).then(function(response) {
              console.log("Success!", response);
            }, function(error) {
              console.error("Failed!", error);
            })
        } else {
          console.error('message from worker: transfer error: ' + event.data.status);
        }
      };

      when_audio_processing_completed_func();
    }

    /**
    * service worker to actually upload the zip file to voxforge servers...
    */
    function uploadZipFile(URL, language, username, zip_file_in_memory) {
      return new Promise(function(resolve, reject) {

        xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", updateProgress);

        xhr.responseType = 'text';
        xhr.onload = function () {
            if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                // to catch configuration errors on server side
                if (xhr.responseText == "submission uploaded successfully." ) {
                  transferSuccessful();
                  resolve("OK");
                }
            } else {
              reject(Error(xhr.statusText));
            }
        };

        xhr.upload.addEventListener("error", function(event) {
          reject(Error("Network Error"));
        });

        //xhr.upload.addEventListener("abort", transferCancelled);
        xhr.upload.addEventListener("abort", function(event) {
          reject(Error("connection aborted"));
        });

        xhr.open('POST', URL, true); // async

        var form = new FormData();
        form.append('file', zip_file_in_memory, "webworker_file.zip");
        form.append('language', language);
        form.append('username', username);

        xhr.send(form);
      });
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
    * zip file uploaded to voxforge server
    */
    function transferSuccessful() {
      console.log('transferSuccessful');
      view.showUploadStatus("Upload successfull!");
    }


    audioArrayLoop();
}





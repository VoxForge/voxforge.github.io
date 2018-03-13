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
function upload() {

    var allClips = document.querySelectorAll('.clip');
    var clipIndex = 0;
    var audioArray = [];

    /**
    * recursive function that loops over audio clips
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
        speechSubmissionAppVersion: SPEECHSUBMISSIONAPPVERSION,
      });

      // TODO create anonymous class
      zip_worker.onmessage = zipworkerDone;
      /**
      * receives replies from work thread and displays status accordingly
      *
      * this is a worker callback inside the worker context
      */
      function zipworkerDone(event) { 
        if (event.data.status === "transferComplete") {
          console.log('message from worker: Upload to VoxForge server completed');
          view.showUploadStatus("Upload successfull!");
        } else if (event.data.status === "savedInBrowserStorage") {
          console.log('message from worker: problem with Internet connection, submission saved in browser storage');
          alert("No Internet connection, submission saved in browser storage.  \nIt will be uploaded next time you make a submission with Internet up.");
        } else if (event.data.status === "foundSavedFailedUploads") {
          console.log('message from worker: found submissions saved to browser, uploading them...');
          view.showUploadStatus("Found saved submission(s), uploading to VoxForge server.");
        } else {
          console.log('message from worker: transfer error: ' + event.data.status);
        }
      };

      console.log('===done createZipFile===');
    }

    audioArrayLoop();
}





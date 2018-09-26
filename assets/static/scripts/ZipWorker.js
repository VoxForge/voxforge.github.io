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

'use strict';

// #############################################################################

importScripts('../lib/jszip.js', '../lib/localforage.js'); 
var submissionCache = localforage.createInstance({
    name: "submissionCache"
});

/**
* Main worker function.  This worker, running in the background, takes the text
* and audio blob files and adds them to an in memory zip object which it then 
* saves as an object in InnoDB.  It then attempts to upload it to the VoxForge 
* server; if it cannot, it will upload the saved submission to the VoxForge 
* server the next time it performs a successful upload.
* 
* Problem: it will only upload saved submission to server if the user tries
* to upload another submission... should upload in background once network 
* connectivity is detected, like a service worker is supposed to so (though
* the background unload by service worker only seems to work on Android)
*/
self.onmessage = function(event) {
  var data = event.data;
  switch (data.command) {
    case 'zipAndSave':
      createZipFile(self, data);
      break;
    default:
      console.error('zipAndSave error. Invalid command: ' + data.command);
      break;
  }
};

/**
* creates the zip file in memory and return to caller as blob
*/
function createZipFile(self, data) {
  var zip = new JSZip();
  zip.file("readme.txt", data.readme_blob); // backward compatibility for VoxForge 1.0 corpus
  zip.file("prompts.txt", data.prompts_blob); // backward compatibility for VoxForge 1.0 corpus
  zip.file("license.txt", data.license_blob);
  zip.file("profile.json", data.profile_json_blob);
  zip.file("prompts.json", data.prompts_json_blob);
  zip.file("debug.json", data.debug_json_blob);

  for (var i = 0; i < data.audio.length; i++) {
    var filename = data.audio[i].filename;
    var audio_blob =  data.audio[i].audioBlob;
    zip.file(filename, audio_blob);
  }

  /* inner function: create zip file in memory and puts it in a blob object */
  zip.generateAsync({type:"blob"})
  .then(
    function(zip_file_in_memory) {
      saveSubmissionLocally(data, zip_file_in_memory);
    }
  )
  .catch((err) => { console.log(err) });
}

/** 
* save the submission as a JSON object in user's browser 
* InnoDB database using LocalForage 
*/
function saveSubmissionLocally(data, zip_file_in_memory) {
  var jsonOnject = {};
  jsonOnject['short_submission_name'] = data.short_submission_name;
  jsonOnject['username'] = data.username;
  jsonOnject['language'] = data.language;
  jsonOnject['suffix'] = data.suffix;
  jsonOnject['speechSubmissionAppVersion'] = data.speechSubmissionAppVersion;
  if (!Date.now) { // UTC timestamp in milliseconds;
      Date.now = function() { return new Date().getTime(); }
  }
  jsonOnject['timestamp'] = Date.now();
  jsonOnject['file'] = zip_file_in_memory;

  submissionCache.setItem(data.temp_submission_name, jsonOnject)
  .then(function (value) {
    console.info('saveSubmissionLocally: saved submission to localforage browser storage using this key: ' + data.temp_submission_name);

    self.postMessage({ 
      status: "savedInBrowserStorage"
    });

  })
  .catch(function(err) {
      console.error('saveSubmissionLocally failed!', err);
  });
}


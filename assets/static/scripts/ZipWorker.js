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

/**
* use about:debugging#workers in firefox to get at web worker
* use chrome for debugging webworkers, no need to mess with about:...
*
*
*  Note on cross domain cookies: cookies do not work in web workers
*    //https://markitzeroday.com/x-requested-with/cors/2017/06/29/csrf-mitigation-for-ajax-requests.html
*
* references: 
* see also https://www.w3schools.com/xml/ajax_xmlhttprequest_response.asp
* See for debugging mobile: https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_for_Android_with_WebIDE
* see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
*
* https://mortoray.com/2014/04/09/allowing-unlimited-access-with-cors/
* cannot send cookies from a webworker...
* see https://stackoverflow.com/questions/34635057/can-i-access-document-cookie-on-web-worker
*/

// #############################################################################

importScripts('../lib/jszip.js', '../lib/localforage.js'); 
var submissionCache = localforage.createInstance({
    name: "submissionCache"
});

/**
* Main worker function.  This worker, running in the background, takes the text
* and audio blob files
* and adds them to an in memory zip object which it then attempts to upload
* to the VoxForge server; if it cannot, it will save the submission to InnoDB
* using localForage, and upload to server next time it performs a successful
* upload.
* 
* Problem: it will only upload saved submission to server if the user tries
* another submission... should upload in background once network connectivity
* is detected using a service worker
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
  );
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


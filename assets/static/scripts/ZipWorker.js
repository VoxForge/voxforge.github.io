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

// #############################################################################

/*
// use about:debugging#workers in firefox to get at web worker
// use chrome for debugging webworkers, no need to mess with about:...


  Note cross domain cookies: cookies do not work in web workers
    //https://markitzeroday.com/x-requested-with/cors/2017/06/29/csrf-mitigation-for-ajax-requests.html

// see also https://www.w3schools.com/xml/ajax_xmlhttprequest_response.asp
// See for debugging mobile: https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_for_Android_with_WebIDE
// see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest

//https://mortoray.com/2014/04/09/allowing-unlimited-access-with-cors/
// cannot send cookies from a webworker...
// see https://stackoverflow.com/questions/34635057/can-i-access-document-cookie-on-web-worker
//xhr.withCredentials = true;
*/

// #############################################################################

importScripts('jszip.js', 'localforage.js'); 
//var uploadURL = 'https://flask.voxforge1.org/uploadSubmissionFile'; // Flask testing
//var uploadURL = 'https://jekyll_voxforge.org/flask/uploadSubmissionFile'; // Flask testing
// now using PHP uploader
//var uploadURL = 'https://jekyll2_voxforge.org/upload.php'; // test
var uploadURL = 'https://upload.voxforge1.org'; // prod

var speechSubmissionAppVersion = "0.1";
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
  console.log("starting zipAndUpload web worker");

  var data = event.data;
  switch (data.command) {
    case 'zipAndUpload':
      createZipFile(self, data);
      break;
    default:
      console.log('zipAndUpload error. Invalid command: ' + data.command);
      break;
  }
};

/**
* creates the zip file in memory
*/
function createZipFile(self, data) {
  var zip = new JSZip();

  zip.file("readme.txt", data.readme); // backward compatibility for VoxForge 1.0 corpus
  zip.file("prompts.txt", data.prompts); // backward compatibility for VoxForge 1.0 corpus
  zip.file("profile.json", data.profile);
  zip.file("prompts.json", data.prompts_json);

  for (var i = 0; i < data.audio.length; i++) {
    var filename = data.audio[i].filename;
    var audio_blob =  data.audio[i].audioBlob;
    zip.file(filename, audio_blob);
  }

  /* inner function: create zip file in memory and puts it in a blob object */
  zip.generateAsync({type:"blob"}).then(
    function(zip_file_in_memory) {
      var xhr = new XMLHttpRequest();

      // TODO this approach will not catch instance where user record in one language
      // offline, it gets saved and then recrods in another language and both get
      // uploaded under second name and language...
      uploadZipFile(
        xhr, 
        data.temp_submission_name, 
        zip_file_in_memory,
        data.language,
        data.username
      );
    }
  );
}

/**
* tries to perform the actual upload of submission to voxforge server, if cannot
* tries 2 more times and then saves to user's browser storage
*/
function uploadZipFile(xhr, temp_submission_name, zip_file_in_memory, language, username) {
    var upload_try_count = 1;
    var max_retries = 3;
    var run_once = false;

    /* Inner Function: implements a recursive loop */
    function uploadZipFileLoop() {
        // on failed upload, perform 2 more retries and then save submission locally
        function transferFailed(evt) {
          if ( upload_try_count <= max_retries ) {
            console.log("transferFailed: retry # " + upload_try_count);
            setTimeout( function () {
              uploadZipFileLoop();
      // TODO DEBUG
      //            }, 1000 * 60 * 1); // wait 1 minute for each retry
            }, 3000 ); 
            upload_try_count++;
          } else {
            if ( ! run_once ) {
              var message = "transferFailed: An error occurred while transferring the file.";
              console.log(message);
              self.postMessage({
                status: message 
              });
              saveSubmissionLocally(language, username);
              run_once = true;
            }
            return;
          }
        }

      xhr.upload.addEventListener("error", transferFailed);
      // firefox thinks a break in internet connection is a transferCancelled event??
      //xhr.upload.addEventListener("abort", transferCancelled);
      xhr.upload.addEventListener("abort", transferFailed);

      xhr.open('POST', uploadURL, true); // async

      var form = new FormData();
      form.append('file', zip_file_in_memory, "webworker_file.zip");
      form.append('username', username);
      form.append('language', language);
      xhr.send(form);
    } // end uploadZipFileLoop

    /* Inner Function: save the submission as a JSON object in user's browser 
      InnoDB database using LocalForage */
    function saveSubmissionLocally(language, username) {
      var saved_submission_name = temp_submission_name;
      var jsonOnject = {};
      jsonOnject['file'] = zip_file_in_memory;
      jsonOnject['username'] = username;
      jsonOnject['language'] = language;
      jsonOnject['speechSubmissionAppVersion'] = speechSubmissionAppVersion;
      //localforage.setItem(saved_submission_name, zip_file_in_memory).then(function (value) {
      localforage.setItem(saved_submission_name, jsonOnject).then(function (value) {
        console.log('saveSubmissionLocally: saved submission to localforage browser storage using this key: ' + saved_submission_name);
        self.postMessage({ 
          status: "savedInBrowserStorage"
        });
      }).catch(function(err) {
          console.log('saveSubmissionLocally failed!', err);
      });
    }

    xhr.upload.addEventListener("progress", updateProgress);
    xhr.upload.addEventListener("load", function(event) {
      transferSuccessful();
      checkForSavedFailedUploads();
    });

    uploadZipFileLoop();
}

/** 
* display upload progress in concole for debugging
*/
function updateProgress (evt) {
  if (evt.lengthComputable) {
    var percentComplete = (evt.loaded / evt.total) * 100;
    console.log('percentComplete %', Math.round(percentComplete) );
  } else {
    console.log('percentComplete - Unable to compute progress information since the total size is unknown');
  }
}

/** 
* if the upload was successful, send a message back to calling program saying 
* that the transfer completed successfully
*/
function transferSuccessful(evt) {
  console.log("transferComplete: The transfer successfully completed.");
  self.postMessage({ 
    status: "transferComplete" 
  });
}

/** 
* check for saved submissions (because of previous failed upload), and if there 
* is one, upload to server
*/
function checkForSavedFailedUploads() {
    /* Inner Function: if saved submissions exist, get then upload the submission */
    function foundSavedSubmission(numberOfKeys) {
      localforage.keys().then(function(savedSubmissionArray) {
        console.log('saved submissions to upload: \n' + ' - '+ savedSubmissionArray.join('\n'));
        for (var i = 0; i < savedSubmissionArray.length; i++) {
          var saved_submission_name = savedSubmissionArray[i];
          getSubmission(saved_submission_name);
        }
      }).catch(function(err) {
        console.log(err);
      });
    }

    /* Inner Function: get the submission object */
    function getSubmission(saved_submission_name) {
      //localforage.getItem(saved_submission_name).then(function(zip_file_in_memory) {
      localforage.getItem(saved_submission_name).then(function(jsonOnject) {
        console.log("uploading saved submission: " + saved_submission_name);
        //uploadSubmission(new XMLHttpRequest(), saved_submission_name, zip_file_in_memory);
        uploadSubmission(saved_submission_name, jsonOnject);
      }).catch(function(err) {
        console.log('checkForSavedFailedUpload err: ' + err);
      });
    }

    /* Inner Function: upload the submission to the VoxForge server */
    //function uploadSubmission(xhr, saved_submission_name, zip_file_in_memory) {
    function uploadSubmission(saved_submission_name, jsonOnject) {
        /* Inner Function: if saved submission successfully uploaded to  
           VoxForge server, removeit from user's browser storage */
        function removeSavedSubmission(saved_submission_name) {
          // only remove saved submission if upload completed successfully
          localforage.removeItem(saved_submission_name).then(function() {
            console.log('Saved submission removed: ' + saved_submission_name);
          }).catch(function(err) {
            console.log('Error: cannot remove saved submission: ' + saved_submission_name + ' err: ' + err);
          });  
        }

        xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", updateProgress);
        xhr.upload.addEventListener("load", function(event) {
          transferSuccessful();
          removeSavedSubmission(saved_submission_name);
        });
        xhr.upload.addEventListener("error", function(event) {
          console.log('Warning: upload of saved submission failed for' + saved_submission_name + 'will try again next time');
        });
        //xhr.upload.addEventListener("abort", transferCancelled);
        xhr.upload.addEventListener("abort", function(event) {
          console.log('Warning: upload of saved submission failed for' + saved_submission_name + 'will try again next time');
        });
        xhr.open('POST', uploadURL, true); // async

        var form = new FormData();
        //form.append('file', zip_file_in_memory, "webworker_file.zip");
        //formData.append('language', language);
        //formData.append('username', username);
        form.append('file', jsonOnject['file'], "webworker_file.zip");
        form.append('language', jsonOnject['language'])
        form.append('username', jsonOnject['username'])
        xhr.send(form);
    }

  /* check localforage for any saved submissions (by counting the number of keys
     therein */
  localforage.length().then(function(numberOfKeys) {
    if (numberOfKeys > 0) {
      console.log('number of submissions saved in browser storage: ' + numberOfKeys);
      foundSavedSubmission(numberOfKeys);
    }
  }).catch(function(err) {
      console.log(err);
  });
}

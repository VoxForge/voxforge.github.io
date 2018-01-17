// use about:debugging#workers in firefox to get at web worker
// use chrome for debugging webworkers, no need to mess aroung with about:...

// see https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/offline-for-pwa
//importScripts('jszip.js', 'idb-keyval.js'); 
importScripts('jszip.js', 'localforage.js'); 
var uploadURL = 'https://flask.voxforge1.org/uploadSubmissionFile';
//var uploadURL = 'http://localhost:5000/uploadSubmissionFile';

self.onmessage = function(event) {
  console.log("starting zipAndUpload web worker");

  var data = event.data;
  switch (data.command) {
    case 'start':
      console.log('Warning: start not implemented in ZipWorker');
      break;
    case 'zipAndUpload':
      createZipFile(self, data);
      break;
    default:
      console.log('zipAndUpload error. Invalid command: ' + data.command);
      break;
  }
};

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
* Notes cross domain cookies - CORS does not work in web workers


    //https://markitzeroday.com/x-requested-with/cors/2017/06/29/csrf-mitigation-for-ajax-requests.html
*/

// see also https://www.w3schools.com/xml/ajax_xmlhttprequest_response.asp
// See for debugging mobile: https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_for_Android_with_WebIDE
// see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
function uploadZipFile(xhr, temp_submission_name, zip_file_in_memory, language, username) {
    var upload_try_count = 1;
    var max_retries = 3;
    var run_once = false;

    // TODO might need a more robust approach: see https://github.com/hubspot/offline
    function uploadZipFileLoop() {
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
              saveSubmissionLocally();
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
      //xhr.setRequestHeader("Content-type", "application/zip"); // this is set by default, just want to make it explicit
      xhr.setRequestHeader("Content-type", "multipart/form-data"); // this is set by default, just want to make it explicit

      // https://en.wikipedia.org/wiki/XMLHttpRequest 
      // https://stackoverflow.com/questions/17478731/whats-the-point-of-the-x-requested-with-header
      //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // Tells server that this call is made for ajax purposes.

      var form = new FormData();
      form.append('file', zip_file_in_memory, "webworker_file.zip");
      form.append('username', username);
      form.append('language', language);
      xhr.send(form);
      //xhr.send(zip_file_in_memory); // !!!!!!

    } // end uploadZipFileLoop

    function saveSubmissionLocally() {
      var saved_submission_name = temp_submission_name;
      localforage.setItem(saved_submission_name, zip_file_in_memory).then(function (value) {
        console.log('saveSubmissionLocally: saved submission to localforage browser storage using this key: ' + saved_submission_name);
        self.postMessage({ 
          status: "savedInBrowserStorage"
        });
      }).catch(function(err) {
          console.log('saveSubmissionLocally It failed!', err);
      });
    }
    // !!!!!!
    //https://mortoray.com/2014/04/09/allowing-unlimited-access-with-cors/
    // cannot send cookies from a webworker...
    // see https://stackoverflow.com/questions/34635057/can-i-access-document-cookie-on-web-worker
    //xhr.withCredentials = true;
    // !!!!!!
    xhr.upload.addEventListener("progress", updateProgress);
    xhr.upload.addEventListener("load", function(event) {
      transferSuccessful();
      checkForSavedFailedUploads();
    });

    uploadZipFileLoop();
}

function updateProgress (evt) {
  if (evt.lengthComputable) {
    var percentComplete = (evt.loaded / evt.total) * 100;
    console.log('percentComplete %', Math.round(percentComplete) );
  } else {
    console.log('percentComplete - Unable to compute progress information since the total size is unknown');
  }
}

function transferSuccessful(evt) {
  console.log("transferComplete: The transfer successfully completed.");
  self.postMessage({ 
    status: "transferComplete" 
  });
}

// upload submissions saved to the browser (because of previous failed upload)
function checkForSavedFailedUploads() {

    function foundSavedSubmission(numberOfKeys) {
      localforage.keys().then(function(savedSubmissionArray) {
        console.log('saved submissions to upload: ' + savedSubmissionArray);
        for (var i = 0; i < savedSubmissionArray.length; i++) {
          var saved_submission_name = savedSubmissionArray[i];
          getSubmission(saved_submission_name);
        }
      }).catch(function(err) {
        console.log(err);
      });
    }

    function getSubmission(saved_submission_name) {
      localforage.getItem(saved_submission_name).then(function(zip_file_in_memory) {
        console.log("uploading saved submission: " + saved_submission_name);
        uploadSubmission(new XMLHttpRequest(), saved_submission_name, zip_file_in_memory);
      }).catch(function(err) {
        console.log('checkForSavedFailedUpload err: ' + err);
      });
    }

    function uploadSubmission(xhr, saved_submission_name, zip_file_in_memory) {
        function removeSavedSubmission(saved_submission_name) {
          // only remove saved submission if upload completed successfully
          localforage.removeItem(saved_submission_name).then(function() {
            console.log('Saved submission removed: ' + saved_submission_name);
          }).catch(function(err) {
            console.log('Error: cannot remove saved submission: ' + saved_submission_name + ' err: ' + err);
          });  
        }

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

        var formData = new FormData();
        form.append('file', zip_file_in_memory, "webworker_file.zip");
        formData.append('language', language);
        formData.append('username', username);

        xhr.send(formData);
        //xhr.send(zip_file_in_memory); // !!!!!!
    }

  localforage.length().then(function(numberOfKeys) {
    if (numberOfKeys > 0) {
      console.log('number of submissions saved in browser storage: ' + numberOfKeys);
      foundSavedSubmission(numberOfKeys);
    }
  }).catch(function(err) {
      console.log(err);
  });
}

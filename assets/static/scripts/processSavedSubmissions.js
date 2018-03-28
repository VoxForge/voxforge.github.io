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

//var uploadURL = 'https://upload.voxforge1.org'; // prod
//var uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS

// TODO: duplicate definition app.js
var LOCAL_PROMPT_FILE_NAME = "prompt_file"; // needs to be redefined here

// cannot put this here even though code is being shared bby voxforge_sw.js and 
// UploadWorker.js because they are stored in different places and need different
// relative paths
// importScripts('assets/static/lib/localforage.js');

/* if saved submissions exist, get then upload the submission */
function processSavedSubmissions() {
  return new Promise(function (resolve, reject) {
    localforage.length().then(function(numberOfKeys) {
      console.info('number of submissions saved in browser storage: ' + numberOfKeys);

      // TODO since later loop iterates through all saved submissions, this 
      // prevents service worker from turning into a zombie threads 
      // and continually checking for (deleted) saved submissions...
      if (numberOfKeys <= 0) {
        resolve('no submissions found in browser storage: ' + numberOfKeys);
      }
    })
    .catch(function(err) {
      reject(err);
    });

    localforage.keys().then(function(savedSubmissionArray) {
      console.info('submissions to upload to VoxForge server: \n' + ' - '+ savedSubmissionArray.join('\n'));

      for (var i = 0; i < savedSubmissionArray.length; i++) {
        // so doesnt try to upload and delete saved prompt list
        if (savedSubmissionArray[i] !== LOCAL_PROMPT_FILE_NAME) {

            getSavedSubmission( savedSubmissionArray[i] )
            .then(uploadSubmission)
            .then(removeSubmission)
            .then(function(result) {
                // checking result === OK is redundant since previous function
                // in chaning resolved rather than rejecting...
                if ( i == savedSubmissionArray.length - 1 && result === "OK" ) {
                  console.info("submission(s) successfully uploaded.");
                  resolve("OK");
                }
            })
            .catch(function(err) {
                  reject(err);
            });

        }
      }

    }).catch(function(err) {
      reject(err);
    });
  });
}

/* get the submission object */
function getSavedSubmission(saved_submission_name) {
  return new Promise(function (resolve, reject) {
    // getItem only returns jsonObject
    localforage.getItem(saved_submission_name)
    .then(function(jsonOnject) {
      // resolve sends these as parameters to next promise in chain
      resolve([saved_submission_name, jsonOnject, uploadURL]);

    })
    .catch(function(err) {
      reject('checkForSavedFailedUpload err: ' + err);
    });
  });
}

/* upload the submission to the VoxForge server */
function uploadSubmission(data) {
  var [saved_submission_name, jsonOnject, uploadURL] = data;

  return new Promise(function (resolve, reject) {
    var form = new FormData();
    form.append('file', jsonOnject['file'], "webworker_file.zip");
    form.append('language', jsonOnject['language'])
    form.append('username', jsonOnject['username'])

    fetch(uploadURL, {
      method: 'post',
      body: form,
      mode: 'cors',
      credentials: 'include',
    })
    .then(function (response) {
      console.log('post URL ' +  uploadURL);

      // TODO response.text() is an object, how to get response payload from server
      console.log('response data: ' + response.text());
      // to catch configuration errors on server side
      //if (response.text() === "submission uploaded successfully." ) {
      //  console.info("transferComplete: upload to VoxForge server successfully completed for: " + saved_submission_name);

        // resolve sends these as parameters to next promise in chain
        resolve(saved_submission_name);

      //} else {
      //  reject('Request failed - server configuration issues', response);
      //}

    })
    .catch(function (error) {
      console.warn('upload of saved submission failed for: ' + saved_submission_name + 'will try again next time');
      reject('Request failed', error);
    });

  });
}


/* delete submission from local storage */
function removeSubmission(saved_submission_name) {
  return new Promise(function (resolve, reject) {
    // only remove saved submission if upload completed successfully
    localforage.removeItem(saved_submission_name).then(function() {
      console.log('Backup submission removed from browser: ' + saved_submission_name);

      resolve("OK");

    }).catch(function(err) {
      reject('Error: cannot remove saved submission: ' + saved_submission_name + ' err: ' + err);
    });  
  });
}


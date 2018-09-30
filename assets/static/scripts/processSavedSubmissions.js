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

/**
* common code for service worker and web worker uploading of submission
*/

'use strict';

// cannot put importScripts here even though code is being shared by 
// voxforge_sw.js and UploadWorker.js because they are stored in different 
// places and have different relative paths to localforage
// importScripts('assets/static/lib/localforage.js');

var submissionCache = localforage.createInstance({
    name: "submissionCache"
});

/**
* if saved submissions exists, get then upload the submission 
*/
function processSavedSubmissions(uploadURL, workertype) {
    var uploadList = [];
    var noUploadList = [];
    var uploadIdx = 0;
    var noUploadIdx = 0;

    /**
    * get the submission object from browser storage
    *
    */
    function getSavedSubmission(saved_submission_name) {
      return new Promise(function (resolve, reject) {
        // getItem only returns jsonObject
        submissionCache.getItem(saved_submission_name)
        .then(function(jsonOnject) {
          // resolve sends these as parameters to next promise in chain
          resolve([saved_submission_name, jsonOnject, uploadURL]);

        })
        .catch(function(err) {
          reject('checkForSavedFailedUpload err: ' + err);
        });
      });
    }

    /**
    * upload the submission to the VoxForge server 
    *
    */
    function uploadSubmission(data) {
      var [saved_submission_name, jsonOnject, uploadURL] = data;

      return new Promise(function (resolve, reject) {
        var form = new FormData();
        form.append('file', jsonOnject['file']);
        form.append('language', jsonOnject['language']);
        form.append('username', jsonOnject['username']);
        form.append('suffix',   jsonOnject['suffix']);

        fetch(uploadURL, {
          method: 'post',
          body: form,
          mode: 'cors',
/*          credentials: 'include', */
        })
        // this resolves the promise to get the response data from network stream;
        // basically converts the voxforge server response stream to text...
        .then(response=>response.text()) 
        .then((response_text) => {
            console.log('post URL ' +  uploadURL);
            if (response_text === "submission uploaded successfully." ) {
              var short_name = saved_submission_name.replace(/\[.*\]/gi, '');
              console.info("transferComplete: upload to VoxForge server successfully completed for: " + short_name);
              uploadList[uploadIdx++] = short_name;

              // resolve sends this as parameter to next promise in chain
              resolve(saved_submission_name);

            } else {
              noUploadList[noUploadIdx++] = saved_submission_name.replace(/\[.*\]/gi, '');

              var m = 'Request failed - invalid server response: \n' +  response_text;
              console.error(m);
              reject(m); // skips all inner catches to go to outermost catch
            }
        })
        .catch(function (err) {
          noUploadList[noUploadIdx++] = saved_submission_name.replace(/\[.*\]/gi, '');
          var m = 'Upload request failed for: ' + saved_submission_name.replace(/\[.*\]/gi, '') + '\n\n' +
                   '...will try again on next upload attempt.  error: ' + err;
          console.error(m);
          reject(m);
        });

      });
    }

    /**
    * delete submission from local storage 
    */
    function removeSubmission(saved_submission_name) {
      return new Promise(function (resolve, reject) {
        // only remove saved submission if upload completed successfully
        submissionCache.removeItem(saved_submission_name)
        .then(function() {
          console.log('Backup submission removed from browser: ' + saved_submission_name);

          resolve(saved_submission_name);

        })
        .catch(function(err) {
          var m = 'Error: cannot remove saved submission: ' + saved_submission_name + ' err: ' + err;
          console.error(m);
          reject(m);
        });  
      });
    }

    /**
    * returns a promise that finds saved submission in browser storage, uploads
    * it and if successful, removes the submission from storage
    */
    return new Promise(function (resolve, reject) {
      // check to see if any submissions saved in indexedDB
      submissionCache.length()
      .then(function(numberOfKeys) {
        console.log('number of submissions saved in browser storage: ' + numberOfKeys);

        // TODO since later loop iterates through all saved submissions, this 
        // _should_ prevents service worker from turning into a zombie thread 
        // and continually checking for (deleted) saved submissions...
        if (numberOfKeys <= 0) {
          resolve('no submissions found in browser storage: ' + numberOfKeys);
        }
      })
      .catch(function(err) {
        var m = 'submissionCache - IndexedDB error: ' + err;
        console.error(m);
        reject(m);
      });

      // process submissions saved in indexedDB
      submissionCache.keys()
      .then(function(savedSubmissionArray) {
          var promises = [];
          for (var i = 0; i < savedSubmissionArray.length; i++) {
            var saved_submission_name = savedSubmissionArray[i];
            promises.push(
              getSavedSubmission( saved_submission_name )
              .then(uploadSubmission)
              .then(removeSubmission)
              //catch at Promise.all
            )
          }

          // wait for all async promises to complete
          Promise.all(promises) 
          .then(function() { // allUploaded
            var returnObj = {
              status: 'AllUploaded',
              filesUploaded: uploadList,
              workertype: workertype,
            };
            resolve(returnObj);
          })
          .catch(function(err) {
             console.warn('processSavedSubmissions one or more submissions not uploaded: ' + err);
             if ( uploadList.length > 0 ) { // partialUpload
                 var returnObj = {
                   status: 'partialUpload',
                   filesNotUploaded: noUploadList,
                   filesUploaded: uploadList,
                   workertype: workertype,
                   err: err,
                 };
                 reject(returnObj);
              } else if ( noUploadList.length > 0 ) {  // noUploads
                 // if get here then processing loop on savedSubmissionArray was
                 // only partially iterated over, so will never get an accurate
                 // list of saved submissions, therefore, get all submissions
                 // listed in indexedDB
                 var short_name_array = [];
                 for (var i = 0; i < savedSubmissionArray.length; i++) {
                    short_name_array[i] = savedSubmissionArray[i].replace(/\[.*\]/gi, '');
                 }

                 var returnObj = {
                   status: 'noneUploaded',
                   //filesNotUploaded: noUploadList,
                   filesNotUploaded: short_name_array,
                   err: err,
                 }
                 reject(returnObj);
              } else {
                var m = 'no submissions in uploadList or noUploadList - something is wrong';
                console.error(m);
                reject(m);
              }
          });

      })
      .catch(function(err) { console.log(err) });
    });
}




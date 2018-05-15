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

// cannot put importScripts here even though code is being shared by voxforge_sw.js and 
// UploadWorker.js because they are stored in different places and have 
// different relative paths to localforage
// importScripts('assets/static/lib/localforage.js');
var submissionCache = localforage.createInstance({
    name: "submissionCache"
});

/**
* if saved submissions exists, get then upload the submission 
*/
function processSavedSubmissions(uploadURL) {
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
    * Basically fetch() will only reject a promise if the user is offline, or 
    * a networking error occurs, such a DNS lookup failure.
    * see: https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
    * research: https://medium.com/@shahata/why-i-wont-be-using-fetch-api-in-my-apps-6900e6c6fe78
    *
    * also may fail if file size is greater than settings in php.ini on server;
    * if this happens, get this cryptic error:
        server error message: Request failed - invalid server response: 
        <br />
        <b>Notice</b>:  Undefined index: file in <b>/home/daddy/git/voxforge.github.io/_site/index.php</b> on line <b>56</b><br />
        <br />
        <b>Notice</b>:  Undefined index: file in <b>/home/daddy/git/voxforge.github.io/_site/index.php</b> on line <b>59</b><br />
        <br />
        <b>Notice</b>:  Undefined index: file in <b>/home/daddy/git/voxforge.github.io/_site/index.php</b> on line <b>60</b><br />
        <br />
        <b>Notice</b>:  Undefined index: file in <b>/home/daddy/git/voxforge.github.io/_site/index.php</b> on line <b>61</b><br />
        Invalid parameters.
    */
    function uploadSubmission(data) {
      var [saved_submission_name, jsonOnject, uploadURL] = data;

      return new Promise(function (resolve, reject) {
        var form = new FormData();
        form.append('file', jsonOnject['file'], "webworker_file.zip");
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
              console.info("transferComplete: upload to VoxForge server successfully completed for: " + saved_submission_name);

              uploadList[uploadIdx++] = saved_submission_name.replace(/\[.*\]/gi, '');

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
          // reject message does not show up anywhere???
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
        submissionCache.removeItem(saved_submission_name).then(function() {
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
        // prevents service worker from turning into a zombie thread 
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
          // https://stackoverflow.com/questions/31426740/how-to-return-many-promises-in-a-loop-and-wait-for-them-all-to-do-other-stuff?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
          var promises = [];
          for (var i = 0; i < savedSubmissionArray.length; i++) {
            var saved_submission_name = savedSubmissionArray[i];
            promises.push(
              getSavedSubmission( saved_submission_name )
              .then(uploadSubmission)
              .then(removeSubmission)
            )
          }

          // wait for all async promises to complete
          Promise.all(promises) 
          .then(function() { // allUploaded
            var returnObj = {
              status: 'AllUploaded',
              filesUploaded: uploadList,
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
                   err: err,
                 };
                 reject(returnObj);
              } else if ( noUploadList.length > 0 ) {  // noUploads
                 var returnObj = {
                   status: 'noneUploaded',
                   filesNotUploaded: noUploadList,
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
    });
}




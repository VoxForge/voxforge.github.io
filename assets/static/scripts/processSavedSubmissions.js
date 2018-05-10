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

//debugging service workers: chrome://serviceworker-internals

// Note: make sure jekyll_voxforge.org and jekyll2_voxforge.org defined in
// /etc/hosts or on local DNS server;

var uploadURL = 'https://upload.voxforge1.org'; // prod
// !!!!!!
var uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
//var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS
// !!!!!!

// cannot put importScripts here even though code is being shared by voxforge_sw.js and 
// UploadWorker.js because they are stored in different places and have 
// different relative paths
// importScripts('assets/static/lib/localforage.js');
var submissionCache = localforage.createInstance({
    name: "submissionCache"
});


/**
* if saved submissions exists, get then upload the submission 
*/
function processSavedSubmissions() {
    var uploadList = [];
    var j = 0;
    var filesWereUploaded = false;

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
              //console.info("transferComplete: upload to VoxForge server successfully completed for: " + saved_submission_name);

              uploadList[j] = saved_submission_name.replace(/\[.*\]/gi, '');
              j++;
              filesWereUploaded = true;

              // resolve sends this as parameter to next promise in chain
              resolve(saved_submission_name);

            } else {
              reject('Request failed - server configuration issues', response);
            }
        })
        .catch(function (error) {
          //console.warn('upload of saved submission failed for: ' + saved_submission_name + ' ...will try again on next upload attempt');
          reject('Upload request failed for: ' + saved_submission_name.replace(/\[.*\]/gi, '') + ' ', error);
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
          //console.log('Backup submission removed from browser: ' + saved_submission_name);

          resolve(saved_submission_name);

        })
        .catch(function(err) {
          reject('Error: cannot remove saved submission: ' + saved_submission_name + ' err: ' + err);
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
        console.info('number of submissions saved in browser storage: ' + numberOfKeys);

        // TODO since later loop iterates through all saved submissions, this 
        // prevents service worker from turning into a zombie thread 
        // and continually checking for (deleted) saved submissions...
        if (numberOfKeys <= 0) {
          resolve('no submissions found in browser storage: ' + numberOfKeys);
        }
      })
      .catch(function(err) {
        reject(err);
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
            //resolve(uploadList);
            var returnObj = {
              status: 'AllUploaded',
              filesUploaded: uploadList,
            };
            resolve(returnObj);
          })
          .catch(function(err) {
             console.warn('processSavedSubmissions one or more submissions not uploaded: ' + err);
             //   reject(uploadList);
             // TODO if one submission of 2 or more submissions does not upload
             // for some reason (e.g. file too big), then user only gets message 
             // that failed upload submission is saved to browser storage, but
             // receives no message of the successfull uploads or why one
             // one particular submission was saved rather than uploaded...
             // distinguish between allUpload; partialUpload; noUpload
             submissionCache.keys().then(function(filesNotUploaded) {
               var list = [];
               for (var i = 0; i < filesNotUploaded.length; i++) {
                  list[i] = filesNotUploaded[i].replace(/\[.*\]/gi, '')
               }

               if ( filesWereUploaded.length > 0 ) { // partialUpload
                   var returnObj = {
                     status: 'partialUpload',
                     filesNotUploaded: list,
                     filesUploaded: uploadList,
                   };
                   reject(returnObj);
                } else { // noneUploaded
                   var returnObj = {
                     status: 'noneUploaded',
                     filesNotUploaded: list,
                   }
                   reject(returnObj);
                }
             });
          });

      })
    });
}




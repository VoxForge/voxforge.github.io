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



/**
* Class definition
*/
function SavedSubmissions (
    uploadURL,
    workertype) 
{
    this.uploadURL = uploadURL;
    this.workertype = workertype;
    this.uploadList = [];
    this.noUploadList = [];    
    this.uploadIdx = 0;
    this.noUploadIdx = 0;

    this.submissionCache = localforage.createInstance({
        name: "submissionCache"
    });

    this.promises = [];

    console.log('post URL ' +  uploadURL);    
}

/**
* if saved submissions exists, get, then upload the submission 
*
* returns a promise that finds saved submission in browser storage, uploads
* it and if successful, removes the submission from storage
*/
SavedSubmissions.prototype.process = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.process_resolve = resolve;
        self.process_reject = reject;
        
        self._getSubmissions.call(self)
        .then(self._asyncUploadOfSubmissions.bind(self))
        .then(self._waitForSubmissionsToUpload.bind(self))        
        .catch(function(err) { console.log(err) });
    });
}

SavedSubmissions.prototype._getSubmissions = function() {
    this._confirmBrowserrHasSavedSubmissions();
    
    return this.submissionCache.keys();
}

/*
 * check to see if any submissions saved in indexedDB
 * TODO since later loop iterates through all saved submissions, this 
 * _should_ prevents service worker from turning into a zombie thread 
 * and continually checking for (deleted) saved submissions...
 */
SavedSubmissions.prototype._confirmBrowserrHasSavedSubmissions = function() {
    var self = this;
    
    this.submissionCache.length()
    .then(function(numberOfKeys) {
        if (numberOfKeys <= 0) {
            let m = 'no submissions found in browser storage: ' + numberOfKeys;
            console.log(m);
            self.process_reject(m);
        } else {
            console.log('number of submissions saved in browser storage: ' +
                numberOfKeys);            
        }
    })
    .catch(function(err) {
        var m = 'submissionCache - IndexedDB error: ' + err;
        console.error(m);
    });
}

SavedSubmissions.prototype._asyncUploadOfSubmissions = function(
    savedSubmissionArray)
{
    var self = this;
        
    return new Promise(function(resolve, reject) {
        savedSubmissionArray.forEach(
            self._uploadSubmissionPromise.bind(self));

        resolve(savedSubmissionArray);
    });
}

SavedSubmissions.prototype._uploadSubmissionPromise = function(saved_submission_name) {
    this.promises.push(
        this._getSavedSubmissionObj.call(this, saved_submission_name)
        .then(this._uploadSubmission.bind(this))
        .then(this._removeSubmission.bind(this))
        //catch at Promise.all
    ) 
}

/**
* get the submission object from browser storage
*
*/
SavedSubmissions.prototype._getSavedSubmissionObj = function(saved_submission_name) {
    var self = this;
        
    return new Promise(function(resolve, reject) {
      
        // getItem only returns jsonObject
        self.submissionCache.getItem(saved_submission_name)
        .then(function(jsonObject) {
            // resolve sends these as parameters to next promise in chain
            resolve({
                saved_submission_name: saved_submission_name,
                jsonObject: jsonObject,
            });
        })
        .catch(function(err) {
            reject('checkForSavedFailedUpload err: ' + err);
        });

    });
}

/**
* upload the submission to the VoxForge server
*
* '.then(response=>response.text())': resolves the promise to get the response
* data from network stream;
* basically converts the voxforge server response stream to text...
*/
SavedSubmissions.prototype._uploadSubmission = function(submissionObj) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        
        submissionObj.uploadSubmission = {};
        submissionObj.uploadSubmission.resolve = resolve;
        submissionObj.uploadSubmission.reject = reject;
        
        fetch(self.uploadURL, self._getFetchParms(submissionObj) )
        .then(response=>response.text()) 
        .then(function(response_text) {
            submissionObj.response_text = response_text;
            self._processUploadResponse.call(self, submissionObj)
        })
        .catch(function(err) {
            var m = self._uploadError.call(self, err, submissionObj);
            reject(m);
        });

    });
}

SavedSubmissions.prototype._uploadError = function(err, submissionObj) {
    var short_name = this._shortName(submissionObj);
    this.noUploadList[this.noUploadIdx++] = short_name;
    var m = 'Upload request failed for: ' +
        short_name +
        '\n\n' +
        '...will try again on next upload attempt.  error: ' +
        err;
    console.warn(m);

    return m;
}

SavedSubmissions.prototype._getFetchParms = function(submissionObj) {
    var jsonObject = submissionObj.jsonObject;
    
    var form = new FormData();
    form.append('file', jsonObject.file);
    form.append('language', jsonObject.language);
    form.append('username', jsonObject.username);
    form.append('suffix',   jsonObject.suffix);

    return {
        method: 'post',
        body: form,
        mode: 'cors',
        /*          credentials: 'include', */
    }
}

SavedSubmissions.prototype._processUploadResponse = function(submissionObj) {
    var short_name = this._shortName(submissionObj);
    
    if ( this._serverConfirmsSubmissionUploaded(submissionObj) ) {
        this.uploadList[this.uploadIdx++] = short_name;
                
        console.info("transferComplete: upload to VoxForge server " +
            "successfully completed for: " +
            short_name);

        submissionObj.uploadSubmission.resolve(
            submissionObj.saved_submission_name);
    } else {
        this.noUploadList[this.noUploadIdx++] = short_name;

        var m = 'Request failed - invalid server response: \n' +  response_text;
        console.error(m);
        
        submissionObj.uploadSubmission.reject(m);
    }
}

SavedSubmissions.prototype._serverConfirmsSubmissionUploaded = function(submissionObj) {
    return submissionObj.response_text === "submission uploaded successfully.";
}

SavedSubmissions.prototype._shortName = function(submissionObj) {
    return submissionObj.saved_submission_name.replace(/\[.*\]/gi, '');
}

/**
* delete submission from local storage 
*/
SavedSubmissions.prototype._removeSubmission = function(saved_submission_name) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
      
        // only remove saved submission if upload completed successfully
        self.submissionCache.removeItem(saved_submission_name)
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

// wait for all async promises to complete
SavedSubmissions.prototype._waitForSubmissionsToUpload = function(
    savedSubmissionArray,)
{
    var self = this;

    Promise.all(self.promises) 
    .then(function() { // allUploaded
        self.process_resolve({
            status: 'AllUploaded',
            filesUploaded: self.uploadList,
            workertype: self.workertype,
        });
    })
    .catch(function(err) {
        self._notAllSubmissionsUploaded(err, savedSubmissionArray);
    });
}

SavedSubmissions.prototype._notAllSubmissionsUploaded = function(
    err,
    savedSubmissionArray,
) {
    var self = this;
    console.warn('SavedSubmissions one or more submissions not uploaded: ' + err);
    
    if ( this._partialUploads.call(this) ) { 
        this.process_reject({
            status: 'partialUpload',
            filesNotUploaded: this.noUploadList,
            filesUploaded: this.uploadList,
            workertype: this.workertype,
            err: err,
        });
    } else if ( this._noUploads.call(this) ) {
        this.process_reject({
            status: 'noneUploaded',
            filesNotUploaded: this._shortNameArray(savedSubmissionArray),
            err: err,
        });
    } else {
        var m = 'no submissions in uploadList or noUploadList - something is wrong';
        console.error(m);
        self.process_reject(m);
    }
}

/*
 * if get here then processing loop on savedSubmissionArray was
 * only partially iterated over, so will never get an accurate
 * list of saved submissions, therefore, get all submissions
 * listed in indexedDB
 */
SavedSubmissions.prototype._shortNameArray = function(savedSubmissionArray) {
    var short_name_array = savedSubmissionArray.map(function(submission) {
        return submission.replace(/\[.*\]/gi, '');
    });

    return short_name_array;
}

// since not alluploaded, check to see if some submission were uploaded
SavedSubmissions.prototype._partialUploads = function() {
    return this.uploadList.length > 0;
}

SavedSubmissions.prototype._noUploads = function() {
    return this.noUploadList.length > 0 ;
}



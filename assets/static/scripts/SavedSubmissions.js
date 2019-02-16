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
        
        self._getSavedSubmissionArray.call(self)
        .then(self._asyncUploadOfSubmissions.bind(self))
        .then(self._waitForSubmissionsToUpload.bind(self))        
        .catch(function(err) { console.log(err) });
    });
}

SavedSubmissions.prototype._getSavedSubmissionArray = function() {
    this._confirmBrowserHasSavedSubmissions();
    
    return this.submissionCache.keys();
}

/*
 * check to see if any submissions saved in indexedDB
 * TODO since later loop iterates through all saved submissions, this 
 * _should_ prevents service worker from turning into a zombie thread 
 * and continually checking for (deleted) saved submissions...
 */
SavedSubmissions.prototype._confirmBrowserHasSavedSubmissions = function() {
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

SavedSubmissions.prototype._uploadSubmissionPromise = function(savedSubmissionName) {
    var self = this;
    
    this.promises.push(
        self._getSavedSubmissionObj.call(self, savedSubmissionName)
        .then(self._uploadSubmission.bind(self))
        .then(self._removeSubmission.bind(self))
        //catch at Promise.all
    ) 
}

/**
* get the submission object from browser storage
*
*/
SavedSubmissions.prototype._getSavedSubmissionObj = function(savedSubmissionName) {
    var self = this;
        
    return new Promise(function(resolve, reject) {
      
        self.submissionCache.getItem(savedSubmissionName)
        .then(function(jsonObject) {
            var submissionObj = new Submission(savedSubmissionName, jsonObject);
            resolve(submissionObj);
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

        submissionObj.setPromiseReturnFunctions(resolve, reject);

        fetch(self.uploadURL, submissionObj.getFetchParms() )
        .then(self._convertStreamResponseToText.bind(self))
        .then(function(response_text) {
            submissionObj.setReponseText(response_text);            
            self._processUploadResponse.call(self, submissionObj);
        })
        .catch(function(err) {
            var m = self._uploadError.call(self, err, submissionObj);
            reject(m);
        });

    });
}

SavedSubmissions.prototype._convertStreamResponseToText = function(response) {
    return response.text()
}

SavedSubmissions.prototype._uploadError = function(err, submissionObj) {
    this.noUploadList[this.noUploadIdx++] = submissionObj.shortName();
    
    var m = 'Upload request failed for: ' +
        submissionObj.shortName() +
        '\n\n' +
        '...will try again on next upload attempt.  error: ' +
        err;
    console.warn(m);

    return m;
}

SavedSubmissions.prototype._processUploadResponse = function(submissionObj) {
    if ( submissionObj.serverConfirmedSubmissionUploaded() ) {
        this._submissionUploaded(submissionObj);
    } else {
        this._submissionNotUploaded(submissionObj);
    }
}

SavedSubmissions.prototype._submissionUploaded = function(submissionObj) {
    this.uploadList[this.uploadIdx++] = submissionObj.shortName();
            
    console.info("transferComplete: upload to VoxForge server " +
        "successfully completed for: " +
        submissionObj.shortName() );

    submissionObj.uploadSubmission.resolve(submissionObj);
}

SavedSubmissions.prototype._submissionNotUploaded = function(submissionObj) {
        this.noUploadList[this.noUploadIdx++] = submissionObj.shortName();

        var m = 'Request failed - invalid server response: \n' +
            submissionObj.response_text;
        console.error(m);
        
        submissionObj.uploadSubmission.reject(m);
}

/**
* delete submission from local storage
* (only remove saved submission if upload completed successfully)
*/
SavedSubmissions.prototype._removeSubmission = function(submissionObj) {
    this.submissionCache.removeItem(submissionObj.savedSubmissionName)
    .then(function() {
        console.log('Backup submission removed from browser: ' +
            submissionObj.savedSubmissionName);

    })
    .catch(function(err) {
        var m = 'Error: cannot remove saved submission: ' +
            submissionObj.savedSubmissionName +
            ' err: ' +
            err;
        console.error(m);
        reject(m);
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
    savedSubmissionArray,)
{
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
    var short_name_array = savedSubmissionArray.map(function(savedSubmissionName) {
        return Submission.shortName(savedSubmissionName);
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

// #############################################################################
/**
* Class definition
*/
function Submission (savedSubmissionName, jsonObject) {
    this.savedSubmissionName = savedSubmissionName;
    this.jsonObject = jsonObject;  
}

Submission.shortName = function(savedSubmissionName) {
    return savedSubmissionName.replace(/\[.*\]/gi, '');
}

/**
* methods
*/
Submission.prototype.shortName = function() {
    return Submission.shortName(this.savedSubmissionName);
}

Submission.prototype.setPromiseReturnFunctions = function(resolve, reject) {
    this.uploadSubmission = {};
    this.uploadSubmission.resolve = resolve;
    this.uploadSubmission.reject = reject;
}

Submission.prototype.setReponseText = function(response_text) {
    this.response_text = response_text;
}

Submission.prototype.serverConfirmedSubmissionUploaded = function() {
    return this.response_text === "submission uploaded successfully.";
}

Submission.prototype.getFetchParms = function() {
    var jsonObject = this.jsonObject;
    
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

            

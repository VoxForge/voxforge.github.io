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
    this.uploadInfo = new UploadInfo();

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
            var submissionObj = new Submission(
                savedSubmissionName,
                jsonObject,
                self.uploadURL,
                self.uploadInfo,
                self.submissionCache);                
            submissionObj.process()
            .then(resolve);
        })
        .catch(function(err) {
            reject('checkForSavedFailedUpload err: ' + err);
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
            filesUploaded: self.uploadInfo.uploadList,
            workertype: self.workertype,
        });
    })
    .catch(function(err) {
        self._notAllSubmissionsUploaded.call(self, err, savedSubmissionArray);
    });
}

SavedSubmissions.prototype._notAllSubmissionsUploaded = function(
    err,
    savedSubmissionArray,)
{
    var self = this;
    console.warn('SavedSubmissions one or more submissions not uploaded: ' + err);

    if ( this.uploadList.partialUpload() ) { 
        this.process_reject(
            this._getPartialUploadsObj(err));
    } else if ( this.uploadList.noUploads() ) {
        var shortNameArray = this._shortNameArray(savedSubmissionArray);
        this.process_reject(
            this._getNoUploadsObj(err, shortNameArray));
    } else {
        this.process_reject(
            this._getNotAllSubmissionsUploadedErrMsg());
    }
}

SavedSubmissions.prototype._getPartialUploadsObj = function(err) {
    return {
        status: 'partialUpload',
        filesNotUploaded: this.uploadInfo.noUploadList,
        filesUploaded: this.uploadInfo.uploadList,
        workertype: this.workertype,
        err: err,
    };
}

SavedSubmissions.prototype._getNoUploadsObj = function(err, shortNameArray) {
    return {
        status: 'noneUploaded',
        filesNotUploaded: shortNameArray,
        err: err,
    };
}

SavedSubmissions.prototype._getNotAllSubmissionsUploadedErrMsg = function() {
    var m = 'no submissions in uploadList or noUploadList - something is wrong';
    console.error(m);

    return m;
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

// #############################################################################

/**
* Class definition
*/
function UploadInfo (
    uploadURL)
{
    this.uploadList = [];
    this.noUploadList = [];    
    this.uploadIdx = 0;
    this.noUploadIdx = 0;
}

UploadInfo.prototype.addToUploadList = function(submissionName) {
    this.uploadList[this.noUploadIdx++] = submissionName;
}

UploadInfo.prototype.addToNoUploadList = function(submissionName) {
    this.noUploadList[this.noUploadIdx++] = submissionName;
}

// since not alluploaded, check to see if some submission were uploaded
UploadInfo.prototype.partialUpload = function() {
    return this.uploadList.length > 0;
}

UploadInfo.prototype.noUploads = function() {
    return this.noUploadList.length > 0 ;
}

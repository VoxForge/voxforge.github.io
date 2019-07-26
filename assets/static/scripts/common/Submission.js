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
/**
* Class definition
*
* Individual Submission object
*/
function Submission (
    submissionCache,
    savedSubmissionName,
    uploadURL,
    uploadInfo)
{
    this.submissionCache = submissionCache;
    this.savedSubmissionName = savedSubmissionName;
    this.uploadURL = uploadURL;
    this.uploadInfo = uploadInfo;
}

/**
* Static methods
*/

Submission.shortName = function(savedSubmissionName) {
    return savedSubmissionName.replace(/\[.*\]/gi, '');
}

/**
* methods
*/

Submission.prototype.upload = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        
        self.submissionCache.getItem(self.savedSubmissionName)
        .then(self._upload.bind(self))
        .then(self._remove.bind(self))
        .then(resolve)
        .catch(function(err) {
            reject(err);
        });
        
    });    
}

/**
* upload the submission to the VoxForge server
*/
Submission.prototype._upload = function(jsonObject) {
    var self = this;
    this.jsonObject = jsonObject;
    
    return new Promise(function(resolve, reject) {

        self._setPromiseReturnFunctions(resolve, reject);

        fetch(self.uploadURL, self._getFetchParms() )
        .then(self._convertStreamResponseToText.bind(self))
        .then(function(response_text) {
            self._setReponseText(response_text);            
            self._processUploadResponse();
        })
        .catch(function(err) {
            var m = self._uploadError.call(self, err);
            reject(m);
        });

    });
}

/**
* '.then(response=>response.text())': resolves the promise to get the response
* data from network stream;
* basically converts the voxforge server response stream to text...
*/
Submission.prototype._convertStreamResponseToText = function(response) {
    return response.text()
}

Submission.prototype._uploadError = function(err) {
    this.uploadInfo.addToNoUploadList( this._shortName() );
    
    var m = 'Upload request failed for: ' +
        this._shortName() +
        '\n\n' +
        '...will try again on next upload attempt.  error: ' +
        err;
    console.warn(m);

    return m;
}

Submission.prototype._processUploadResponse = function() {
    if ( this._serverConfirmedSubmissionUploaded() ) {
        this._submissionUploaded();
    } else {
        this._submissionNotUploaded();
    }
}

Submission.prototype._submissionUploaded = function() {
    this.uploadInfo.addToUploadList( this._shortName() );
                
    console.info("transferComplete: upload to VoxForge server " +
        "successfully completed for: " +
        this._shortName() );

    this.uploadSubmission.resolve("OK");
}

Submission.prototype._submissionNotUploaded = function() {
    this.uploadInfo.addToNoUploadList( this._shortName() );
    var m = 'Request failed - invalid server response: \n' +
        this.response_text;
    console.error(m);
    
    this.uploadSubmission.reject(m);
}

/**
* delete submission from local storage
* (only remove saved submission if upload completed successfully)
*/
Submission.prototype._remove = function() {
    var self = this;
    
    this.submissionCache.removeItem(this.savedSubmissionName)
    .then(self._submissionRemoved.bind(self))
    .catch(function(err) {
        self._submissionNotRemoved.call(self, err)
        reject(m);
    });
}

Submission.prototype._submissionRemoved = function() {
    console.log('Backup submission removed from browser: ' +
        this.savedSubmissionName);
}

Submission.prototype._submissionNotRemoved = function(err) {
    var m = 'Error: cannot remove saved submission: ' +
        this.savedSubmissionName +
        ' err: ' +
        err;
    console.error(m);
}

Submission.prototype._shortName = function() {
    return Submission.shortName(this.savedSubmissionName);
}

Submission.prototype._setPromiseReturnFunctions = function(resolve, reject) {
    this.uploadSubmission = {};
    this.uploadSubmission.resolve = resolve;
    this.uploadSubmission.reject = reject;
}

Submission.prototype._setReponseText = function(response_text) {
    this.response_text = response_text;
}

Submission.prototype._serverConfirmedSubmissionUploaded = function() {
    return this.response_text === "submission uploaded successfully.";
}

Submission.prototype._getFetchParms = function() {
    return {
        method: 'post',
        body: this._setupFormData(),
        mode: 'cors',
        /*          credentials: 'include', */
    }
}

Submission.prototype._setupFormData = function() {
    var jsonObject = this.jsonObject;
    
    var form = new FormData();
    form.append('file', jsonObject.file);
    form.append('language', jsonObject.language);
    form.append('username', jsonObject.username);
    form.append('suffix',   jsonObject.suffix);

    return form;
}  

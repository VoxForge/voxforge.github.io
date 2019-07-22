/*
Copyright 2019 VoxForge

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

function UploadMessage(
    returnObj,
    alert_message,
    uploadedSubmissions,
    appversion)
{
    var self = this;
    this.returnObj = returnObj;
    this.alert_message = alert_message;
    this.uploadedSubmissions = uploadedSubmissions;
    this.appversion = appversion;
}

UploadMessage.prototype.submissionPluralized = function(numberOfSubmissions) {
    return (numberOfSubmissions > 1 ?
        this.alert_message.submission_plural :
        this.alert_message.submission_singular);
}

//UploadMessage.prototype.getDate = function() {
//    if (!Date.now) { // UTC timestamp in milliseconds;
//        Date.now = function() { return new Date().getTime(); }
//    }
//    return Date.now();
//}

UploadMessage.prototype.getUploadedToServerMessage = function() {
    var numberUploaded = this.returnObj.filesUploaded.length;
    
    return numberUploaded + " " + 
        this.submissionPluralized(numberUploaded) + " " +
        this.alert_message.uploaded_message  + "\n    " +
        this.returnObj.filesUploaded.join("\n    ");
}

/*
 * Display message to user after recording has ended (i.e. wait for user
 * to press stop before displaying message)
 */
UploadMessage.prototype.displayMessageToUser = function(m) {
    console.info(this.returnObj.workertype + ": " + m);
    Promise.all(promise_list) // wait for stop click before displaying alert (if user recording)
    .then(function() {
        // TODO Firefox says this is not supported, but then goes ahead and
        // does it (error: NotSupportedError: Operation is not supported)
        window.alert(m);
    })
    .catch(function(err) { console.log(err) });            
}

UploadMessage.prototype.getSavedToBrowserStorageMessage = function() {
    var filesNotUploaded =  this.returnObj.filesNotUploaded;
    var numberNotUploaded = filesNotUploaded.length;
    
    return this.alert_message.browsercontains_message.trim() + " " + // remove newline
        numberNotUploaded + " " + 
        this.submissionPluralized(numberNotUploaded) + ":\n    " + 
        filesNotUploaded.join("\n    ");
}

/*
 * save count of uploaded submissions
 */
UploadMessage.prototype.setNumberOfUploadedSubmissions = function() {
    var numberOfUploadedSubmissions =
        this._getNumberOfUploadedSubmissions() +
        this.returnObj.filesUploaded.length;

    localStorage.setItem(
        'numberOfUploadedSubmissions',
        numberOfUploadedSubmissions);
}

/**
* localStorage stores everything as a string
*/
UploadMessage.prototype._getNumberOfUploadedSubmissions = function() {
  return parseInt( localStorage.getItem('numberOfUploadedSubmissions') || 0);
}

/*
 * iterate through list of saved submissions and call function
 * to save each one
 */
UploadMessage.prototype.saveSubmissionsToList = function() {
    this.returnObj.filesUploaded.forEach(
        this._saveSubmissionNameToList.bind(this));
}

/*
 * save name of uploaded submission in localstorage with timestamp
 */
UploadMessage.prototype._saveSubmissionNameToList = function(submissionName) {
    var jsonOnject = {};

    //jsonOnject['timestamp'] = this.getDate();
    var date = new Date();  
    jsonOnject['timestamp'] = date.getTime(); // UTC timestamp in milliseconds;
    jsonOnject['timezoneOffset'] = date.getTimezoneOffset();
    jsonOnject['speechSubmissionAppVersion'] = this.appversion;
              
    this.uploadedSubmissions.setItem(submissionName, jsonOnject)
    .catch(function(err) {
        console.error('save of uploaded submission name to localforage browser storage failed!', err);
    });
}

// #############################################################################
function AllUploaded(
    returnObj,
    alert_message,
    uploadedSubmissions,
    appversion)
{
    // Call constructor of superclass to initialize superclass-derived members.
    UploadMessage.call(this, returnObj, alert_message, uploadedSubmissions, appversion);

    this._allUploadedToServer();
}
// AllUploaded inherits from UploadMessage
AllUploaded.prototype = Object.create(UploadMessage.prototype);
AllUploaded.prototype.constructor = UploadMessage;

// ### AllUploaded
AllUploaded.prototype._allUploadedToServer = function() {
    this.saveSubmissionsToList();
    this.setNumberOfUploadedSubmissions();

    this.displayMessageToUser(
        this.getUploadedToServerMessage());
}


// #############################################################################

function NoneUploaded(
    returnObj,
    alert_message,
    uploadedSubmissions,
    appversion)
{
    // Call constructor of superclass to initialize superclass-derived members.
    UploadMessage.call(this, returnObj, alert_message, uploadedSubmissions, appversion);

    this._allSavedToBrowserStorage();
}
// NoneUploaded inherits from UploadMessage
NoneUploaded.prototype = Object.create(UploadMessage.prototype);
NoneUploaded.prototype.constructor = UploadMessage;

NoneUploaded.prototype._allSavedToBrowserStorage = function() {
    this.displayMessageToUser(
        this.alert_message.localstorage_message + "\n" +
        this.getSavedToBrowserStorageMessage());    
}

// #############################################################################

/*
 * if there is an error with one submission (usually server side check - e.g.
 * file too big for server settings), then other submissions will upload, but
 * erroneous one will stay in browser storage.
 * TODO need a way for user to save these their o/s filesystem and upload
 * them to VoxForge server some other way.
*/
// Subclass
function PartialUpload(
    returnObj,
    alert_message,
    uploadedSubmissions,
    appversion)
{
    // Call constructor of superclass to initialize superclass-derived members.
    UploadMessage.call(this, returnObj, alert_message, uploadedSubmissions, appversion);

    this._partialUpload();
}
// Partial inherits from UploadMessage
PartialUpload.prototype = Object.create(UploadMessage.prototype);
PartialUpload.prototype.constructor = UploadMessage;

PartialUpload.prototype._partialUpload = function() {
    this.setNumberOfUploadedSubmissions();
    this.saveSubmissionsToList();
    
    this.displayMessageToUser(this._getPartialUploadMessage());  
}

PartialUpload.prototype._getPartialUploadMessage = function() {
    var m = "Partial Upload:\n\n" +
        this.getUploadedToServerMessage(returnObj) +
        "\n========================\n" +
        this.getSavedToBrowserStorageMessage(returnObj) ;
        
    if (returnObj.err) {
        m = m + "\n========================\n";
        m = m + "\n\nserver error message: " + returnObj.err;
    }

    return m;
}


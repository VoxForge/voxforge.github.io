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

/**
* ### Contructor ##############################################
*/

function Uploader(parms,
                  alert_message)
{
    var self = this;

    this.maxMinutesSinceLastSubmission = parms.maxMinutesSinceLastSubmission;
    this.alert_message = alert_message;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        const swUrl = '/voxforge_sw.js?uploadURL=' + encodeURIComponent(uploadURL);
        navigator.serviceWorker.register(swUrl)
        .then(
            function(reg) {
              console.log('ServiceWorker registration successful with scope: ', reg.scope);
            }, function(err) {
              console.warn('ServiceWorker registration failed: ', err);
              window.alert('Error: no SSL certificate installed on device - VoxForge uploads will fail silently');
            })
        .catch((err) => { console.log(err) });
      });
    }

    this.zip_worker = new Worker('/assets/static/scripts/ZipWorker.js');
    this.upload_worker = new Worker('/assets/static/scripts/UploadWorker.js');

    /**
    * if page reloaded kill background worker threads before page reload
    * to prevent zombie worker threads in FireFox
    */
    $( window ).unload(function() {
      self.zip_worker.terminate();
      self.upload_worker.terminate();
    });

    this.uploadedSubmissions = localforage.createInstance({
      name: "uploadedSubmissions"
    });
}

/**
* ### METHODS ##############################################
*/
/**
* set up worker handlers
*/
Uploader.prototype.init = function () {
    var self = this;

    self.upload_worker.onmessage =
        self._workerEventMessageHandler.bind(self);

    navigator.serviceWorker.addEventListener(
        'message',
        self._workerEventMessageHandler.bind(self));
}

/** 
* process messages from service worker or web worker
*/
Uploader.prototype._workerEventMessageHandler = function (filesUploaded) {
    var self = this;
      
    var returnObj = event.data;
    this._validateAndLogWorkerType(returnObj);

    switch (returnObj.status) {
      case 'AllUploaded':
        this._allUploadedToServer(returnObj);
        break;

      case 'noneUploaded': 
        this._allSavedToBrowserStorage(returnObj);     
        break;

      case 'partialUpload':
         this._partialUpload(returnObj);     
        break;

      default:
        console.error('message from upload worker: transfer error: ' +
                      returnObj.status + " " + returnObj.message);
    } 
}

Uploader.prototype._allUploadedToServer = function (returnObj) {
    this._saveSubmissionsToList(returnObj.filesUploaded);
    this._setNumberOfUploadedSubmissions(returnObj.filesUploaded);
            
    this._displayMessageToUser(
        returnObj.workertype,
        this._getUploadedToServerMessage(returnObj));
}

Uploader.prototype._getUploadedToServerMessage = function (returnObj) {
    var filesUploaded = returnObj.filesUploaded;
            
    return filesUploaded.length + " " + 
        this._submissionPluralized(filesUploaded) + " " +
        this.alert_message.uploaded_message  + "\n    " +
        filesUploaded.join("\n    ");
}

/*
 * save name of uploaded submission in localstorage with timestamp
 */
Uploader.prototype._saveSubmissionsToList = function (filesUploaded) {
    filesUploaded.forEach(
        this._saveSubmissionNameToList.bind(this));
}

Uploader.prototype._saveSubmissionNameToList = function(submissionName) {
    var jsonOnject = {};

    jsonOnject['timestamp'] = this._getDate();
    
    this.uploadedSubmissions.setItem(submissionName, jsonOnject)
    .catch(function(err) {
        console.error('save of uploaded submission name to localforage browser storage failed!', err);
    });
}

/*
 * save count of uploaded submissions
 */
Uploader.prototype._setNumberOfUploadedSubmissions = function(filesUploaded) {
    var numberOfUploadedSubmissions =
        this._getNumberOfUploadedSubmissions() +
        filesUploaded.length;
        
    localStorage.setItem(
        'numberOfUploadedSubmissions',
        numberOfUploadedSubmissions);
}

Uploader.prototype._submissionPluralized = function(submissionArray) {
    return (submissionArray.length > 1 ?
        this.alert_message.submission_plural :
        this.alert_message.submission_singular);
}

Uploader.prototype._allSavedToBrowserStorage = function (returnObj) {
    var m = this.alert_message.localstorage_message + "\n" +
        this._getSavedToBrowserStorageMessage(returnObj);
        
    this._displayMessageToUser(returnObj.workertype, m);    
}

Uploader.prototype._getSavedToBrowserStorageMessage = function (returnObj) {
    var filesNotUploaded =  returnObj.filesNotUploaded;
   
    return this.alert_message.browsercontains_message.trim() + " " + // remove newline
        filesNotUploaded.length + " " + 
        this._submissionPluralized(filesNotUploaded) + ":\n    " + 
        filesNotUploaded.join("\n    ");
}

/*
 * if there is an error with one submission (usually server side check - e.g.
 * file too big for server settings), then other submissions will upload, but
 * erroneous one will stay in browser storage.
 * TODO need a way for user to save these their o/s filesystem and upload
 * them to VoxForge server some other way.
*/
Uploader.prototype._partialUpload = function (returnObj) {
    this._setNumberOfUploadedSubmissions(returnObj.filesUploaded);
    this._saveSubmissionsToList(returnObj.filesUploaded);
    
    this._displayMessageToUser(
        returnObj.workertype,
        this._getPartialUploadMessage(returnObj));  
}

Uploader.prototype._getPartialUploadMessage = function (returnObj) {
    var filesUploaded = returnObj.filesUploaded;    
    var filesNotUploaded = returnObj.filesNotUploaded;
    
    var m = "Partial Upload:\n\n" +
        this._getUploadedToServerMessage(returnObj) +
        "\n========================\n" +
        this._getSavedToBrowserStorageMessage(returnObj) ;
        
    if (returnObj.err) {
        m = m + "\n========================\n";
        m = m + "\n\nserver error message: " + returnObj.err;
    }

    return m;        
}

/*
 * Display message to user after recording has ended (i.e. user has pressed stop)
 */
Uploader.prototype._displayMessageToUser = function (workertype, m) {
    console.info(workertype + ": " + m);
    Promise.all(promise_list) // wait for stop click before displaying alert (if user recording)
    .then(function() {
        window.alert(m);
    })
    .catch((err) => { console.log(err) });            
}

Uploader.prototype._validateAndLogWorkerType = function (returnObj) {
    var m;
    
    if (returnObj.workertype == "serviceworker") {
        m = this.alert_message.serviceworker;
    } else if (returnObj.workertype == "webworker") {
        m = this.alert_message.webworker;
    } else {
        m = this.alert_message.workernotfound;
    }
    
    console.log(m + ": " + returnObj.status);
}

Uploader.prototype._getDate = function () {
    if (!Date.now) { // UTC timestamp in milliseconds;
        Date.now = function() { return new Date().getTime(); }
    }
    return Date.now();
}

/**
* collect all recorded audio into an array (audioArray) then calls function 
* that calls web worker that actually creates the zip file for download
* to VoxForge server
*/
Uploader.prototype.upload = function ( prompts,
                                       profile,
                                       debug,
                                       speechSubmissionAppVersion,
                                       allClips,
                                       language,
                                       debugChecked )
{
    var self = this;
    
    this.prompts = prompts;
    this.profile = profile;    
    this.debug = debug;
    this.speechSubmissionAppVersion = speechSubmissionAppVersion;      
    this.allClips = allClips;
    this.language = language;
    this.debugChecked = debugChecked;
      
    return new Promise(function (resolve, reject) {
      
        self._processAudio()
        .then(self._callWorker2createZipFile.bind(self))
        .then(self._uploadZippedSubmission.bind(self))
        .then(resolve) // resolve needs to be passed as a reference... therefore no parms
        .catch(function (err) {
            console.log(err.message);
            console.log(err.stack);
        });
        
    }); // Promise
}

/** 
* worker Processing - depending on browser support, use service worker and 
* background sync to upload submission, if not available, use a web
* worker that uploads in background; or perform asynchronous upload
* if neither is supported.
*/
Uploader.prototype._uploadZippedSubmission = function () {
    var self = this;


  // #######################################################################

  return new Promise(function (resolve, reject) {

      if (typeof navigator.serviceWorker !== 'undefined') { 
          navigator.serviceWorker.ready
          .then(function(swRegistration) { // service workers supported
            if (typeof swRegistration.sync !== 'undefined') { 
                self._serviceWorkerUpload(swRegistration);  // background sync supported
            } else { 
                console.warn('service worker does not support background ' +
                    'sync... using web worker');
                self._webWorkerUpload(); // background sync not supported
            }
          })
          .catch((err) => { console.log(err) });
      } else { // service workers not supported
        if( !! window.Worker ) { // web workers supported
            self._webWorkerUpload();
        } else { // should never get here...
            self._asyncMainThreadUpload.call(self); // to use self in called function context
        }
      }
      resolve("uploadZippedSubmission");

    }); // Promise

} // uploadZippedSubmission

/** 
* send message to service worker to start submission upload.
*
* supposed continue to try to upload even if no Internet, until connection
* restablished, and if successful, remove uploaded submission from
* browser storage, but this does not seem to work in Windows or Linux, 
* only works with Android
*/
Uploader.prototype._serviceWorkerUpload = function(swRegistration) {
    // for processing of return values from service worker, see 
    // service worker event above (i.e. navigator.serviceWorker.addEventListener... )
    swRegistration.sync.register('voxforgeSync')
    .then(
        function() {
          console.info('service worker background sync event called - ' +
            'submission will be uploaded shortly');
         }, function() {
          console.error('service worker background sync failed, will retry later');
    })
    .catch((err) => { console.log(err) });
}

/** 
* send message to web worker to upload submission.  If fails, submission
* stays in InnoDB until next time user makes submission, and then new
* submission and any saved submissions will be uploaded, and removed
* from browser storage after successful upload
*/
Uploader.prototype._webWorkerUpload = function() {
    this.upload_worker.postMessage({
        command: 'upload',
        uploadURL: uploadURL, // global variable
    });
}

/** 
* upload submission from main thread, asynchronously...
* TODO is this even required???
* might be useful to allow user to upload manually...
*/
Uploader.prototype._asyncMainThreadUpload = function() {
    // TODO make sure not deadlock with service/web workers...
    // TODO: should try web workers first...
    // TODO localize in Read.md page...
    console.info('submission uploaded (in main thread) asynchronously ' +
        'to VoxForge server');

    processSavedSubmissions()
    .then(function(result) {
        console.info('async upload message: ' + result);
        window.alert( "the following submissions were successfully uploaded " +
            "using async procedure: " + result );   
    })
    .catch(function(err) {
      console.error('async upload message: ' + err);
    });
}

/**
* call web worker to create zip file and upload to VoxForge server
*/
Uploader.prototype._callWorker2createZipFile = function (audioArray) {
    var self = this;
    
    this._captureDebugValues();
    this._tellWorkerToZipFile(audioArray);
    
    return this._processReplyFromZipWorker(audioArray);
}

Uploader.prototype._captureDebugValues = function () {
    if ( this.debugChecked ) {
      this.debug.setValues( 'prompts', this.prompts.getDebugValues() );
    } else {
      this.debug.clearValues('prompts');
    }
}

// need to copy to blobs here (rather than in web worker) because if pass 
// them as references to ZipWorker, they will be overwritten when page refreshes
// and not be accessible within web worker
Uploader.prototype._tellWorkerToZipFile = function (audioArray) {
    var self = this;
    
    self.zip_worker.postMessage({
        command: 'zipAndSave',

        speechSubmissionAppVersion: self.speechSubmissionAppVersion,
        temp_submission_name: self.profile.getTempSubmissionName(),
        short_submission_name: self.profile.getShortSubmissionName(),
        username: self.profile.getUserName(),
        language: self.language,
        suffix: self.profile.getSuffix(),

        readme_blob: new Blob(self.profile.toArray(), {type: "text/plain;charset=utf-8"}),
        prompts_blob: new Blob(self.prompts.toArray(), {type: "text/plain;charset=utf-8"}),
        license_blob: new Blob(self.profile.licensetoArray(), {type: "text/plain;charset=utf-8"}),
        profile_json_blob: new Blob([self.profile.toJsonString()], {type: "text/plain;charset=utf-8"}),
        prompts_json_blob: new Blob([self.prompts.toJsonString()], {type: "text/plain;charset=utf-8"}),
        audio: audioArray,
        debug_json_blob: new Blob([self.debug.toJsonString()], {type: "text/plain;charset=utf-8"}),
    });

}

/**
* Handler for messages coming from zip_worker web worker
*/
Uploader.prototype._processReplyFromZipWorker = function (audioArray) {
    var self = this;
    
    return new Promise(function (resolve, reject) {

        self.zip_worker.onmessage = function (event) {
            self._logSubmissionUpload();

            if (event.data.status === "savedInBrowserStorage") {
                console.info('webworker says: savedInBrowserStorage ' +
                    '(zip file creation and save completed)');
                resolve('savedInBrowserStorage');
            } else {
                var m = 'webworker says: zip error: ' + event.data.status;
                console.error(m);
                reject(m);
            }
        }

    }); // Promise
}

Uploader.prototype._logSubmissionUpload = function () {
    localStorage.setItem('timeOfLastSubmission', Date.now());
    localStorage.setItem('numberOfSubmissions', this.getNumberOfSubmissions() + 1);
}

/**
* recursive function that loops over audio clips and asynchronously
* loads them into audioArray.  This can cause some timing issues if
* there are many audio files... therefore only reset user facing display
* after all text and audio is sent to web worker for background processing
*
* uses xhr internally to collect read audio samples from shadow DOM
*/
Uploader.prototype._processAudio = function () {
    var self = this;
    var audioArray = [];
    var clipIndex = 0;

    
    return new Promise(function (resolve, reject) {
        
        function _audioArrayLoop(audioArray, clipIndex) {
            var clip = self.allClips[clipIndex];
            clip.style.display = 'None'; // remove clip from display as it is being processed
            var audioBlobUrl = clip.querySelector('audio').src;

            var prompt = clip.querySelector('prompt').innerText;
            self.prompts.addToPromptsRecorded(prompt);
            var prompt_id = prompt.split(/(\s+)/).shift();

                        
            function _onload(e) {
                if (this.status == 200) {
                  var blob = this.response;
                  // add current audio blob to zip file in browser memory
                  audioArray.push ({
                      filename: prompt_id + '.wav', 
                      audioBlob: blob
                  });
                  clipIndex += 1;
                  if (clipIndex < self.allClips.length) {
                    _audioArrayLoop(audioArray, clipIndex);
                  } else {
                    // must be called here because ajax is asynchronous
                    // Q1: why doesnt createZipFile get called many times as the call stack unrolls???
                    // ... because status no longer status == 200???

                    resolve(audioArray); // audioArray passed as parameter to next function in call chain
                  }
                }
            }

            function _reject() {
                reject("error processing audio from DOM");
            };

            // Ajax is asynchronous - once the request is sent script will 
            // continue executing without waiting for the response.
            var xhr = new XMLHttpRequest();
            // get blob from browser memory; 
            xhr.open('GET', audioBlobUrl, true);
            xhr.responseType = 'blob';
            xhr.onload = _onload;
            xhr.onerror = _reject;
            xhr.send();
        } // audioArrayLoop

    _audioArrayLoop(audioArray, clipIndex);
    
    }); // Promise
  
};// processAudio

/**
* localStorage stores everything as a string
*/
Uploader.prototype._getNumberOfUploadedSubmissions = function () {
  return parseInt( localStorage.getItem('numberOfUploadedSubmissions') || 0);
}

/**
* localStorage stores everything as a string
*/
Uploader.prototype.getNumberOfSubmissions = function () {
  return parseInt( localStorage.getItem('numberOfSubmissions') || 0);
}

/**
* use time since last submission to determine if user should be
* asked to update recording location information
*/
Uploader.prototype.timeSinceLastSubmission = function () {
    if (this._minutesSinceLastSubmission() > this.maxMinutesSinceLastSubmission) {
        return true;
    } else {
        return false;
    }
}

Uploader.prototype._minutesSinceLastSubmission = function () {
    var timeOfLastSubmission = localStorage.getItem('timeOfLastSubmission');
    if ( timeOfLastSubmission ) {
      var millis = Date.now() - timeOfLastSubmission;
      var mins = (millis / 1000) / 60;
      return Math.round(mins);
    } else {
      return 0;
    }
}

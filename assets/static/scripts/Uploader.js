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

function Uploader(parms, alert_message) {
    this.maxMinutesSinceLastSubmission = parms.maxMinutesSinceLastSubmission;
    this.alert_message = alert_message;
    this.uploadedSubmissions = localforage.createInstance({
      name: "uploadedSubmissions"
    });
    
    this._setUpWorkers();
}

Uploader.prototype._setUpWorkers = function() {
    if ('serviceWorker' in navigator) {
        window.addEventListener(
            'load',
            this._registerServiceWorker );
    }

    this.zip_worker = new Worker('/assets/static/scripts/uploader/ZipWorker.js');
    this.upload_worker = new Worker('/assets/static/scripts/uploader/UploadWorker.js');

    this._onPageUnloadKillBackgroundWorkerThreads();    
}

/**
* if page reloaded, kill background worker threads before page reload
* to prevent zombie worker threads in FireFox
*/
Uploader.prototype._onPageUnloadKillBackgroundWorkerThreads = function() {
    var self = this;
    
    $( window ).unload(function() {
        self.zip_worker.terminate();
        self.upload_worker.terminate();
    });
}

Uploader.prototype._registerServiceWorker = function() {
    const swUrl = '/voxforge_sw.js?uploadURL=' + encodeURIComponent(uploadURL);
    navigator.serviceWorker.register(swUrl)
    .then(
        function(reg) {
          console.log('ServiceWorker registration successful with scope: ', reg.scope);
        }, function(err) {
          console.warn('ServiceWorker registration failed: ', err);
          window.alert('Error: no SSL certificate installed on device - VoxForge uploads will fail silently');
        })
    .catch(function(err) {
        console.log(err)
    });
}

/**
* ### METHODS ##############################################
*/
/**
* set up worker event handlers, both (service worker and web worker)
* use the same function for processing uploads
*/
Uploader.prototype.init = function() {
    var self = this;

// TODO replace comments with calls to functions of the same name
    // web worker
    self.upload_worker.onmessage =
        self._workerEventMessageHandler.bind(self);

    // service worker
    navigator.serviceWorker.addEventListener(
        'message',
        self._workerEventMessageHandler.bind(self));
}

/** 
* process messages from service worker or web worker
*
* create classMapping map to link string to Class declarations, so can
* dynamically call correct message subclass based on return message from
* SavedSubmission class.
* (see: //see: https://stackoverflow.com/questions/34655616/create-an-instance-of-a-class-in-es6-with-a-dynamic-name)
*/
Uploader.prototype._workerEventMessageHandler = function(event) {
    var self = this;
      
    var returnObj = event.data;
    this._logWorkerType(returnObj);

    // children of UploadMessage parent class
    const classMapping = {
        'AllUploaded' : AllUploaded,
        'NoneUploaded' : NoneUploaded,
        'PartialUpload' : PartialUpload,
    }

    // call subclass based on content of returnObj.status
    new classMapping[returnObj.status](
            returnObj,
            this.alert_message,
            this.uploadedSubmissions);
}

Uploader.prototype._logWorkerType = function(returnObj) {
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

/**
* collect all recorded audio into an array (audioArray) then call function 
* that calls web worker that actually creates the zip file for download
* to VoxForge server (by another worker...)
*/
Uploader.prototype.upload = function(
    prompts,
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

    if ( this.allClips.length != this.prompts.getPromptCount() ) {
        console.err( "number of audio recordings (" +
            this.allClips.length +
            ") not equal to number of prompt files (" +
            this.prompts.getPromptCount() + ")" );
    }
      
    return new Promise(function(resolve, reject) {
      
        self._processAudio()
        .then(self._callWorker2createZipFile.bind(self))
        .then(self._uploadZippedSubmission.bind(self))
        .then(resolve) // resolve needs to be passed as a reference... therefore no parms
        .catch(function(err) {
            console.log(err.message);
            console.log(err.stack);
        });
        
    }); // Promise
}

/**
* function that loops over audio clips and asynchronously
* loads them into audioArray.  This can cause some timing issues if
* there are many audio files... therefore only reset user facing display
* after all text and audio is sent to web worker for background processing
*
* uses xhr internally to collect read audio samples from shadow DOM
*/
Uploader.prototype._processAudio = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        self._setUpCallbackFunctions(resolve, reject);
        self._addAllClipsToAudioArray();
    });
  
};

/*
* setup callback functions in Promise context
*/
Uploader.prototype._setUpCallbackFunctions = function(resolve, reject) {
    this.lastAudioClipFinished = function(audioArray) {
        resolve(audioArray);
    };           
    this.onError = function() {
        reject("error processing audio from DOM");
    };
}

/*
 * TODO: in test mode with only 3 prompts, if second prompt is really long, its
 * gets dropped and only shorter first and last recordings get saved to zip
 * file and uploaded to server; difficult to debug because any breakpoint gives
 * script enough time to process the longer second file, so everything looks OK...
 * 
 */
Uploader.prototype._addAllClipsToAudioArray = function() {
    var self = this;
    this.audioArray = [];

    this.allClips.forEach(function(clip, clipIndex, allClips) {
        self._hideClip(clip);
        var lastClip = clipIndex >= (allClips.length -1);

        self._convertAudioClipToBlob_and_AddToAudioArray(
            clip,
            lastClip);
    });
}

// hide clip from display as it is being processed
Uploader.prototype._hideClip = function(clip) {
    clip.style.display = 'None'; 
}

// Ajax is asynchronous - once the request is sent script will 
// continue executing without waiting for the response.

// TODO should use promise syntax to resolve when all audio has been added
// to audioArray!!!!!!
Uploader.prototype._convertAudioClipToBlob_and_AddToAudioArray = function(clip, lastClip) {
    var self = this;

    var filename = this._extractPromptIDfromClip.call(self, clip) + '.wav';   

    var xhr = new XMLHttpRequest();
    xhr.open('GET', this._getAudioURL(clip), true); // get blob from browser memory; 
    xhr.responseType = 'blob';
    xhr.onload =  function() {
        if (this.status != 200) { return } // request failed; skip

        self._addClipToAudioArray.call(self, filename, this.response);

        // because each call is async, this approach does not take into account
        // the case where the previous audio file
        // is really long and has not finished being read....
        if ( lastClip )  {
            self.lastAudioClipFinished.call(self, self.audioArray);
        }
    };
    xhr.onerror = self.onError;
    xhr.send();
}

// TODO this should be in view?    
Uploader.prototype._getAudioURL = function(clip) {
    return clip.querySelector('audio').src; 
}

Uploader.prototype._extractPromptIDfromClip = function(clip) {
    var prompt = this._extractPromptFromClip(clip);
    this.prompts.addToPromptsRecorded(prompt);
          
    return prompt.split(/(\s+)/).shift();
}

// TODO this should be in view?    
Uploader.prototype._extractPromptFromClip = function(clip) {
    return clip.querySelector('prompt').innerText;
}

Uploader.prototype._addClipToAudioArray = function(filename, blob) {
    this.audioArray.push ({
        filename: filename, 
        audioBlob: blob,
    });
}

/**
* localStorage stores everything as a string
*/
Uploader.prototype.getNumberOfSubmissions = function() {
  return parseInt( localStorage.getItem('numberOfSubmissions') || 0);
}

/**
* use time since last submission to determine if user should be
* asked to update recording location information
*/
Uploader.prototype.timeSinceLastSubmission = function() {
    if (this._minutesSinceLastSubmission() > this.maxMinutesSinceLastSubmission) {
        return true;
    } else {
        return false;
    }
}

Uploader.prototype._minutesSinceLastSubmission = function() {
    var timeOfLastSubmission = localStorage.getItem('timeOfLastSubmission');
    if ( timeOfLastSubmission ) {
      var millis = Date.now() - timeOfLastSubmission;
      var mins = (millis / 1000) / 60;
      return Math.round(mins);
    } else {
      return 0;
    }
}

/**
* call web worker to create zip file and upload to VoxForge server
*/
Uploader.prototype._callWorker2createZipFile = function(audioArray) {
    var self = this;
    
    this._captureDebugValues();
    this._tellWorkerToZipFile(audioArray);
    
    return this._processReplyFromZipWorker(audioArray);
}

Uploader.prototype._captureDebugValues = function() {
    if ( this.debugChecked ) {
      this.debug.setValues( 'prompts', this.prompts.getDebugValues() );
    } else {
      this.debug.clearValues('prompts');
    }
}

// need to copy to blobs here (rather than in web worker) because if pass 
// them as references to ZipWorker, they will be overwritten when page refreshes
// and not be accessible within web worker
Uploader.prototype._tellWorkerToZipFile = function(audioArray) {
    var zip_worker_parms = {};
    
    zip_worker_parms.command = 'zipAndSave';    
    this._mergeProperties(zip_worker_parms, this._zipworkerProperties());
    this._mergeProperties(zip_worker_parms, this._zipworkerBlobProperties());
    zip_worker_parms.audio = audioArray;
    
    this.zip_worker.postMessage(zip_worker_parms);
}

Uploader.prototype._zipworkerProperties = function() {
    return {
        speechSubmissionAppVersion: this.speechSubmissionAppVersion,
        temp_submission_name: this.profile.getTempSubmissionName(),
        short_submission_name: this.profile.getShortSubmissionName(),
        username: this.profile.getUserName(),
        language: this.language,
        suffix: this.profile.getSuffix(),
    }
}

// TODO should blob creation be done inside ZipWorker?
Uploader.prototype._zipworkerBlobProperties = function() {
    return {
        readme_blob: new Blob(this.profile.toArray(), {type: "text/plain;charset=utf-8"}),
        prompts_blob: new Blob(this.prompts.toArray(), {type: "text/plain;charset=utf-8"}),
        license_blob: new Blob(this.profile.licensetoArray(), {type: "text/plain;charset=utf-8"}),
        profile_json_blob: new Blob([this.profile.toJsonString()], {type: "text/plain;charset=utf-8"}),
        prompts_json_blob: new Blob([this.prompts.toJsonString()], {type: "text/plain;charset=utf-8"}),
        debug_json_blob: new Blob([this.debug.toJsonString()], {type: "text/plain;charset=utf-8"}),
    }
}

Uploader.prototype._mergeProperties = function(obj1, obj2) {
    for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
}

/**
* Handler for messages coming from zip_worker web worker
*/
Uploader.prototype._processReplyFromZipWorker = function(audioArray) {
    var self = this;

    return new Promise(function(resolve, reject) {

        self.zip_worker.onmessage = function(event) {
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

/** 
* worker Processing - depending on browser support, use service worker and 
* background sync to upload submission, if not available, use a web
* worker that uploads in background; or perform asynchronous upload
* if neither is supported.
*/
Uploader.prototype._uploadZippedSubmission = function() {
    var self = this;

    return new Promise(function(resolve, reject) {

        if (self._serviceWorkerSupported()) {
            self._tryBackgroundSync();
        } else { // service workers not supported
            if( self._webworkerSupported() ) {
                self._webWorkerUpload();
            } else { // should never get here...
                self._asyncMainThreadUpload.call(self); 
            }
        }
        resolve("uploadZippedSubmission");

    }); // Promise

} 

Uploader.prototype._serviceWorkerSupported = function() {
    return typeof navigator.serviceWorker !== 'undefined';
}

Uploader.prototype._webworkerSupported = function() {
    return !! window.Worker;
}

Uploader.prototype._tryBackgroundSync = function() {
    var self = this;
        
    navigator.serviceWorker.ready
    .then(function(swRegistration) {
        if ( self._backgroundSyncSupported(swRegistration) ) { 
            self._serviceWorkerUpload(swRegistration);  
        } else { 
            console.warn('service worker does not support background ' +
                'sync... using web worker');
            self._webWorkerUpload(); // background sync not supported
        }
    })
    .catch(function(err) { console.log(err) });      
}

Uploader.prototype._backgroundSyncSupported = function(swRegistration) {
    return typeof swRegistration.sync !== 'undefined';
}

/** 
* send message to service worker to start submission upload.
*
* supposed continue to try to upload even if no Internet, until connection
* restablished, and if successful, remove uploaded submission from
* browser storage, but this does not seem to work in Windows or Linux, 
* only works with Android
*
* for processing of return values from service worker, see 
* service worker event above (i.e. navigator.serviceWorker.addEventListener... )
*/
Uploader.prototype._serviceWorkerUpload = function(swRegistration) {
    swRegistration.sync.register('voxforgeSync')
    .then(
        function() {
          console.info('service worker background sync event called - ' +
            'submission will be uploaded shortly');
         }, function() {
          console.error('service worker background sync failed, will retry later');
    })
    .catch(function(err) { console.log(err) });   
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

Uploader.prototype._logSubmissionUpload = function() {
    localStorage.setItem('timeOfLastSubmission', Date.now());
    localStorage.setItem('numberOfSubmissions', this.getNumberOfSubmissions() + 1);
}

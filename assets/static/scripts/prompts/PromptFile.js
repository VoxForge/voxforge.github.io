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

var PromptFile = (function() { // code to keep helper classes inside Uploader namespace //

/** 
* get prompts file for given language from server; used cached version of 
* prompt file if no network connection...
*/
function PromptFile(language, prompt_list_files, appversion) {
    this.language = language;
    this.prompt_list_files = prompt_list_files;
    this.appversion = appversion;
    this.previousPlf_id = "not defined";

    this._identifyPromptFileToSelect();
    this._validateReadmd();
    this._initializeHelperClass();      
}

PromptFile.prototype._identifyPromptFileToSelect = function () {
    this.prompt_file_index =
        Math.floor((Math.random() * this.prompt_list_files.length)); // zero indexed
    this.plf = this.prompt_list_files[this.prompt_file_index];
    this.prompt_file_name = this.plf['file_location'];
}

PromptFile.prototype._validateReadmd = function () {
    var readmd = new Readmd(
        this.prompt_list_files,
        this.language,
        this.plf,
        this.prompt_file_index,
        this.previousPlf_id);
    readmd.validate();
}

PromptFile.prototype._initializeHelperClass = function () {
    this.browserStorage = new BrowserStorage(
        this.plf,
        this.prompt_file_index,
        this.language,
        this.appversion,
        this._getLocalizedPromptFilename);
}

/**
* ### METHODS ##############################################
*/

/*
 * I. prompt file exists in browser storage
 * 
 * 1. for reponsiveness
 * Immediately give user the prompt file that is stored in browser storage,
 *
 * 2. in background
 * a. if network up
 * perform an async replace of browser prompt file with random prompt file
 * from the server.
 *
 * b. if network down
 * do not update update browser storage prompt file.
 * 
 * II. no prompt file in browser storage
 *
 * a. first time setup
 * user strarting app for first time - therefore get random prompt file from
 * the server.
 *
 * b. if network down
 * use service worker cache default prompt file (id == 001)
 * 
 */
PromptFile.prototype.get = function () {
    var self = this;

    /** 
    * Async call that returns true if no prompt file stored in user's browser
    * storage.
    *
    * Each language has its own prefixed prompt file, so counting keys
    * tells you if prompt file was already locally cached in promptCache 
    * for that language
    */
    function isInBrowserStorage() {  
        var promise =
            self.browserStorage.length()            
            .then(function(length) {
                return (length > 0) // true or false value
            })
            .catch(function(err) {
                return false; // no promptFile in browser storage exists
            });
            
        return promise;
    }

    return new Promise(function(resolve, reject) {

        isInBrowserStorage()
        .then(function(foundInBrowserStorage) {
            if ( foundInBrowserStorage ) {
                self._getFromBrowserStorage.call(self)
                .then(function(promptList) {
                    resolve(promptList);
                });             
            } else { 
                self._getFromServer.call(self)
                .then(function(promptList) {
                    resolve(promptList);
                })
                .catch(function(err) { // no network connection
                    self._getDefaultFromServiceWorkerCache.call(self);
                });                
            }
        })


    }); // promise
}

/**
  1. use localstorage prompts to start with,
  2. then asynchronously try to download updated prompt file...

  this prevents hang of app when user records offline (when using a 
  promise chain) or timing issues with no promise chain when app starts
  up offline and prompts file 'get' is hanging...

 * doing prompt stack update at beginning means that the prompt stack 
 * is always one behind the call to VoxForge server... 
 * why? for reponsiveness when user is recording offline.  
 * If were to try to access server while offline,
 * there would be a delay with user being able to 
 * start recording - $.get hangs trying to access server while
 * offline, so give the user a stack of prompts immediately (using current
 * prompt list file), then asynchronously try to access server to update current
 * prompt file stored in browser.
 * if no internet access, then user using stored prompt file, 
 * if there is Internet access, then user will get updated 
 * random prompts on subsequent submission.
 */
PromptFile.prototype._getFromBrowserStorage = function() {
    var self = this;

    /*
     * User is using app with cached prompt file; try to get a new one
     * from server asynchronously in background
     */
    function backgroundUpdateOfPromptsFileFromServer() {
        console.log("updating saved prompts file with new one from VoxForge server");
        self._getFromServer(); // discard returned jsonObject
    }

    return new Promise(function(resolve, reject) {
        self.browserStorage.getItem(self._getLocalizedPromptFilename() )        
        .then( function(jsonObject) {
            self.previousPlf_id = jsonObject.id;
            backgroundUpdateOfPromptsFileFromServer(); // discard reply
            resolve(jsonObject.list);
        })
        .catch(function(err) {
            console.error(
                "cannot get saved PromptList file from browser: " +
                err);
            // TODO should we try to get promptfile from server?
        });        

    });
}

/**
 * No good way to detect if online or offline.
 *
 * Therefore, first try to get a random prompts file from server (i.e. might
 * not be prompt_file_index == 0).
 *
 * If fail, then fall back and use service worker cached prompt file (which
 * should work since it downloaded the entire app in the first place...)
 * 
 * Failure in this case would be where prompt file is described in read.md
 * but missing from server; or where user is offline and erroneously deletes
 * the prompt cache from their browser, but leaves service worker cache untouched.

 * This way we can have very large prompt sets, but user can download a randomly
 * selected small section of the total prompt set.
 * 
 */
PromptFile.prototype._getFromServer = function() {
    var self = this;
        
    return new Promise(function(resolve, reject) {
   
        $.get(self.prompt_file_name)
        .then( self.browserStorage.save.bind(self.browserStorage) )        
        .then( function(promptList) {
            resolve(promptList);
        })
        .fail(function(err) {
            reject(err);
        });        

    }); 
}

/*
 * local_prompt_file_name - name of prompt file when stored in user's browser
 * storage
 */
PromptFile.prototype._getLocalizedPromptFilename = function() {
    return this.language + '_prompt_file';
}

/*
 * Get Default Prompt File from service worker cache.
 *
 * (service worker caches the first prompt file (default prompt file) shown
 * in prompt_list_files.)
*/
PromptFile.prototype._getDefaultFromServiceWorkerCache = function() {
    var self = this;
    
    /*
     * default prompt file is the first prompt file in a language configuration -
     * it gets automatically cached in browser storage by the service worker.
     */
    function currentPromptFileNotDefault() {
        return self.prompt_file_index > 0;
    }
    
    /*
     * service worker caches the first prompt file (index=0) in list in
     * prompt_list_files in read.md
     */
    function resetPromptFileIndex2Default() {
        self.prompt_file_index = 0;
        self.plf = self.prompt_list_files[self.prompt_file_index];
        self.prompt_file_name = self.plf['file_location'];
        
        console.log("using service worker cached prompt file id: " +
            self.prompt_list_files[self.prompt_file_index].id);
    }  

    function logNoServiceWorkerCache() {
        var m = "Error: cannot find prompts file on VoxForge server: " +
                self.prompt_file_name + 
                "or in service worker cache....\n " +
                "retry later.";
        console.error(m);
        return m; 
    }

    if ( currentPromptFileNotDefault() ) {
        resetPromptFileIndex2Default();
        return this._getFromServer();
    } else { // self.prompt_file_index = 0 and does not exist... user deleted?
        logNoServiceWorkerCache();
    }   
}

// #############################################################################

/*
 * Supporting classes
 */

/** 
* save the prompt file as a JSON object in user's browser's Local Storage
*/
function BrowserStorage(
    plf,
    prompt_file_index,
    language,
    appversion,
    getLocalizedPromptFilename)
{
    this.plf = plf;
    this.prompt_file_index = prompt_file_index;
    this.language = language;
    this.appversion = appversion;
    this.getLocalizedPromptFilename = getLocalizedPromptFilename;

    this.promptCache = localforage.createInstance({
        name: this.language + "_promptCache"
    });       
}

BrowserStorage.prototype.save = function(prompt_data) {
    var self = this;

    var promptList = this._convertToArray(prompt_data);
    this._confirmPromptListLength(promptList);
        
    var jsonObject = this._createJsonPromptObject(promptList);
    this._saveObject2PromptCache(jsonObject);

    return promptList; // parameter for next in chain
}

BrowserStorage.prototype.getItem = function(item) {
    return this.promptCache.getItem( item );
}

/*
 * Each language has its own prefixed prompt file, so counting keys
 * tells you if prompt file was already locally cached in promptCache 
 * for that language
 */
BrowserStorage.prototype.length = function() {
    return this.promptCache.length();
}

BrowserStorage.prototype._confirmPromptListLength = function(promptList) {
    if (this.plf.number_of_prompts !=  promptList.length) {
        console.warn(
            "number of prompts in prompt_list_files[" +
            this.prompt_file_index + "] = " + 
            this.plf.number_of_prompts + 
            " in read.md, not same as prompt file line counts for language: " + 
            this.language + "= " + promptList.length );
    }
}

/**
* split prompt file from server into an array and decide if it needs a 
* prompt ID added;
*
* see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
*/
BrowserStorage.prototype._convertToArray = function(prompt_data) {
    var self = this;
    
    function removeEmptyStrings(sentence) {
        return sentence.trim() != "";
    }

    function addPromptIdsToSentences(list) {
        return list.map(addPromptIdToSentence);
    }

    function addPromptIdToSentence(sentence, i) {
        function pad(num, size) {
            var s = num+"";
            while (s.length <= size) s = "0" + s;
            return s;
        }
        
        var prompt_id =
            self.plf.prefix +
            pad( i + self.plf.start, 5 );
            
        return prompt_id  + " " + sentence;
    }


    var sentences = prompt_data.split('\n');      
    var list = sentences.filter(removeEmptyStrings);
    if ( ! self.plf.contains_promptid ) {
        list = addPromptIdsToSentences(list);
    }

    return list;
}
BrowserStorage.prototype._createJsonPromptObject = function(promptList) {
    var jsonOnject = {};

    jsonOnject['language'] = this.language;
    jsonOnject['id'] = this.plf.id;
    jsonOnject['list'] = promptList;
    
    jsonOnject['speechSubmissionAppVersion'] = this.appversion;
    var date = new Date();  
    jsonOnject['timestamp'] = date.getTime(); // UTC timestamp in milliseconds;
    jsonOnject['timezoneOffset'] = date.getTimezoneOffset();
    
    return jsonOnject;
}

BrowserStorage.prototype._saveObject2PromptCache = function(jsonObject) {
    this.promptCache.setItem(
        this.getLocalizedPromptFilename(),
        jsonObject)
    .catch(function(err) {
        console.error('save of promptfile to localforage browser storage failed!', err);
        return;
    });
    console.info('saved promptfile to localforage browser storage: ' +
        this.getLocalizedPromptFilename() );
}

// #############################################################################
 
function Readmd(
    prompt_list_files,
    language,
    plf,
    prompt_file_index,
    previousPlf_id)
{
    this.prompt_list_files = prompt_list_files;
    this.language = language;
    this.plf = plf;
    this.prompt_file_index = prompt_file_index;
    this.previousPlf_id =  previousPlf_id;
    
    this.notDefined = "not defined in read.md for language: " + language;    
}

/**
* verify that read.md entries contain valid prompt related data;
* iterates through all prompt_list_files attributes defined in read.md files
*/
Readmd.prototype.validate = function () {
    var self = this;
    var num_prompts_calc = 0;

    this.prompt_list_files.forEach(
        this._checkForUndefinedAttributesInGivenPromptListEntry.bind(this));

    this._logPromptFileInformation();        
}

Readmd.prototype._checkForUndefinedAttributesInGivenPromptListEntry = 
    function (plf, i)
{
    this._checkForUndefinedAttributes(plf, i);
    
    if ( !  plf.contains_promptid ) {
        this._checkForUndefinedAttributesIfNoPromptId(plf, i);
    }
}

Readmd.prototype._checkForUndefinedAttributes = function (plf, i) {  
    if (typeof plf.id === 'undefined') {
        console.warn("prompt_list_files[" + i + "].id " + this.notDefined);
    }
    if (typeof plf.file_location === 'undefined') {
        console.warn("prompt_list_files[" + i + "].file_location " + this.notDefined);
    }
    if (typeof plf.number_of_prompts === 'undefined') {
        console.warn("prompt_list_files[" + i + "].number_of_prompts " + this.notDefined);
    }
    if (typeof plf.contains_promptid === 'undefined') {
        console.warn("prompt_list_files[" + i + "].contains_promptid " + this.notDefined);
    }    
}

// if prompt lines already have promptid, then don't need start or prefix
// fields in read.md front matter
Readmd.prototype._checkForUndefinedAttributesIfNoPromptId = function (plf, i) {
    if (typeof plf.start === 'undefined') {
        console.warn("prompt_list_files[" + i + "].start " + this.notDefined);
    }

    if (typeof plf.prefix === 'undefined') {
        console.warn("prompt_list_files[" + i + "].prefix " + this.notDefined);
    }
}

Readmd.prototype._logPromptFileInformation = function() {
    var m = this._addPromptIDToMessageifMissing();
// TODO previousPlf_id is "not defined" - fix!
    console.log("Using cached prompt file (id =" +
        this.previousPlf_id + 
        "); next prompt file id: " +
        this.plf.id + 
        " (prompt file array index: " +
        this.prompt_file_index + ") " +
        m);
}

Readmd.prototype._addPromptIDToMessageifMissing = function() {
    var m = "";
    
    if ( ! this.plf.contains_promptid ) {
        let end = this.plf.start + this.plf.number_of_prompts;
        m = "promptId start: " + this.plf.start +
            "; end: " + end;
    }

    return m;
}

// code to keep helper classes inside PromptFile namespace /////////////////////
return PromptFile;
}());

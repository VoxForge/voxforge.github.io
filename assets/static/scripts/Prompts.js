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
function Prompts(parms,
                 pageVariables)
{
    this.max_num_prompts = parms.num_prompts_to_trigger_upload;
    this.list = []; // list of prompts to be recorded by user; initialized in convertPromptDataToArray
    this.previous_max_num_prompts = 0; // to decide what to do when use changes max number of prompts
    this.index = 0; // pointer to position in prompt list array
    this.prompt_count = 0; // number of prompts user read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.audio_characteristics = {}; // hash of audio characteritics of recorded audio; indexed by promptID
    this.prompt_stack = []; // stack; makes it easier to add deleted elements for re-record
    this.current_promptLine = null; // need to keep track of current prompt since no longer tracking index

    this.language = pageVariables.language;

    this.promptCache = localforage.createInstance({
        name: this.language + "_promptCache"
    });

    this.prompt_list_files = pageVariables.prompt_list_files;
    
    this.prompt_file_index =
        Math.floor((Math.random() * this.prompt_list_files.length)); // zero indexed
    this.plf = this.prompt_list_files[this.prompt_file_index];

    this.prompt_file_name = this.plf['file_location'];         
}

/**
* ### METHODS ##############################################
*/

/** 
* get prompts file for given language from server; used cached version of 
* prompt file if no network connection...
*/
Prompts.prototype.init = function () {
    var self = this;

    this._validateParmsAndLog();
    this._initializePrompts();
}

Prompts.prototype._validateParmsAndLog = function () {
    //this.validate_Readmd_file();
    var readmd = new Readmd(
        this.prompt_list_files,
        this.language);
    readmd.validate();
     
    this._logPromptFileInformation();
}


Prompts.prototype._initializePrompts = async function () {
    var self = this;

    this._isBrowserStorageEmpty()
    .then(function(browserStorageEmpty) {
        if ( browserStorageEmpty ) {
            self._getPromptsFileFromServerOrServiceWorkerCache.call(self);
        } else {
            self._getPromptsFileFromBrowserStorage.call(self);
        }
    });
}

/** 
* Note: each language has its own prefixed prompt file, so counting keys
* tells you if prompt file was already locally cached in promptCache 
* for that language
*/
Prompts.prototype._isBrowserStorageEmpty = function () {  
    var promise =
        this.promptCache.length()
        .then(function(length) {
            return (length == 0) // true or false value
        })
        .catch(function(err) {
            return true; // no browser storage file exists
        });
        
    return promise;
}

/**
No good way to detect if online or offline. Therefore, first try to 
get a random prompts file from server (i.e. might not be 
prompt_file_index == 0).  If fail, then fall back and use
service worker cached prompt file (which should work since it downloaded
the entire app in the first place...)
Failure in this case would be where prompt file is described in read.md
but missing from server; or where user is offline and erroneously deletes
the prompt cache from their browser, but leaves service worker cache untouched.

This way we can have very large prompt sets, but user only needs to 
download a small portion
*/
Prompts.prototype._getPromptsFileFromServerOrServiceWorkerCache =
    async function()
{
    var self = this;

    this._getPromptsFileFromServer()
    .then( self._copyPromptData2Stack.bind(self) );   
}

/*
 * returns a jQuery XHR object ("jqXHR")
 * does not have a catch, but uses fail to catch errors...
 */
Prompts.prototype._getPromptsFileFromServer = function() {
    var self = this;
    
    var jqXHR =
        $.get(this.prompt_file_name)
        .fail(function(err) {
            console.log(err); 
            self._getPromptsFileFromServiceWorkerCache.call(self);
        });
        
    return jqXHR;
}

Prompts.prototype._copyPromptData2Stack = function(prompt_data)
{
    this.list = this._convertPromptDataToArray(prompt_data);
    this._confirmPromptListLength();
    this._save2BrowserStorage();
      
    this.prompt_stack = this._initPromptStack(this.list);
}

/*
service worker caches the first prompt file (default prompt file) shown
in prompt_list_files.
so try get again with default prompt file
*/
Prompts.prototype._getPromptsFileFromServiceWorkerCache = function() {
    if ( this._notDefaultPromptFile() ) {
        this._resetPromptFileIndex2Default();
        this._getPromptsFileFromServerOrServiceWorkerCache();
    } else { // self.prompt_file_index = 0 and does not exist... user deleted?
        this._logNoServiceWorkerCache();
    }   
}

Prompts.prototype._notDefaultPromptFile = function() {
    return this.prompt_file_index > 0;
}

/*
 * service worker caches the first prompt file in list in prompt_list_files
 * in read.md
 */
Prompts.prototype._resetPromptFileIndex2Default = function() {
    this.prompt_file_index = 0;
    this.plf = this.prompt_list_files[this.prompt_file_index];
    this.prompt_file_name = this.plf['file_location'];
    
    console.log("using service worker cached prompt file id: " +
        this.prompt_list_files[this.prompt_file_index].id);
}  

Prompts.prototype._logNoServiceWorkerCache = function() {
    var m = "Error: cannot find prompts file on VoxForge server: " +
            this.prompt_file_name + 
            "or in service worker cache....\n " +
            "retry later.";
    console.error(m);
    return m; 
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
 * offlien, so give the user a stack of prompts (using current
 * prompt list file), then try to access server to update current
 * prompt file stored in browser.
 * if no internet access, then user using stored prompt file, 
 * if there is Internet access, then user will get updated 
 * random prompts on subsequent submission.
 */
Prompts.prototype._getPromptsFileFromBrowserStorage = function () {
    this._getPromptsThatUserCanUseNow();
    this._asyncUpdateOfPromptsFileFromServer();
}

Prompts.prototype._getPromptsThatUserCanUseNow = async function() {
    var self = this;
    
    this._getSavedPromptList()
    .then( self._extractPromptStackFromObj.bind(self) );    
}

Prompts.prototype._getSavedPromptList = function() {
    var promise =
        this.promptCache.getItem( this._getLocalizedPromptFilename() )
        .then(function(jsonOnject) {
            return(jsonOnject);
        })
        .catch(function(err) {
            console.err("cannot get saved PromptList file from browser: " +
            err);
        });  

    return promise;
}

/*
* get saved promptList file (from browser storage) and update
* prompt stack, so user can immediately start recording prompts.
* 
* doing prompt stack update here means that the prompt stack 
* is always one behind the call to VoxForge server...
* (see _getPromptsFileFromBrowserStorage comments)
*/
Prompts.prototype._extractPromptStackFromObj = function(jsonObject) {        
    this.prompt_stack = this._initPromptStack(jsonObject.list);
}

/*
 *check if can get random prompt file from server
 */
Prompts.prototype._asyncUpdateOfPromptsFileFromServer = async function () {
    var self = this;

    this._getPromptsFileFromServer()
    .then( self._savePromptData2BrowserStorage.bind(self) );    
}

Prompts.prototype._savePromptData2BrowserStorage = function(prompt_data) {
    this.list = this._convertPromptDataToArray(prompt_data);
    this._save2BrowserStorage();
    console.log("updating saved prompts file with new one from VoxForge server");
}


// TODO function not being called from anywhere???
/*
Prompts.prototype._logGetPromptFileFromServerFailed = function(
    err,
    prompt_file_name)
{
    var m = "cannot get updated prompts file from VoxForge server: " + 
        prompt_file_name + 
        "; device offline or has bad Internet connection, " + 
        "using browser storage prompts file\n " +
        "err = " + err;
    console.warn(m);
}
*/


// #############################################################################

/**
* initialize prompt stack with number of prompts chosen by user
*
* User's set of prompts to be read in contained in a stack, that way
* if a user wants to re-read a prompt, they delete it, and it gets
* placed in the stack and re-displayed to the user to record again.
*
* reading prompt list using the self.index and modulus to wrap
* around the prompt list array.
*
* Note: using unshift (rather than push) to keep prompt elements in order
*/
Prompts.prototype._initPromptStack = function(list) 
{
    var prompt_stack = [];
    var i = Math.floor((Math.random() * list.length));

    function nextPrompt() {
        i = i % (list.length -1);
        return list[i++];
    }

    function addPromptToFrontOfStack() {
        prompt_stack.unshift(nextPrompt());
    }

    var n = this.max_num_prompts;
    while (n--) addPromptToFrontOfStack();

    return prompt_stack;
}

Prompts.prototype._logPromptFileInformation = function() {
    var m = this._addPromptIDToMessageifMissing();

    console.log("prompt file id: " +
        this.plf.id + 
        " (prompt file array index: " +
        this.prompt_file_index + ") " +
        m);
}

Prompts.prototype._addPromptIDToMessageifMissing = function() {
    var m = "";
    
    if ( ! this.plf.contains_promptid ) {
        let end = this.plf.start + this.plf.number_of_prompts;
        m = "promptId start: " + this.plf.start +
            "; end: " + end;
    }

    return m;
}

/*
 * local_prompt_file_name - name of prompt file when stored in user's browser
 * storage
 */
Prompts.prototype._getLocalizedPromptFilename = function() {
    return this.language + '_prompt_file';
}

/** 
* save the prompt file as a JSON object in user's browser's Local Storage
*/
Prompts.prototype._save2BrowserStorage = function() {
    var jsonOnject = this._createJsonPromptObject(this.plf.id);
    this._saveObject2PromptCache(jsonOnject);
}

Prompts.prototype._createJsonPromptObject = function(id) {
    var jsonOnject = {};

    jsonOnject['language'] = this.language;
    jsonOnject['id'] = id;
    jsonOnject['list'] = this.list;

    return jsonOnject;
}

Prompts.prototype._saveObject2PromptCache = async function(jsonOnject) {
    var self = this;

    this.promptCache.setItem(
        self._getLocalizedPromptFilename.call(self),
        jsonOnject)
    .catch(function(err) {
        console.error('save of promptfile to localforage browser storage failed!', err);
        return;
    });
    console.info('saved promptfile to localforage browser storage: ' +
        self._getLocalizedPromptFilename() );
}

Prompts.prototype._confirmPromptListLength = function() {
    if (this.plf.number_of_prompts !=  this.list.length) {
        console.warn(
            "number of prompts in prompt_list_files[" +
            this.prompt_file_index + "] = " + 
            this.plf.number_of_prompts + 
            " in read.md, not same as prompt file line counts for language: " + 
            this.language + "= " + this.list.length );
    }
}

/**
* split prompt file from server into an array and decide if it needs a 
* prompt ID added;
*
* see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
*/
Prompts.prototype._convertPromptDataToArray = function(prompt_data) {
    function removeEmptyStrings(sentence) {
        return sentence.trim() != "";
    }

    var sentences = prompt_data.split('\n');      
    var list = sentences.filter(removeEmptyStrings);
    if ( ! this.plf.contains_promptid ) {
        list = this._addPromptIdsToSentences(list);
    }

    return list;
}

Prompts.prototype._addPromptIdsToSentences = function(list) {
    var self = this;
    return list.map(self._addPromptIdToSentence.bind(self));
}

Prompts.prototype._addPromptIdToSentence = function(sentence, i) {
    var prompt_id =
        this.plf.prefix +
        this._pad( i + this.plf.start, 5 );
        
    return prompt_id  + " " + sentence;
}

Prompts.prototype._pad = function (num, size) {
    var s = num+"";
    while (s.length <= size) s = "0" + s;
    return s;
}

/**
* reset prompt array and index after submission is completed
*/
Prompts.prototype.resetIndices = function () {
    this.prompt_count = 0; // number of prompts read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.audio_characteristics = {};

    this.prompt_stack = [];
    this.prompt_stack = this._initPromptStack(this.list);
}

/**
* get current prompt line from stack
*/
Prompts.prototype.getNextPrompt = function () {
    if (this.prompt_stack.length <= 0) {
      return null;
    }

    this.prompt_count++;
    this.current_promptLine = this.prompt_stack.pop();

    return this.current_promptLine;
}

/**
* add deleted prompt to stack and decrement prompt count 
*
* gets called in view class and called as soon as prompt delete is clicked
* but before Controller even registers the transition
*/
Prompts.prototype.movePrompt2Stack = function (promptLine) {
    this.prompt_stack.push(promptLine);

    this.prompt_count = this.prompt_count - 1;
}

/**
* get prompt id portion of current prompt line as determined by index.
*/
Prompts.prototype.getCurrentPromptLine = function () {
   return this.current_promptLine;
}

/**
* get prompt id portion of current prompt line as determined by index.
*/
Prompts.prototype.getPromptId = function () {
   return this._splitPromptLine(this.current_promptLine)[0];
}

/**
* get prompt portion of current prompt line as determined by index.
*/
Prompts.prototype.getPromptSentence = function () {
   return this._splitPromptLine(this.current_promptLine)[1];
}

/**
* helper function to return prompt id and prompt sentence in an array
*/
Prompts.prototype._splitPromptLine = function(promptLine) {
    var promptArray = promptLine.split(/(\s+)/); // create array
    var promptId = promptArray.shift(); // extract prompt id
    var promptSentence =  promptArray.join(""); // make string;

    return [promptId, promptSentence.trim()];
}

/**
* Convert prompt array to sorted (by prompt ID) prompt array
*
* prompts need to be sorted because recordings are displayed in reverse order 
* so that most recent one was displayed first (less scrolling for user
* to see most recent recording); and prompt deletion and re-recording 
* messes up ordering also...
*/
Prompts.prototype.toArray = function () {
    var temp_array = this.prompts_recorded.sort();
    // need to reverse array because recordings are displayed in reverse order 
    // so that most recent one was displayed first
    return temp_array;
}

/**
* Convert prompt array to sorted (by prompt ID) JSON string
*/
Prompts.prototype.toJsonString = function () {
    var self = this;
    var obj = {};    
    var arr = this.prompts_recorded.sort();

    arr.forEach(function(promptLine) {
        self._addPromptlineToObject(obj, promptLine);
    });

    return JSON.stringify(obj,null,"  ");
}

Prompts.prototype._addPromptlineToObject = function (obj, promptLine) {
    var prompt_id = this._extractPromptIdFromPromptLine(promptLine);
    var prompt_sentence = this._extractPromptSentencePromptLine(promptLine);

    obj[prompt_id] = prompt_sentence;
}

Prompts.prototype._extractPromptIdFromPromptLine = function (promptLine) {
    var prompt_line = promptLine.split(/\s+/);
    return prompt_line.shift(); // return first element
}

Prompts.prototype._extractPromptSentencePromptLine = function (promptLine) {
    var prompt_line = promptLine.split(/\s+/); // split string
    prompt_line.shift(); // remove first element
    // convert array back into string and remove trailing space
    return prompt_line.join(' ').replace(/\s+$/, ""); 
}

Prompts.prototype.addToPromptsRecorded = function (prompt) {
    this.prompts_recorded.push(prompt + '\n');
}

/**
* return debug values as obj
*/
Prompts.prototype.getDebugValues = function () {
    var self = this;
    var obj = {};    
    var arr = this.prompts_recorded.sort();

    arr.forEach(function(promptLine) {
        self._addPromptlineToDebugObject(obj, promptLine);
    });
    
    return obj;
}

Prompts.prototype._addPromptlineToDebugObject = function (obj, promptLine) {
    var prompt_id = this._extractPromptIdFromPromptLine(promptLine);
    var prompt_sentence = this._extractPromptSentencePromptLine(promptLine);

    obj[prompt_id] = {
        sentence : prompt_sentence, 
        audio: this.audio_characteristics[prompt_id],
    }
}

Prompts.prototype.setAudioCharacteristics = function (obj) {
    this.audio_characteristics[obj.prompt_id] = {
        no_trailing_silence : obj.no_trailing_silence,
        no_speech : obj.no_speech,
        clipping : obj.clipping,
        too_soft : obj.too_soft,
        gain : obj.gain,
        vad_run : obj.vad_run,
    };
}

/**
* removes debug properties from prompts
*/
Prompts.prototype.clearAudioCharacteristics = function () {
  this.audio_characteristics = {};
}

/**
* true when max number of prompts user wants to record is reached
*/
Prompts.prototype.lastone = function () {
    return this.prompt_count >= this.max_num_prompts;
}

Prompts.prototype.oneleft = function () {
    return this.prompt_count == 1;
}

Prompts.prototype.maxnumpromptsincreased = function () {
    return this.max_num_prompts >= this.previous_max_num_prompts;
}

/**
* e.g. user set max prompt to 30, records 25, then changes max prompts to 20
*/
Prompts.prototype.recordedmorethancurrentmaxprompts = function () {
    return this.prompt_count >= this.max_num_prompts;
}

Prompts.prototype.atmid = function () {
    return (this.prompt_count > 0 && this.prompt_count < this.max_num_prompts);
}

/**
* Returns string that displays the number of prompts read and the total
* number of prompts.
*/
Prompts.prototype.getProgressDescription = function () {
    return this.prompt_count + "/" + this.max_num_prompts;
}

/**
* user changed the maximum number of prompts to record from drop down menu
*
* Note: when user changes the number of prompts to read, initPromptStack
* will causes the promptIDs to be in non-consecutive order, 
* and may result in user reading exactly same prompts again...
*/
Prompts.prototype.userChangedMaxNum = function (new_max_prompts) {
    this.previous_max_num_prompts = this.max_num_prompts;
    this.max_num_prompts = new_max_prompts;

    // promptId start point will be randomized and not be consecutive
    // to previous prompt IDs.
    this.prompt_stack = this._initPromptStack(this.list);

    console.log('max_num_prompts:' + new_max_prompts);
}

Prompts.prototype.getPromptCount = function () {
    return this.prompt_count;
}

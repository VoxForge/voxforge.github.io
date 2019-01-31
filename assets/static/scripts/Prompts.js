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
}

/**
* ### Functions / static methods ##############################################
*/

/**
* verify that read.md entries contain valid prompt related data
*/
Prompts.validate_Readmd_file = function(prompt_list_files) {
    var num_prompts_calc = 0;
    for (var i = 0; i < prompt_list_files.length; i++) {
      // check for undefined fields
      if (typeof prompt_list_files[i].id === 'undefined') {
        console.warn("prompt_list_files[" + i + "].id not defined in read.md for language: " + 
                    self.language);
      }
      if (typeof prompt_list_files[i].file_location === 'undefined') {
        console.warn("prompt_list_files[" + i + "].file_location not defined in read.md for language: " + 
                    self.language);
      }
      if (typeof prompt_list_files[i].contains_promptid === 'undefined') {
        console.warn("prompt_list_files[" + i + "].contains_promptid not defined in read.md for language: " + 
                    self.language);
      }
      if (typeof prompt_list_files[i].file_location === 'undefined') {
        console.warn("prompt_list_files[" + i + "].file_location not defined in read.md for language: " + 
                    self.language);
      }
      if (typeof prompt_list_files[i].number_of_prompts === 'undefined') {
        console.warn("prompt_list_files[" + i + "].number_of_prompts not defined in read.md for language: " + 
                    self.language);
      }

      // if prompt lines already have promptid, then don't need start or prefix
      // fields in read.md front matter
      if ( !  prompt_list_files[i].contains_promptid ) {
        if (typeof prompt_list_files[i].start === 'undefined') {
          console.warn("prompt_list_files[" + i + "].start not defined in read.md for language: " + 
                      self.language);
        }

        if (typeof prompt_list_files[i].prefix === 'undefined') {
          console.warn("prompt_list_files[" + i + "].prefix not defined in read.md for language: " + 
                      self.language);
        }
      }
    }
}

/**
* ### METHODS ##############################################
*/
/**
* initialize object with async operations

* create separate init function so can return promises on init (can't do that 
* with a constructor)
*/
Prompts.prototype.init = async function () {
    var self = this;

    Prompts.validate_Readmd_file(self.prompt_list_files);
    self._logPromptFileInformation();
    
    /** 
    * get prompts file for given language from server; used cached version of 
    * prompt file if no network connection...
    */
    var browserStorageEmpty = await self._isBrowserStorageEmpty();
    if ( browserStorageEmpty ) {
        self._getPromptsFileFromServerOrServiceWorkerCache(
            "downloaded prompt file from VoxForge server");
    } else {
        self._getPromptsFileFromBrowserStorage();
    }
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
            return (length == 0) })
        .catch(function(err) {
            return true; // no browser storage file exists
        });
        
    return promise;
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
Prompts.prototype._getPromptsFileFromBrowserStorage = async function () {  
    var jsonObject = await this._getSavedPromptList();
    this._extractPromptStackFrom(jsonObject);
    this._asyncUpdateOfPromptsFileFromServer();
}

Prompts.prototype._getSavedPromptList = function() {
    var promise =
        this.promptCache.getItem( this._getLocalPromptFilename() )
        .then(function(jsonOnject) {
            return(jsonOnject);
        })

    return promise;
}

/*
// get saved promptList file (from browser storage) and update
// prompt stack, so user can immediately start recording prompts.
* 
// doing prompt stack update here means that the prompt stack 
// is always one behind the call to VoxForge server... see above
*/
Prompts.prototype._extractPromptStackFrom = function(jsonObject) {        
    this.prompt_stack = this._initPromptStack(jsonObject.list);
}

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
    var n = this.max_num_prompts;
    var i = Math.floor((Math.random() * list.length));

    function nextPrompt() {
        i = i % (list.length -1);
        return list[i++];
    }

    function addPromptToStack() {
        prompt_stack.unshift(nextPrompt());
    }

    while (n--) addPromptToStack();

    return prompt_stack;
}

Prompts.prototype._asyncUpdateOfPromptsFileFromServer = async function () {
    var self = this;
    
    var prompt_file_name =
        this.prompt_list_files[this.prompt_file_index]['file_location'];

    // jquery syntax
    //var resultObj = $.get(prompt_file_name);
    //resultObj.done( this._savePromptData2BrowserStorage )
    //resultObj.fail( this._getPromptFileFromServerFailed );
    try {
        var prompt_data = await $.get(prompt_file_name);
        self._savePromptData2BrowserStorage(prompt_data);
    } catch(err) {
        self._getPromptFileFromServerFailed(err, prompt_file_name);    
    }
}

Prompts.prototype._savePromptData2BrowserStorage = function(prompt_data) {
    var plf = this.prompt_list_files[this.prompt_file_index];
        
    this.list = this._convertPromptDataToArray(plf, prompt_data);
    this._save2BrowserStorage(
        this._getLocalPromptFilename(),
        plf.id);
    console.log("updating saved prompts file with new one from VoxForge server");
    //resolve("got prompts from local storage"); // returnPromise
}

Prompts.prototype._getPromptFileFromServerFailed = function(
    err,
    prompt_file_name)
{
    var m = "cannot get updated prompts file from VoxForge server: " + 
            prompt_file_name + 
            "; device offline or has bad Internet connection, " + 
            "using browser storage prompts file\n " +
            "err = " + err;
    console.warn(m);
    // reject(m); // no need to reject since already updated prompt_stack
}

/**
No good way to detect if online or offline. Therefore, first try to 
get a random prompts file from server (i.e. might not be 
prompt_file_index == 0).  If fail, then fall back and use
service worker cached prompt file (which should work since it downloaded
the entire app in the first place...)
Failure in this case would be where prompt file is described in read.md
but missing from server; or where user while offline, erroneously deletes
the prompt cache from their browser, but leaves service worker cache untouched.

This way we can have very large prompt sets, but user only needs to 
download a small portion
*/
Prompts.prototype._getPromptsFileFromServerOrServiceWorkerCache = function(m) {
    var self = this;
    
    var prompt_file_name = self.prompt_list_files[this.prompt_file_index]['file_location'];

    return new Promise(function (resolve, reject) {
        const resultObj = $.get(prompt_file_name);
        resultObj.done(function(prompt_data) {
            self._copyPromptData2Stack(prompt_data);
            console.log(m);
            resolve(m);
        });
        resultObj.fail(function() {
            if (self.prompt_file_index > 0) {
                m = "using service worker cached prompt file id: 001";                
                self._getPromptsFileFromServerOrCache(0, m);
                resolve(m);              
            } else { // self.prompt_file_index = 0 and does not exist... user deleted?
                 reject( self._noServiceWorkerCache(prompt_file_name) );
            }            
        });
    });    
}

Prompts.prototype._noServiceWorkerCache = function(prompt_file_name) {
    var m = "Error: cannot find prompts file on VoxForge server: " +
            prompt_file_name + 
            "or in service worker cache....\n " +
            "retry later.";
    console.error(m);
    return m; 
}

Prompts.prototype._copyPromptData2Stack = function(prompt_data)
{
    var plf = this.prompt_list_files[this.prompt_file_index];
        
    this.list = this._convertPromptDataToArray(plf, prompt_data);
    this._confirmPromptListLength();
    this._save2BrowserStorage(
        this._getLocalPromptFilename(),
        plf.id);
      
    this.prompt_stack = this._initPromptStack(this.list);
}

Prompts.prototype._logPromptFileInformation = function() {
    var plf = this.prompt_list_files[this.prompt_file_index];
    var m = "";
    if ( ! plf.contains_promptid) {
        let end = plf.start + plf.number_of_prompts;
        m = "promptId start: " + plf.start +
            "; end: " + end;
    }
    console.log("prompt file id: " + plf.id + 
                " (prompt file array index: " + this.prompt_file_index + ") " + m);
}


Prompts.prototype._getLocalPromptFilename = function() {
    return this.language + '_' + 'prompt_file';
}


/** 
* save the prompt file as a JSON object in user's browser 
* InnoDB database using LocalForage 
*/
Prompts.prototype._save2BrowserStorage = function(
    local_prompt_file_name,
    id) 
{
    var jsonOnject = this._createJsonPromptObject(id);
    this._saveObject2PromptCache(
        local_prompt_file_name,
        jsonOnject);
}

Prompts.prototype._createJsonPromptObject = function(id) {
    var jsonOnject = {};

    jsonOnject['language'] = this.language;
    jsonOnject['id'] = id;
    jsonOnject['list'] = this.list;

    return jsonOnject;
}

Prompts.prototype._saveObject2PromptCache = function(
    local_prompt_file_name,
    jsonOnject)
{
    this.promptCache.setItem(local_prompt_file_name, jsonOnject)
    .then(function (value) {
        console.info('saved promptfile to localforage browser storage: ' +
                     local_prompt_file_name);
    })
    .catch(function(err) {
      console.error('save of promptfile to localforage browser storage failed!', err);
    });
}

Prompts.prototype._confirmPromptListLength = function()
{
    var plf = this.prompt_list_files[this.prompt_file_index];
    
    if (plf.number_of_prompts !=  this.list.length) {
        console.warn(
            "number of prompts in prompt_list_files[" +
            this.prompt_file_index + "] = " + 
            plf.number_of_prompts + 
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
Prompts.prototype._convertPromptDataToArray = function(plf, prompt_data) {
    function pad(num, size) {
      var s = num+"";
      while (s.length <= size) s = "0" + s;
      return s;
    }
 
    function removeEmptyStrings(sentence) {
        return sentence.trim() != "";
    }
    
    function addPromptId(sentence, i) {
        var prompt_id = plf.prefix + pad( i + plf.start, 5 );
        return prompt_id  + " " + sentence;
    }

    var sentences = prompt_data.split('\n');      
    var list = sentences.filter(removeEmptyStrings);
    if ( ! plf.contains_promptid ) {
        list = list.map(addPromptId);
    }
    
    return list;
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
    var arr = this.prompts_recorded.sort();
    var obj = {};

    for (var i = 0 ; i < arr.length ; i++)
    {
      var prompt_line = arr[i].split(/\s+/);
      var prompt_id = prompt_line.shift();
      prompt_line = prompt_line.join(' ').replace(/\s+$/, "");
      
      // join array back together into a string and remove trailing space
      obj[prompt_id] = prompt_line;
    }

    return JSON.stringify(obj,null,"  ");
}

/**
* return debug values as obj
*/
Prompts.prototype.getDebugValues = function () {
    var arr = this.prompts_recorded.sort();
    var obj = {};

    for (var i = 0 ; i < arr.length ; i++)
    {
      var prompt_line = arr[i].split(/\s+/);
      var prompt_id = prompt_line.shift();
      prompt_line = prompt_line.join(' ').replace(/\s+$/, "");
      
      // join array back together into a string and remove trailing space
      obj[prompt_id] = {
        sentence : prompt_line, 
        audio: this.audio_characteristics[prompt_id],
      }
    }

    return obj;
}

/**
*
*/
Prompts.prototype.setAudioCharacteristics = function (obj) {
  var self = this;

  return new Promise(function (resolve, reject) {
    self.audio_characteristics[obj.prompt_id] = {
        no_trailing_silence : obj.no_trailing_silence,
        no_speech : obj.no_speech,
        clipping : obj.clipping,
        too_soft : obj.too_soft,
        gain : obj.gain,
        vad_run : obj.vad_run,
    };
    resolve(obj);
  });//promise
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
    //return this.prompt_count >= this.max_num_prompts - 1;
    return this.prompt_count >= this.max_num_prompts;
}

/**
*
*/
Prompts.prototype.oneleft = function () {
    return this.prompt_count == 1;
}

/**
*
*/
Prompts.prototype.maxnumpromptsincreased = function () {
    return this.max_num_prompts >= this.previous_max_num_prompts;
}

/**
*
* e.g. user set max prompt to 30, records 25, then changes max prompts to 20
*/
Prompts.prototype.recordedmorethancurrentmaxprompts = function () {
    return this.prompt_count >= this.max_num_prompts;
}


/**
*
*/
Prompts.prototype.oneleft = function () {
    return this.prompt_count == 1;
}

/**
*
*/
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
    this.prompt_stack = this.initPromptStack(this.list);

    console.log('max_num_prompts:' + new_max_prompts);
}

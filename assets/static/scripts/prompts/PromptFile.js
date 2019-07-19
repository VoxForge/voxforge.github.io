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

/** 
* get prompts file for given language from server; used cached version of 
* prompt file if no network connection...
*/
function PromptFile(
    language,
    prompt_list_files, )
{
    this.language = language;
    this.prompt_list_files = prompt_list_files;

    this.promptList = [];
    this.promptCache = localforage.createInstance({
        name: this.language + "_promptCache"
    });

    this._validateReadmd();  

    this.prompt_file_index =
        Math.floor((Math.random() * this.prompt_list_files.length)); // zero indexed
    this.plf = this.prompt_list_files[this.prompt_file_index];
    this.prompt_file_name = this.plf['file_location'];

    this.jsonOnject = null;
}

PromptFile.prototype._validateReadmd = function () {
    var readmd = new Readmd(
        this.prompt_list_files,
        this.language,
        this.plf,
        this.prompt_file_index);
    readmd.validate();
}

/*
 * I. prompt file exists in browser storage
 * 
 * 1. for reponsiveness
 * Give user prompt file that is stored in browser storage,
 *
 * 2. in background
 * a. network up
 * perform an async replace of browser prompt file with random prompt file
 * from the server.
 *
 * b. network down
 * If no connection to server, then got to service worker cache to use the
 * default prompt file (first prompt file in configuration list).
 * 
 * II. no prompt file in browser storage
 *
 * 1. for reponsiveness
 * First check the service worker cache to get default prompt file
 *
 * 2. in background
 * a. network up
 * perform an async replace of browser prompt file with random prompt file
 * from the server.
 *
 * b. network down
 * do nothing, already have prompt list
 * 
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
    function isBrowserStorageEmpty() {  
        var promise =
            self.promptCache.length()
            .then(function(length) {
                return (length == 0) // true or false value
            })
            .catch(function(err) {
                return true; // no browser storage file exists
            });
            
        return promise;
    }

    isBrowserStorageEmpty()
    .then(function(browserStorageEmpty) {
        if ( browserStorageEmpty ) {
            self._getPromptsFileFromServerOrServiceWorkerCache.call(self);
        } else {
            self._getPromptsFileFromBrowserStorage.call(self);
        }

        return this.promptList; // TODO confirm this actuall works re: timing issues
    });
}



// #############################################################################

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
PromptFile.prototype._getPromptsFileFromServerOrServiceWorkerCache = function() {
    var self = this;

    this._getPromptsFileFromServer()
    .then( self._save2BrowserStorage.bind(self) );   
}

/*
 * returns a jQuery XHR object ("jqXHR")
 * does not have a catch, but uses fail to catch errors...
 */
PromptFile.prototype._getPromptsFileFromServer = function() {
    var self = this;
    
    var jqXHR =
        $.get(this.prompt_file_name)
        .fail(function(err) {
            console.log(err); 
            self._getPromptsFileFromServiceWorkerCache.call(self);
        });
        
    return jqXHR;
}


/** 
* save the prompt file as a JSON object in user's browser's Local Storage
*/
PromptFile.prototype._save2BrowserStorage = function(prompt_data) {
    var self = this;

    /**
    * split prompt file from server into an array and decide if it needs a 
    * prompt ID added;
    *
    * see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
    */
    function convertToArray(prompt_data) {
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

    function confirmPromptListLength() {
        if (self.plf.number_of_prompts !=  self.promptList.length) {
            console.warn(
                "number of prompts in prompt_list_files[" +
                self.prompt_file_index + "] = " + 
                self.plf.number_of_prompts + 
                " in read.md, not same as prompt file line counts for language: " + 
                self.language + "= " + self.promptList.length );
        }
    }

    function createJsonPromptObject () {
        var jsonOnject = {};

        jsonOnject['language'] = self.language;
        jsonOnject['id'] = self.plf.id;
        jsonOnject['list'] = self.promptList;

        return jsonOnject;
    }

    function saveObject2PromptCache() {
        var self = this;

        self.promptCache.setItem(
            self._getLocalizedPromptFilename.call(self),
            self.jsonOnject)
        .catch(function(err) {
            console.error('save of promptfile to localforage browser storage failed!', err);
            return;
        });
        console.info('saved promptfile to localforage browser storage: ' +
            self._getLocalizedPromptFilename() );
    }


    this.promptList = convertToArray(prompt_data);
    confirmPromptListLength();
        
    this.jsonObject = createJsonPromptObject();
    saveObject2PromptCache();
}

/*
 * local_prompt_file_name - name of prompt file when stored in user's browser
 * storage
 */
PromptFile.prototype._getLocalizedPromptFilename = function() {
    return this.language + '_prompt_file';
}

/*
 * service worker caches the first prompt file (default prompt file) shown
 * in prompt_list_files.
 * so try get again with default prompt file
*/
PromptFile.prototype._getPromptsFileFromServiceWorkerCache = function() {
    var self = this;
    
    /*
     * default prompt file is the first prompt file in a language configuration -
     * it gets automatically cached in browser storage by the service worker.
     */
    function notDefaultPromptFile() {
        return self.prompt_file_index > 0;
    }
    
    /*
     * service worker caches the first prompt file in list in prompt_list_files
     * in read.md
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
                this.prompt_file_name + 
                "or in service worker cache....\n " +
                "retry later.";
        console.error(m);
        return m; 
    }


    if ( notDefaultPromptFile() ) {
        resetPromptFileIndex2Default();
        this._getPromptsFileFromServerOrServiceWorkerCache();
    } else { // self.prompt_file_index = 0 and does not exist... user deleted?
        logNoServiceWorkerCache();
    }   
}

// #############################################################################

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
 * offline, so give the user a stack of prompts (using current
 * prompt list file), then asynchronously try to access server to update current
 * prompt file stored in browser.
 * if no internet access, then user using stored prompt file, 
 * if there is Internet access, then user will get updated 
 * random prompts on subsequent submission.
 */
PromptFile.prototype._getPromptsFileFromBrowserStorage = function() {
    var self = this;

    /*
     * Async call that return a JSON object containing prompt list
     */
    function getSavedPromptList() {
        var promise =
            self.promptCache.getItem( self._getLocalizedPromptFilename() )
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
     * check if can get random prompt file from server
     */
    function asyncUpdateOfPromptsFileFromServer() {
        self._getPromptsFileFromServer()
        .then( savePromptData2BrowserStorage );    
    }

    // TODO is just for the console message???
    function savePromptData2BrowserStorage(prompt_data) {
        this._save2BrowserStorage(prompt_data);
        console.log("updating saved prompts file with new one from VoxForge server");
    }

    getSavedPromptList()
    .then ( function(jsonObject) {
        self.jsonObject = jsonObject;
        asyncUpdateOfPromptsFileFromServer();
    });
}























// #############################################################################

/*
 * Supporting classes
 */
function Readmd(prompt_list_files, language, plf, prompt_file_index) {
    this.prompt_list_files = prompt_list_files;
    this.language = language;
    this.plf = plf;
    this.prompt_file_index = prompt_file_index;
    
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

    console.log("prompt file id: " +
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

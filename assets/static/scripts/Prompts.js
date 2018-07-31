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
    this.max_numPrompts_selector = parms.max_numPrompts_selector;
    this.list = []; // list of prompts to be recorded by user; iniitlaized in convertPromptDataToArray
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
}

/**
* ### Functions / static methods ##############################################
*/

/**
* helper function to return prompt id and prompt sentence in an array
*/
Prompts.splitPromptLine = function(promptLine) {
    var promptArray = promptLine.split(/(\s+)/); // create array
    var promptId = promptArray.shift(); // extract prompt id
    var promptSentence =  promptArray.join(""); // make string;

    return [promptId, promptSentence.trim()];
}

/**
* split prompt file from server into an array and decide if it needs a 
* prompt ID added; store in 'self.list'
*/
Prompts.convertPromptDataToArray = 
    function(prompt_data,
             contains_promptid,
             start,
             prefix) 
{
    // see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
    function pad(num, size) {
      var s = num+"";
      while (s.length <= size) s = "0" + s;
      return s;
    }

    var sentences = prompt_data.split('\n');
    var list = []; 

    // add prompt ID to each prompt line if none exists
    for (var i = 0; i < sentences.length; i++) {
      if (sentences[i] != "") { // skip empty string
        if (contains_promptid)
        { // first word of prompt line is the prompt ID
            list[i] = sentences[i];
        } else {
            var prompt_id = prefix + pad( i + start, 5 );
            list[i] = prompt_id  + " " + sentences[i];
        }
      }
    }

    return list;
}

/**
*
*/
Prompts.confirmPromptListLength = 
    function(list,
             number_of_prompts,
             prompt_file_index,
             language)
{
    if (number_of_prompts !=  list.length) {
      console.warn("number of prompts in prompt_list_files[" + prompt_file_index + "] = " + 
                   number_of_prompts + 
                  " in read.md, not same as prompt file line counts for language: " + 
                  language + "= " + list.length );
    }
}

/** 
* save the prompt file as a JSON object in user's browser 
* InnoDB database using LocalForage 
*/
Prompts.savePromptListLocally = 
    function(local_prompt_file_name,
             language,
             id,
             list,
             promptCache) 
{
    var jsonOnject = {};
    jsonOnject['language'] = language;
    jsonOnject['id'] = id;
    jsonOnject['list'] = list;

    promptCache.setItem(local_prompt_file_name, jsonOnject)
    .then(function (value) {
      console.info('saved promptfile to localforage browser storage: ' + local_prompt_file_name);
    }).catch(function(err) {
        console.error('save of promptfile to localforage browser storage failed!', err);
    });
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
*/
Prompts.initPromptStack = 
    function(list,
             max_num_prompts) 
{
    var prompt_stack = [];
    var index = Math.floor((Math.random() * list.length));

    for (var i = 0; i < max_num_prompts; i++) { // just count number of prompts to select
      // using unshift (rather than push) to keep prompt elements in order
      prompt_stack.unshift(list[index++]);
      index = index % (list.length -1);
    }

    return prompt_stack;
}

/**
* ### METHODS ##############################################
*/
/**
* initialize object with async operations

* create separate init function so can return promises on init (can't do that 
* with a constructor)
*/
Prompts.prototype.init = function () {
    // save context
    var self = this;

    /* Inner functions */
    /**
    * verify that read.md entries contain valid prompt related data
    */
    function validate_Readmd_file() {
      var variable_list = ['language', 
                        'prompt_list_files'];
      for (var i = 0; i < variable_list.length; i++) {
        if (typeof variable_list[i] === 'undefined') {
          console.warn(variable_list + " not defined in read.md for language: " + 
                      self.language);
        }
      }
      // validate contents of prompt_list_files array
      var num_prompts_calc = 0;
      for (var i = 0; i < self.prompt_list_files.length; i++) {
        // check for undefined fields
        if (typeof self.prompt_list_files[i].id === 'undefined') {
          console.warn("prompt_list_files[" + i + "].id not defined in read.md for language: " + 
                      self.language);
        }
        if (typeof self.prompt_list_files[i].file_location === 'undefined') {
          console.warn("prompt_list_files[" + i + "].file_location not defined in read.md for language: " + 
                      self.language);
        }
        if (typeof self.prompt_list_files[i].contains_promptid === 'undefined') {
          console.warn("prompt_list_files[" + i + "].contains_promptid not defined in read.md for language: " + 
                      self.language);
        }
        if (typeof self.prompt_list_files[i].file_location === 'undefined') {
          console.warn("prompt_list_files[" + i + "].file_location not defined in read.md for language: " + 
                      self.language);
        }
        if (typeof self.prompt_list_files[i].number_of_prompts === 'undefined') {
          console.warn("prompt_list_files[" + i + "].number_of_prompts not defined in read.md for language: " + 
                      self.language);
        }

        // if prompt lines already have promptid, then don't need start or prefix
        // fields in read.md front matter
        if ( !  self.prompt_list_files[i].contains_promptid ) {
          if (typeof self.prompt_list_files[i].start === 'undefined') {
            console.warn("prompt_list_files[" + i + "].start not defined in read.md for language: " + 
                        self.language);
          }

          if (typeof self.prompt_list_files[i].prefix === 'undefined') {
            console.warn("prompt_list_files[" + i + "].prefix not defined in read.md for language: " + 
                        self.language);
          }
        }
      }
    }

    /**
    * get number of prompt files defined in language's read.md file
    * Jekyll front-matter uses YAML to define data structures... prompt_list_files
    * in read.md file gets converted to an array.
    */
    function get_promptFile_count() {
      if (typeof self.prompt_list_files.length === 'undefined') {
        console.warn("prompt_list_files.length not defined in read.md for language: " + 
                    self.language);
      }

      return self.prompt_list_files.length;
    }



    /* get the submission object */
    function getSavedPromptList() {
      return new Promise(function (resolve, reject) {

          // getItem only returns jsonObject
          //localforage.getItem(local_prompt_file_name)
          self.promptCache.getItem(local_prompt_file_name)
          .then(function(jsonOnject) {
            // resolve sends these as parameters to next promise in chain
            resolve(jsonOnject);
          })
          .catch(function(err) {
            reject('getSavedPromptList err: ' + err);
          });

      });
    }

    /* ====================================================================== */
    // TODO duplicate definition in service worker file: processSavedSubmission.js
    var local_prompt_file_name = self.language + '_' + 'prompt_file';

    /* Main */
    return new Promise(function (resolve, reject) {
        /**
        no good way to detect if online or offline. therefore, get first set
        of prompts from prompt cache, then asyncronously try to get new set of 
        prompts.  Only try to get prompts right away if none in localstorage.

        This way we can have very large prompt sets, but user only needs to 
        download a small portion
        */
        function firstSetupOfPromptsFile(prompt_file_index) {
            var prompt_file_name = self.prompt_list_files[prompt_file_index]['file_location'];
            var plf = self.prompt_list_files[prompt_file_index];

            $.get(prompt_file_name,
                function(prompt_data) {
                  self.list = 
                      Prompts.convertPromptDataToArray(prompt_data,
                                                       plf.contains_promptid,
                                                       plf.start,
                                                       plf.prefix);
                  Prompts.confirmPromptListLength(self.list,
                                                  plf.number_of_prompts,
                                                  prompt_file_index,
                                                  self.language);
                  Prompts.savePromptListLocally(local_prompt_file_name,
                                        self.language,
                                        plf.id,
                                        self.list,
                                        self.promptCache
                  );

                  self.prompt_stack = Prompts.initPromptStack(self.list,
                                                              self.max_num_prompts);
                  var m = "downloaded prompt file from VoxForge server";
                  console.log(m);
                  resolve(m);
                }
            )
            .fail(function() { // first prompt file should be cached by service worker
                // TODO need to be able to reset prompt_file_index globally in a functional manner???
                // but promise structure makes things interesting....
                prompt_file_index = 0;
                prompt_file_name = self.prompt_list_files[prompt_file_index]['file_location'];
                $.get(prompt_file_name, 
                    function(prompt_data) {
                      self.list = 
                          Prompts.convertPromptDataToArray(prompt_data,
                                                           plf.contains_promptid,
                                                           plf.start,
                                                           plf.prefix);
                      Prompts.confirmPromptListLength(self.list,
                                                      plf.number_of_prompts,
                                                      prompt_file_index,
                                                      self.language);
                      Prompts.savePromptListLocally(local_prompt_file_name,
                                                    self.language,
                                                    plf.id,
                                                    self.list,
                                                    self.promptCache
                      );

                      self.prompt_stack = Prompts.initPromptStack(self.list,
                                                                  self.max_num_prompts);
                      var m = "using service worker cached prompt file id: 001";
                      console.log(m);
                      resolve(m);
                    }
                )
                .fail(function() {
                    var m = "cannot find prompts file on VoxForge server: " + prompt_file_name + 
                            "or in service worker cache; could be bad Internet connection...\n ";
                    console.warn(m);
                    reject(m);
                });
            });
        }

        /**
          1. use localstorage prompts to start with,
          2. then asynchronously try to download updated prompt file...

          this prevents hang of app when user records offline (when using a 
          promise chain) or timing issues with no promise chain when app starts
          up offline and prompts file 'get' is hanging...

         * doing prompt stack update here means that the prompt stack 
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
        function subsequentSetupOfPromptsFile(prompt_file_index) {
            var prompt_file_name = self.prompt_list_files[prompt_file_index]['file_location'];
            var plf = self.prompt_list_files[prompt_file_index];

            getSavedPromptList()
            .then( function(jsonObject) {
                // doing prompt stack update here means that the prompt stack 
                // is always one behind the call to VoxForge server... see above
                self.prompt_stack = Prompts.initPromptStack(self.list,
                                                            self.max_num_prompts);

                console.log("attempting async update of saved prompts file to replace " + 
                            "with new one from VoxForge server");
                $.get(prompt_file_name, 
                    function(prompt_data) {
                      self.list = 
                          Prompts.convertPromptDataToArray(prompt_data,
                                                           plf.contains_promptid,
                                                           plf.start,
                                                           plf.prefix);
                      Prompts.savePromptListLocally(local_prompt_file_name,
                                                    self.language,
                                                    plf.id,
                                                    self.list,
                                                    self.promptCache
                      );
                      console.log("updating saved prompts file with new one from VoxForge server");
                    }
                )
                .fail(function() {
                    var m = "cannot get updated prompts file from VoxForge server: " + 
                            prompt_file_name + 
                            "; device offline or has bad Internet connection, " + 
                            "using local storage prompts file\n ";
                    console.log(m);
                });

                resolve("got prompts from local storage");
            });
        }

        validate_Readmd_file();
        var prompt_file_index = Math.floor((Math.random() * get_promptFile_count())); // zero indexed
        var m = "";
        if ( ! self.prompt_list_files[prompt_file_index].contains_promptid) {
            m = "starting promptId: " + self.prompt_list_files[prompt_file_index].start;
        }
        console.log("prompt file id: " + self.prompt_list_files[prompt_file_index].id + 
                    " (prompt file array index: " + prompt_file_index + ") " + m);


        /** 
        * get prompts file for given language from server; used cached version of 
        * prompt file if no network connection...

        * Note: each language has its own prefixed prompt file, so counting keys
        * tells you if prompt file was already locally cached in promptCache 
        * for that language
        */
        self.promptCache.length() // Gets the number of keys in the offline store
        .then(function(numberOfKeys) { 

            if (numberOfKeys == 0) { // first time set up of prompts file
                firstSetupOfPromptsFile(prompt_file_index);
            } else { 
                subsequentSetupOfPromptsFile(prompt_file_index);
            }
        
        });
    }); // promise
}

/**
* reset prompt array and index after submission is completed
*/
Prompts.prototype.resetIndices = function () {
    this.prompt_count = 0; // number of prompts read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.audio_characteristics = {};

    this.prompt_stack = [];
    this.prompt_stack = Prompts.initPromptStack(this.list,
                                                this.max_num_prompts);

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
   return Prompts.splitPromptLine(this.current_promptLine)[0];
}

/**
* get prompt portion of current prompt line as determined by index.
*/
Prompts.prototype.getPromptSentence = function () {
   return Prompts.splitPromptLine(this.current_promptLine)[1];
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

      // join array back together into a string and remove trailing space
      obj[prompt_id] = {
        sentence : prompt_line.join(' ').replace(/\s+$/, ""), 
        audio: this.audio_characteristics[prompt_id],
      }
    }

    return JSON.stringify(obj,null,"  ");
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
    this.prompt_stack = Prompts.initPromptStack(this.list,
                                                this.max_num_prompts);

    console.log('max_num_prompts:' + new_max_prompts);
}

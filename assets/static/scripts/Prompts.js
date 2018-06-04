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
function Prompts(parms) {
    // this value triggers the display of the upload button and upload 
    // windows.alert
    this.max_num_prompts = parms.num_prompts_to_trigger_upload;
    // this is used by View class
    this.max_numPrompts_selector = parms.max_numPrompts_selector;
    // list of prompts to be recorded by user; iniitlaized in convertPromptDataToArray
    this.list = [];

    this.previous_max_num_prompts = 0; // to decide what to do when use changes max number of prompts
    this.list = []; // list of prompts to be read by user
    this.index = 0; // pointer to position in prompt list array
    this.prompt_count = 0; // number of prompts user read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.audio_characteristics = {}; // hash of audio characteritics of recorded audio; indexed by promptID
    this.prompt_stack = []; // stack; makes it easier to add deleted elements for re-record
    this.current_promptLine = null; // need to keep track of current prompt since no longer tracking index

    // TODO duplicate definition in service worker file: processSavedSubmission.js
    var local_prompt_file_name = page_language + '_' + 'prompt_file';
    this.promptCache = localforage.createInstance({
        name: "promptCache"
    });

    // lexical closure of 'this' value so that when function 'processPromptsFile' 
    // gets passed as parameter to $.get (thus being called as a reference), it
    // has access to correct 'this' context variable
    // see: http://alistapart.com/article/getoutbindingsituations
    var self = this;

    /* Inner functions */
    /**
    * verify that read.md entries contain valid data
    */
    function validate_Readmd_file() {
      var variable_list = ['page_language', 
                        'page_prompt_list_files', 
                        'page_total_number_of_prompts'];
      for (var i = 0; i < variable_list.length; i++) {
        if (typeof variable_list[i] === 'undefined') {
          console.warn(variable_list + " not defined in read.md for language: " + 
                      page_language);
        }
      }
      // validate contents of page_prompt_list_files array
      var num_prompts_calc = 0;
      for (var i = 0; i < page_prompt_list_files.length; i++) {
        // check for undefined fields
        if (typeof page_prompt_list_files[i].id === 'undefined') {
          console.warn("prompt_list_files[" + i + "].id not defined in read.md for language: " + 
                      page_language);
        }
        if (typeof page_prompt_list_files[i].file_location === 'undefined') {
          console.warn("prompt_list_files[" + i + "].file_location not defined in read.md for language: " + 
                      page_language);
        }
        if (typeof page_prompt_list_files[i].contains_promptid === 'undefined') {
          console.warn("prompt_list_files[" + i + "].contains_promptid not defined in read.md for language: " + 
                      page_language);
        }
        if (typeof page_prompt_list_files[i].file_location === 'undefined') {
          console.warn("prompt_list_files[" + i + "].file_location not defined in read.md for language: " + 
                      page_language);
        }
        if (typeof page_prompt_list_files[i].number_of_prompts === 'undefined') {
          console.warn("prompt_list_files[" + i + "].number_of_prompts not defined in read.md for language: " + 
                      page_language);
        }

        // if prompt lines already have promptid, then don't need start or prefix
        // fields in read.md front matter
        if ( !  page_prompt_list_files[i].contains_promptid ) {
          if (typeof page_prompt_list_files[i].start === 'undefined') {
            console.warn("prompt_list_files[" + i + "].start not defined in read.md for language: " + 
                        page_language);
          }

          if (typeof page_prompt_list_files[i].prefix === 'undefined') {
            console.warn("prompt_list_files[" + i + "].prefix not defined in read.md for language: " + 
                        page_language);
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
      if (typeof page_prompt_list_files.length === 'undefined') {
        console.warn("page_prompt_list_files.length not defined in read.md for language: " + 
                    page_language);
      }

      return page_prompt_list_files.length;
    }

    /**
    * split prompt file from server into an array and decide if it needs a 
    * prompt ID added; store in 'self.list'
    */
    function convertPromptDataToArray(prompt_data) {
      // see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
      function pad(num, size) {
        var s = num+"";
        while (s.length <= size) s = "0" + s;
        return s;
      }

      var sentences = prompt_data.split('\n');

      // add prompt ID to each prompt line if none exists
      for (var i = 0; i < sentences.length; i++) {
        if (sentences[i] != "") { // skip empty string
          if (page_prompt_list_files[random_prompt_file].contains_promptid)
          { // first word of prompt line is the prompt ID
              self.list[i] = sentences[i];
          } else {
              var start_promptId = page_prompt_list_files[random_prompt_file].start;
              var prefix = page_prompt_list_files[random_prompt_file].prefix;
              var prompt_id = prefix + pad( i + start_promptId, 5 );
              self.list[i] = prompt_id  + " " + sentences[i];
          }
        }
      }

      if (page_prompt_list_files[random_prompt_file].number_of_prompts !=  self.list.length) {
        console.warn("number of prompts in prompt_list_files[" + random_prompt_file + "] in read.md not same as prompt file line counts for language: " + 
                    page_language);
      }
    }

    /** 
    * save the prompt file as a JSON object in user's browser 
    * InnoDB database using LocalForage 
    */
    function savePromptListLocally() {
      var jsonOnject = {};
      jsonOnject['language'] = page_language;
      jsonOnject['id'] = page_prompt_list_files[random_prompt_file].id;
      jsonOnject['list'] = self.list;

      self.promptCache.setItem(local_prompt_file_name, jsonOnject)
      .then(function (value) {
        console.info('savePromptListLocally: saved promptfile to localforage browser storage: ' + local_prompt_file_name);
      })
      .catch(function(err) {
          console.error('savePromptListLocally failed!', err);
      });
    }

    /** 
    * User's set of prompts to be read in contained in a stack, that way
    * if a user wants to re-read a prompt, they delete it, and it gets
    * placed in the stack and re-displayed to the user to record again.
    *
    * reading prompt list using the self.index and modulus to wrap
    * around the prompt list array.
    */
    function initializePromptStack() {
      for (var i = 0 ; i <  self.max_num_prompts; i++) { 
        self.index = self.index % (self.list.length)
        // using unshift rather than push to keep prompt elements in order
        self.prompt_stack.unshift(self.list[self.index]);
        self.index++;
      }
    }

    /**
    * callback (for jquery 'get') - reads single prompt file into memory
    *
    * (note complete prompt list is split into many smaller prompt files so
    * that browser does not need to load them all in at once...)
    */
    function processPromptsFile(prompt_data) {
      convertPromptDataToArray(prompt_data);
      savePromptListLocally();

      // set random index of prompt line to present to user
      self.index = Math.floor((Math.random() * self.list.length)); // zero indexed

      initializePromptStack();
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
    /* Main */

    validate_Readmd_file();

    var random_prompt_file = Math.floor((Math.random() * get_promptFile_count())); // zero indexed

    console.log("prompt file id: " + page_prompt_list_files[random_prompt_file].id + 
                " (prompt file array index: " + random_prompt_file + ")");

    if ( ! page_prompt_list_files[random_prompt_file].contains_promptid) {
        console.log("starting promptId: " + page_prompt_list_files[random_prompt_file].start);
    }

    /** 
    * get prompts file for given language from server; used cached version of 
    * prompt file if not network connection...
    *
    * (synchronous request)
    */
    $.get(page_prompt_list_files[random_prompt_file]['file_location'], 
      function(prompt_data) {
        processPromptsFile(prompt_data);
      }
    ).fail(function() {
      var file_name = page_prompt_list_files[random_prompt_file]['file_location'];
      console.warn("cannot find prompts file on VoxForge server: " + file_name + 
                   "; or bad Internet connection... using locally stored prompt file: " + local_prompt_file_name);

      getSavedPromptList()
      .then( function(jsonObject) {
          self.list = jsonObject.list;
          initializePromptStack();
      });
 
   });
}

/**
* ### Static METHODS ##############################################
*/

/**
* helper function to return prompt id and prompt sentence in an array
*/
Prompts.splitPromptLine = function(promptLine) {
    var promptArray = promptLine.split(/(\s+)/); // create array
    var promptId = promptArray.shift(); // extract prompt id
    var promptSentence =  promptArray.join(""); // make string;

    return [promptId, promptSentence];
}

/**
* ### METHODS ##############################################
*/
/**
* initialize prompt stack with number of prompts chosen by user
*/
Prompts.prototype.initPromptStack = function () {
    this.prompt_stack = [];
    this.index = Math.floor((Math.random() * this.list.length));

    for (var i = this.max_num_prompts -1 ; i >=0; i--) { 
      // using unshift rather than push to keep prompt elements in order
      this.prompt_stack.unshift(this.list[this.index]);
      this.index++;
      this.index = this.index % (this.list.length -1);
    }
}

/**
* reset prompt array and index after submission is completed
*/
Prompts.prototype.resetIndices = function () {
    this.prompt_count = 0; // number of prompts read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.audio_characteristics = {};

    this.initPromptStack();
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
    };
    resolve(obj);
  });//promise
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
    this.initPromptStack();

    console.log('max_num_prompts:' + new_max_prompts);
}

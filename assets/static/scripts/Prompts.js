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
                 pageVariables,
                 appversion)
{
    this.parms = parms;
    this.prompt_list = []; // list of prompts to be recorded by user
    this.index = 0; // pointer to position in prompt list array
    this.prompt_count = 0; // number of prompts user read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.prompt_stack = []; // stack; makes it easier to add deleted elements for re-record
    this.current_promptLine = null; // need to keep track of current prompt since no longer tracking index

    this.previous_numPromptsToRead = 0; // to decide what to do when use changes max number of prompts
    this.numPromptsToRead = this._getNumPromptsToRead();

    this.language = pageVariables.language;
    this.prompt_list_files = pageVariables.prompt_list_files;
    this.audio_characteristics = {}; // hash of audio characteritics of recorded audio; indexed by promptID
    this.appversion = appversion;
}

Prompts.prototype._getNumPromptsToRead = function () {
    var element = "numPromptsToRead";
       
    var numPromptsToRead = localStorage.getItem(element);
    if ( ! numPromptsToRead ) {
        numPromptsToRead = this.parms.numPromptsToRead.numPrompts;   
        localStorage.setItem(
            element,
            numPromptsToRead );
    }

    return numPromptsToRead;
}

/**
* ### METHODS ##############################################
*/

Prompts.prototype.init = function () {
    var self = this;      
    var promptFile = new Prompts.File(
        this.language,
        this.prompt_list_files,
        this.appversion);
        
    promptFile.get()
    .then( function(prompt_list) {self.prompt_list = prompt_list} )
    .then( self._initPromptStack.bind(self) );
}

/**
* initialize prompt stack with number of prompts chosen by user
*
* User's set of prompts to be read contained in a stack, that way
* if a user wants to re-read a prompt, they delete it, and it gets
* placed in the stack and re-displayed to the user to record again.
*
* reading prompt list using the self.index and modulus to wrap
* around the prompt list array.
*
* Note: using unshift (rather than push) to keep prompt elements in order
*/
Prompts.prototype._initPromptStack = function() {
    var self = this;    

    this.prompt_stack = [];

    var i = Math.floor((Math.random() * this.prompt_list.length));

    function nextPrompt() {
        i = i % (self.prompt_list.length -1);
        return self.prompt_list[i++];
    }

    function addPromptToFrontOfStack() {
        self.prompt_stack.unshift(nextPrompt());
    }

    var n = this.numPromptsToRead;
    while (n--) addPromptToFrontOfStack();
}

/**
* reset prompt array and index after submission is completed
*/
Prompts.prototype.resetIndices = function () {
    this.prompt_count = 0; // number of prompts read
    this.prompts_recorded = []; // list of prompts that have been recorded
    this.audio_characteristics = {};

    this.prompt_stack = [];
    this._initPromptStack();
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
* true when max number of prompts user wants to record is reached
*/
Prompts.prototype.lastone = function () {
    return this.prompt_count >= this.numPromptsToRead;
}

Prompts.prototype.oneleft = function () {
    return this.prompt_count == 1;
}

Prompts.prototype.maxnumpromptsincreased = function () {
    return this.numPromptsToRead >= this.previous_numPromptsToRead;
}

/**
* e.g. user set max prompt to 30, records 25, then changes max prompts to 20
*/
Prompts.prototype.recordedmorethancurrentmaxprompts = function () {
    return this.prompt_count >= this.numPromptsToRead;
}

Prompts.prototype.atmid = function () {
    return (this.prompt_count > 0 && this.prompt_count < this.numPromptsToRead);
}

/**
* Returns string that displays the number of prompts read and the total
* number of prompts.
*/
Prompts.prototype.getProgressDescription = function () {
    return this.prompt_count + "/" + this.numPromptsToRead;
}

/**
* user changed the maximum number of prompts to record from drop down menu
*
* Note: when user changes the number of prompts to read, initPromptStack
* will causes the promptIDs to be in non-consecutive order, 
* and may result in user reading exactly same prompts again...
*/

// TODO when user changes numPromptsToRead should do this (instead of
// re-initializing the prompt stack):
//   if increase, then push more prompts to stack
//   if decrease, just pop unneeded prompts from stack
Prompts.prototype.userChangedNumPromptsToRead = function (new_max_prompts) {
    this.previous_numPromptsToRead = this.numPromptsToRead;
    this.numPromptsToRead = new_max_prompts;

    // promptId start point will be randomized and not be consecutive
    // to previous prompt IDs.
    this._initPromptStack();

    console.log('numPromptsToRead:' + new_max_prompts);
}

Prompts.prototype.getPromptCount = function () {
    return this.prompt_count;
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

    function addPromptlineToObject(obj, promptLine) {
        var prompt_id = self._extractPromptIdFromPromptLine(promptLine);
        var prompt_sentence = self._extractPromptSentencePromptLine(promptLine);

        obj[prompt_id] = prompt_sentence;
    }
    
    var obj = {};    
    var arr = this.prompts_recorded.sort();

    arr.forEach(function(promptLine) {
        addPromptlineToObject(obj, promptLine);
    });

    return JSON.stringify(obj,null,"  ");
}

// #############################################################################

/**
* return debug values as obj
*/
Prompts.prototype.getDebugValues = function () {
    var self = this;
    
    function addPromptlineToDebugObject(obj, promptLine) {
        var prompt_id = self._extractPromptIdFromPromptLine(promptLine);
        var prompt_sentence = self._extractPromptSentencePromptLine(promptLine);

        obj[prompt_id] = {
            sentence : prompt_sentence, 
            audio: self.audio_characteristics[prompt_id],
        }
    }
    
    var obj = {};    
    var arr = this.prompts_recorded.sort();

    arr.forEach(function(promptLine) {
        addPromptlineToDebugObject(obj, promptLine);
    });
    
    return obj;
}

Prompts.prototype.setDebugAudioCharacteristics = function (obj) {
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
Prompts.prototype.clearDebugAudioCharacteristics = function () {
  this.audio_characteristics = {};
}

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

// #############################################################################

/**
* Class declaration
*/
function Prompts () {
  /* Inner functions */
    /**
    * verify that read.md entries contain valid data
    */
    validate_Readmd_file = function () {
      var MAX_NUM_PROMPTS_IN_FILE = 2000;

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
    get_promptFile_count = function () {
      if (typeof page_prompt_list_files.length === 'undefined') {
        console.warn("page_prompt_list_files.length not defined in read.md for language: " + 
                    page_language);
      }

      return page_prompt_list_files.length;
    }

  /* Main */

  //this.max_num_prompts=10; // default maximum number of prompts
  this.max_num_prompts=3; // TODO testing
  this.list = []; // list of prompts to be read by user
  this.index=0; // pointer to position in prompt list array
  this.prompt_count = 0; // number of prompts read
  this.prompts_recorded = []; // list of prompts that have been recorded
  this.deleted_prompts = []; // list of prompts that have been deleted and need to be re-recorded
  /* inner functions */

  validate_Readmd_file();

  this.random_prompt_file = Math.floor((Math.random() * get_promptFile_count())); // zero indexed
  console.log("prompt file id: " + page_prompt_list_files[this.random_prompt_file].id + " (prompt file array index: " + this.random_prompt_file + ")");
  console.log("starting promptId: " + page_prompt_list_files[this.random_prompt_file].start);
}

/**
* Instantiate Prompt class
*/
var prompts = new Prompts();

/* synchronous request... */
$.get(page_prompt_list_files[prompts.random_prompt_file]['file_location'], 
      prompts.processPromptsFile
).fail(function() {
  console.warn("cannot find prompts file on VoxForge server: " + 
              page_prompt_list_files[prompts.random_prompt_file]['file_location']);
});

/**
* updates the current number of prompts that the user selected from dropdown
*/
$('#max_num_prompts').click(function () { 
  prompts.max_num_prompts = this.value.replace(/[^0-9\.]/g,'');

  updateProgress();

  console.log('max_num_prompts:' + prompts.max_num_prompts);
});

/**
* ### METHODS ##############################################
*/

/**
* callback (for jquery 'get') to process the received prompts file
*
* see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
*/
// cannot get 'this' context to work inside prototype methods used in callback???
// therefore use 'prompt' object to update attributes... ???
// TODO might be something to do with 'this' context variable not being the same in call back
// see: https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
//   this (aka "the context") is a special keyword inside each function and its 
//   value only depends on how the function was called, not how/when/where it was 
//   defined.
Prompts.prototype.processPromptsFile = function (prompt_data) {
    function pad (num, size) {
      var s = num+"";
      while (s.length <= size) s = "0" + s;
      return s;
    }
  var sentences = prompt_data.split('\n');
  for (var i = 0; i < sentences.length; i++) {
    if (sentences[i] != "") { // skip empty string
      if (page_prompt_list_files[prompts.random_prompt_file].contains_promptid)
      { // first word of prompt line is the prompt ID
          prompts.list[i] = sentences[i];
      } else {
          var start_promptId = page_prompt_list_files[prompts.random_prompt_file].start;
          var prefix = page_prompt_list_files[prompts.random_prompt_file].prefix;
          var prompt_id = prefix + pad( i + start_promptId, 5 );
          prompts.list[i] = prompt_id  + " " + sentences[i];
      }
    }
  }

  if (page_prompt_list_files[prompts.random_prompt_file].number_of_prompts !=  prompts.list.length) {
    console.warn("number of prompts in prompt_list_files[" + prompts.random_prompt_file + "] in read.md not same as prompt file line counts for language: " + 
                page_language);
  }

  // set random index of prompt line to present to user
  prompts.index = Math.floor((Math.random() * prompts.list.length) + 1); // one indexed
}

/**
* reset prompt array and index after submission is completed
*/
Prompts.prototype.resetIndices = function () {
  this.index = Math.floor((Math.random() * prompts.list.length) + 1); // one indexed
  this.prompt_count = 0; // number of prompts read
  this.prompts_recorded = []; // list of prompts that have been recorded
}

/**
* get current prompt line as determined by index.  index gets incremented
* after returning prompt 
*/
Prompts.prototype.getNextPrompt = function () {
  // are there elements in the deleted array? return one of those to be 
  // re-recorded
  if (Array.isArray(this.deleted_prompts) && this.deleted_prompts.length) {
     // returns one element
     for (var key in this.deleted_prompts) {
       var promptId = key;
       var prompt_sentence = this.deleted_prompts[key];
       delete this.deleted_prompts[key];
       return [promptId, prompt_sentence];
     }
  }

  this.index = this.index % (this.list.length -1)
  if (this.prompt_count >= this.max_num_prompts) {
    return null;
  }
  var prompt = this.list[this.index];

  this.index++;
  this.prompt_count++;

  return prompt;
}

/**
* add deleted prompt to array and decrement prompt count 
* prompt is remove from DOM and then when app calls for another prompt, it looks
* at the deleted prompmt array first and return prompts from there
*/
Prompts.prototype.deletePrompt = function (prompt_id, prompt_sentence) {
  this.deleted_prompts[prompt_id] = prompt_sentence;

  this.prompt_count--;
}

/**
* get prompt id portion of current prompt line as determined by index.
*/
Prompts.prototype.getPromptId = function () {
  var prompt = this.list[this.index];
  var prompt = prompt.split(/(\s+)/);// create array

  return prompt.shift(); // return first element = prompt id
}

/**
* get prompt portion of current prompt line as determined by index.
*/
Prompts.prototype.getPromptSentence = function () {
  var prompt = this.list[this.index];
  var prompt = prompt.split(/(\s+)/); // create array
  prompt.shift(); // remove prompt id

  return prompt.join(""); // make string;
}

/**
* Reverse array to that prompts are in incremental order.
* Need to reverse array because recordings are displayed in reverse order 
* so that most recent one was displayed first
*/
Prompts.prototype.toArray = function () {
  var temp_array = this.prompts_recorded;
  // need to reverse array because recordings are displayed in reverse order 
  // so that most recent one was displayed first
  return temp_array.reverse();
}

/**
* Convert prompt array to JSON string
* array reversal achieved by reading array elements in reverse order
*/
Prompts.prototype.toJsonString = function () {
  var arr = this.prompts_recorded;
  var obj = {};

  // reverses array
  var end = arr.length - 1;
  for (var i = end ; i >= 0 ; i--)
  {
    var prompt_line = arr[i].split(/\s+/);
    var prompt_id = prompt_line.shift();
    // join array back together into a string and remove trailing space
    obj[prompt_id] = prompt_line.join(' ').replace(/\s+$/, "");
  }

  return JSON.stringify(obj,null,"  ");
}

/**
* Convert prompt array to JSON string
* array reversal achieved by reading array elements in reverse order
*/
Prompts.prototype.maxPromptsReached = function () {
  return this.prompt_count >= this.max_num_prompts;
}

/**
* Returns string that displays the number of promtps read and the total
* number of promtps.
*/
Prompts.prototype.getProgressDescription = function () {
  return this.prompt_count + "/" + this.max_num_prompts;
}


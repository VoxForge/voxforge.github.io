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
function Prompts (language) {
  this.language = language;
  this.max_num_prompts=3; // default maximum number of prompts
  this.list = []; // list of prompts to be read by user
  this.index=0; // pointer to position in prompt list array
  this.prompt_count = 0; // number of prompts read
  this.prompts_recorded = []; // list of prompts that have been recorded

//  this.filename = 'PromptList_' + language + '.txt';
}

/**
* Instantiate Prompt class
*/
var prompts = new Prompts(page_language);

/**
* read prompts file from same origin as script location
* may need to set up a flask page on repository server that serves prompts 
* from a huge list and keeps track of which one have been already submitted
* 
* see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
* Note: this is a synchronous request...
*/
//jQuery.get('/assets/static/prompts/' + prompts.filename, function(data) {
jQuery.get("/" + page_language + "/prompts/001", function(data) {
  function pad (num, size) {
    var s = num+"";
    while (s.length <= size) s = "0" + s;
    return s;
  }

  var sentences = data.split('\n');
  for (var i = 0; i < sentences.length; i++) {
    if (page_prompt_list_contains_id)
    { // first word of prompt line is the prompt ID
      prompts.list[i] = sentences[i];
    } else {
      var prompt_id = prompts.language + pad(i,4);
      prompts.list[i] = prompt_id  + " " + sentences[i];
    }
  }

  prompts.index = Math.floor((Math.random() * prompts.list.length) + 1);
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
* reset prompt array and index after submission is completed
*/
Prompts.prototype.resetIndices = function () {
  this.index = Math.floor((Math.random() * prompts.list.length) + 1);
  this.prompt_count = 0; // number of prompts read
  this.prompts_recorded = []; // list of prompts that have been recorded
}

/**
* get current prompt line as determined by index.  index gets incremented
* after returnong prompt 
*/
Prompts.prototype.getNextPrompt = function () {
  this.index = this.index % this.list.length
  if (this.prompt_count >= this.max_num_prompts) {
    return null;
  }
  var prompt = this.list[this.index];

  this.index++;
  this.prompt_count++;

  return prompt;
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


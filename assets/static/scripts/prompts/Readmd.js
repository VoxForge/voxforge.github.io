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

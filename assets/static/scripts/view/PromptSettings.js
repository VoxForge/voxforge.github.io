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

View.PromptSettings = function(
    parms,
    prompts, )
{
    this.parms = parms;
    this.prompts = prompts;

    this.element = "numPromptsToRead";
    this.$element = $('#' + this.element);
    this.$element_display = $('#' + this.element + '_display'); // numPromptsToRead_display
}

View.PromptSettings.prototype.setup = function() {
    this._displayPrompts();
    this._setupChangeFunctions();

    return this.$element;
}

/**
* updates the current number of prompts that the user selected from dropdown
*/
View.PromptSettings.prototype._setupChangeFunctions = function() {
    var self = this;
        
    this.$element.change(function() {
        var new_numPromptsToRead = this.value.replace(/[^0-9\.]/g,'');
        self.prompts.userChangedNumPromptsToRead.call(
            self.prompts, new_numPromptsToRead );
        self.updateProgress();

        // TODO should be in Prompts class
        localStorage.setItem(
            self.element,
            new_numPromptsToRead );
    });
}

/**
* set default (device dependent) max number of prompts the user can record
*
* startPrompt = // min number of prompts no matter what device
*/
View.PromptSettings.prototype._displayPrompts = function() {
    var min = this.parms.numPromptsToRead.min;
    var max = this.parms.numPromptsToRead.max;
    var incr = this.parms.increment;

    // TODO how to set default based on what is stored in localstorage
    var option = '';
    
    for (var i=min; i <= max; i = i + incr) {
       option += '<option value="'+ i + '">' + i +  '</option>';
    }
    this.$element.append(option);
    this._setDefaultNumberOfPrompts();
    this.$element_display.show();
}

/*
 * set default number of prompts in prompts selector
 */
View.PromptSettings.prototype._setDefaultNumberOfPrompts = function() {
    var numPromptsToRead = localStorage.getItem(this.element);
    if ( numPromptsToRead ) {
        this.$element.val( numPromptsToRead );
    }
}

/**
* update number of prompts recorded and total number of prompts to record
*/
View.PromptSettings.prototype.updateProgress = function() {
    document.querySelector('.progress-display').innerText =
        this.prompts.getProgressDescription.call(this.prompts);
}

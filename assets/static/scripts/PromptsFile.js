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
function PromptsFile() {

}

/**
* 
*/
PromptsFile.prototype.init = function () {
    var self = this;

    /**
    * verify that PromptsFile.md entries contain valid data
    */
    function validate_PromptsFilemd_file() {
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
    * in PromptsFile.md file gets converted to an array.
    */
    function get_promptFile_count() {
        if (typeof page_prompt_list_files.length === 'undefined') {
          console.warn("page_prompt_list_files.length not defined in read.md for language: " + 
                      page_language);
        }

        return page_prompt_list_files.length;
    }

    /* ====================================================================== */
    validate_PromptsFilemd_file();

    var random_prompt_file = Math.floor((Math.random() * get_promptFile_count())); // zero indexed
    console.log("prompt file id: " + page_prompt_list_files[random_prompt_file].id + 
                " (prompt file array index: " + random_prompt_file + ")");
    if ( ! page_prompt_list_files[random_prompt_file].contains_promptid) {
        console.log("starting promptId: " + page_prompt_list_files[random_prompt_file].start);
    }

    /** 
    * get prompts file from server
    *
    */
    var prompt_file_name = page_prompt_list_files[random_prompt_file]['file_location'];
    $.get(prompt_file_name, 
        function(prompt_data) {
          $('#prompt_list').text( prompt_data );
        }
    ).fail(function() {
        var m = "cannot find prompts file on VoxForge server: " + file_name + 
                "; or bad Internet connection...\n ";
        console.warn(m);
    });
}

// #############################################################################

var promptsFile = new PromptsFile();
promptsFile.init();




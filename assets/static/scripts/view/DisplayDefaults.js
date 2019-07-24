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

//View.DisplayDefaults = function () {}

View.prototype._setupDisplayDefaults = function() {
    this._setupUsername();
    this._setUpSpeakerCharacteristics();    
    this._setUpRecordingInformation();   

    this._setupPrompts();
}

// hide username instructions if there is something in the username field
View.prototype._setupUsername = function() {
    new View.DivBasedonValue(
        '#username',
        '#anonymous_instructions_display',        
        true);
}

View.prototype._setUpSpeakerCharacteristics = function() {
    this._setUpNativeSpeakerDependencies();
    this._setUpNativeSpeakerDefaults();    
    
    this._setUpFirstLanguageDependencies();
    this._setUpDialectDependencies();    
    this._setupSubDialectDependencies();
    
    this._setupLanguageLookup();    
}

/*
 *  Aside: this causes sub-dialect to display immediately rather than when Canadian or
    American dialect selected:
    showDivBasedonValue('#native_speaker', this.localized_yes, '#sub_dialect_display', false);
 */
View.prototype._setUpNativeSpeakerDependencies = function() {
    new View.DivBasedonValue(
        '#native_speaker',
        '#first_language_display',       
        this.localized_no,);
    new View.DivBasedonValue(
        '#native_speaker',
        '#dialect_display',       
        this.localized_yes,);
}

View.prototype._setUpNativeSpeakerDefaults = function() {
    new View.ElementDefault(
        '#native_speaker',
        '#first_language',  
        this.localized_yes,);
    new View.ElementDefault(
        '#native_speaker',
        '#dialect',  
        this.localized_no,);       
    new View.ElementDefault(
        '#native_speaker',
        '#sub_dialect',  
        this.localized_no,);  
}

View.prototype._setUpFirstLanguageDependencies = function() {
    new View.DivBasedonValue(
        '#first_language',
        '#first_language_other_display',       
        this.localized_other,);        
}

View.prototype._setUpDialectDependencies = function() {
    new View.DivBasedonValue(
        '#dialect',
        '#dialect_other_display',       
        this.localized_other,);           
}

View.prototype._setupSubDialectDependencies = function() {
    var dependentSelect = new View.DependentSelect(
        $('#dialect'),
        $('#sub_dialect'),
        $("#sub_dialect_display") );
    dependentSelect.setup()        
}

/**
* fill other languages select list with stringified array the names of most 
* ISO 639-1 language names
*/
View.prototype._setupLanguageLookup = function() {
    var langscodes = languages.getAllLanguageCode(); // array of language codes
    var option = '<option value="' + this.default_value +
        '">'+ this.please_select + '</option>';
    for (var i=1;i<langscodes.length;i++){
       option += '<option value="'+ langscodes[i] + '">' +
       languages.getLanguageInfo(langscodes[i]).name + " (" +
       languages.getLanguageInfo(langscodes[i]).nativeName + ")" +
       '</option>';
    }
    option += '<option value="' + this.localized_other + '">' +
        this.localized_other + '</option>';
        
    $('#first_language').append(option);
}

View.prototype._setUpRecordingInformation = function() {
    this._setupMicrophoneDependencies();
    this._setupRecordingLocationDependencies();
    this._setupBackgroundNoiseDependencies();
    this._setupNoiseTypeDependencies();
}

View.prototype._setupMicrophoneDependencies = function() {
    new View.DivBasedonValue(
        '#microphone',
        '#microphone_other_display',       
        this.localized_other,);          
}

View.prototype._setupRecordingLocationDependencies = function() {
    new View.DivBasedonValue(
        '#recording_location',
        '#recording_location_other_display',       
        this.localized_other,);           
}

View.prototype._setupBackgroundNoiseDependencies = function() {
    new View.DivBasedonValue(
        '#background_noise',
        '#background_noise_display',       
        this.localized_yes,);          
}

View.prototype._setupNoiseTypeDependencies = function() {
    new View.DivBasedonValue(
        '#noise_type',
        '#noise_type_other_display',       
        this.localized_other,);          
}

View.prototype._setupPrompts = function() {
    var self = this;
    
    this.maxnumpromptschanged = document.querySelector('#max_num_prompts');

    if (this.max_numPrompts_selector > 10) {
        this._displayPrompts();
    } else {
        $('#max_num_prompts-display').hide();
    }
    /**
    * updates the current number of prompts that the user selected from dropdown
    */
    //$('#max_num_prompts').click(function() { 
    $('#max_num_prompts').change(function() { 
        self.userChangedMaxNum( this.value.replace(/[^0-9\.]/g,'') );
        self.updateProgress();
    });
}

/**
* set default (device dependent) max number of prompts the user can record 
*/
View.prototype._displayPrompts = function() {
    var startPrompt = 10; // min number of prompts no matter what device
    var incr = 5;
    var option = ''; // clear previous use of option var    
    for (var i=startPrompt; i <= this.max_numPrompts_selector; i = i + incr) {
       option += '<option value="'+ i + '">' + i +  '</option>';
    }
    $('#max_num_prompts').append(option);
    $('#max_num_prompts-display').show();
}

// #############################################################################

/*
 * Contructor
 */
/**
* This function changes the contents of a 'dependent' select list based on the
* contents of a 'independent' select list.  This is used to set the 
* contents of the dependent sub-dialect selection list based on the value
* the independent dialect selection list.
*
* Read.md contains the entire list of possible subdialects for a language,
* this function filters those contents based on what is contained in dialect
* so that user only sees filtered results
*
* see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
* Store all #subdialect's options in a variable, filter them according 
* to the value of the chosen option in #dialect, and set them using 
* .html() in #subdialect:
*/
// TODO when only one optgroup, first selection is not immediately selectable
// need to select second or third option, then can select first option
// TODO if subdialect exists for dialect in on language (e.g. Canadian) and
// then switch to another language; subdialect does not get cleared
View.DependentSelect = function(
    $independent,
    $dependent,
    $dependent_display)
{
    this.$independent = $independent;
    this.$dependent = $dependent;
    this.$dependent_display = $dependent_display;
    
    this.$optgroup = $dependent.find( 'optgroup' );
    this.$selected = $dependent.find( ':selected' );
}

/*
 * Methods
 */
View.DependentSelect.prototype.setup = function() {
    var self = this;
        
    this.$independent.on( 'change', function() {
        self._filterOnDialectToFindSubdialect.call(self, this.value);
    })
    .trigger('change');
}

View.DependentSelect.prototype._filterOnDialectToFindSubdialect = function(value) {
    var filter =  this.$optgroup.filter( '[name="' + value + '"]' );

    if ( filter.length ) {
      filter = filter.add( this.$selected );
      this.$dependent_display.show();
      this.$dependent.html( filter );
    } else {
      this.$dependent_display.hide();
    }
    
    this.$dependent.val(self.default_value);                 
    this.$dependent.prop('defaultSelected');
}

// #############################################################################

/*
 * Constructor
 */
 
/**
* The value of contents of the independent_div is compared to the passed in 
* value, and if they are equal, then the dependent_div is displayed, otherwise
* it is hidden 
*
* showDivBasedonValue makes the view of one div dependent on the value of a select 
* field in another div, and attaches an event handler to independent div so that
* any changes in it are reflected in dependent div
*
* see https://stackoverflow.com/questions/15566999/how-to-show-form-input-fields-based-on-select-value
*/
View.DivBasedonValue = function(
    independent_div,
    dependent_div,
    value)
{
    this.independent_div = independent_div;
    this.dependent_div = dependent_div;    
    this.value = value;

    this.test();

    var self = this;    
    $(independent_div).change(
        self.test.bind(self));
}

/*
 * Methods
 */
View.DivBasedonValue.prototype.test = function() {
    if ( this._valueIsBoolean() ) {
        this._booleanTest();
    } else {
        this._valueCompare();
    }
}

View.DivBasedonValue.prototype._valueIsBoolean = function() {
    return typeof(this.value) === "boolean";
}

// show if false; hide if true
View.DivBasedonValue.prototype._booleanTest = function() {
    if ( this.value === true ) {
        this._showBasedOnContentsOfIndependentDiv(
            ! $(this.independent_div).val() );
    }
}

View.DivBasedonValue.prototype._valueCompare = function() {
    this._showBasedOnContentsOfIndependentDiv(
        $(this.independent_div).val() === this.value );
}

View.DivBasedonValue.prototype._showBasedOnContentsOfIndependentDiv = function(
    boolean_result)
{
    if( boolean_result ){
        $(this.dependent_div).show();
    } else {
        $(this.dependent_div).hide();
    }
}

// #############################################################################

/*
 * Contructor
 */
View.ElementDefault = function(
    independent_div,
    dependent_div,    
    value,)
{
    this.independent_div = independent_div;
    this.dependent_div = dependent_div;    
    this.value = value;

    this._set();

    var self = this;
    $(independent_div).change(
        self._set.bind(self) );    
}

/*
 * Methods
 */
View.ElementDefault.prototype._set = function() {
    if ( $( this.independent_div).val() === this.value ) {
       $(this.dependent_div).val($("select option:first").val()).change();
    }
}


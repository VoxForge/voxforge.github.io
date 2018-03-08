// display variables
var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var upload = document.querySelector('.upload');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

/**
* Set up toggles for profile and direction buttons
*/
function profileInfo() {  $("#profile-display").toggle(); }
function speakerCharacteristics() {  
  $("#speaker_characteristics_display").toggle(); 
  $("#recording_information_display").hide();
}
function recordingInformation() {  
  $("#recording_information_display").toggle(); 
  $("#speaker_characteristics_display").hide(); 
}
function directionsInfo() {  $("#directions-display").toggle(); }
/**
* hide buttons after user makes a submission.  No need to show user information
* he just entered, and info is still accessible with profile button
*/
// TODO does this ever get executed?
if ( $.cookie('all_done') ) 
{
  $("#profile-display").hide();
  $("#profile-button-display").show();
}


/**
* ### STATIC METHODS ##############################################
*
* see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
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
Profile.showDivBasedonValue = function (independent_div, value, dependent_div, handler_already_created) {
  function test ( boolean_result ) {
    if( boolean_result ){
      $(dependent_div).show();
    } else {
      $(dependent_div).hide();
//      if (value === page_localized_other) { // trying to clear text in other field if user unselects
//         $(dependent_div).empty();
//      }
    }
  }

  if ( typeof(value) === "boolean" && value === true ) { 
    // show if false; hide if true
    test( ! $(independent_div).val() );
  } else {
    test( $(independent_div).val()===value );
  }

  // only need to create event handler on first call to this function
  if ( ! handler_already_created ) 
  {
    $(independent_div).change(function () { // creates an event handler
        Profile.showDivBasedonValue(independent_div, value, dependent_div, true); 
    } );
  }
}

Profile.showDivBasedonValue('#native_speaker', page_localized_no, '#first_language_display', false);
Profile.showDivBasedonValue('#native_speaker', page_localized_yes, '#dialect_display', false);
Profile.showDivBasedonValue('#first_language', page_localized_other, '#first_language_other_display', false);
// true means hide if there is something in the username field
Profile.showDivBasedonValue('#username', true, '#anonymous_instructions_display', false); 
Profile.showDivBasedonValue('#microphone', page_localized_other, '#microphone_other_display', false);
Profile.showDivBasedonValue('#dialect', page_localized_other, '#dialect_other_display', false);
Profile.showDivBasedonValue('#recording_location', page_localized_other, '#recording_location_other_display', false);
Profile.showDivBasedonValue('#background_noise', page_localized_yes, '#background_noise_display', false);
Profile.showDivBasedonValue('#noise_type', page_localized_other, '#noise_type_other_display', false);


/**
* This function changes the contents of a second select list based on the
* contents of a first select list.  This is used to set the 
* contents of the sub-dialect selection list based on the value the dialect
* selection list.
*
* see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
* Store all #subdialect's options in a variable, filter them according 
* to the value of the chosen option in #dialect, and set them using 
* .html() in #subdialect:
*/
var $select1 = $( '#dialect' );
$( '#sub_dialect select' ).val("Unknown");
var $select2 = $( '#sub_dialect' );
$optgroup = $select2.find( 'optgroup' );
$selected = $select2.find( ':selected' );
$result = $optgroup.add( $selected );

$select1.on( 'change', function() {
    var filter =  $result.filter( '[name="' + this.value + '"]' );
    var temp = filter.val();
    if ( filter.length ) {
      $("#sub_dialect_display").show();
  	  $select2.html( filter );
    }
    else
    {
      $("#sub_dialect_display").hide();
    }
    $select2.prop('defaultSelected');
} ).trigger( 'change' );


/**
* fill other languages select list with stringified array the names of most 
* ISO 639-1 language names
*/
var langscodes = languages.getAllLanguageCode(); // array of language codes
//var option = ''; // string
var option = '<option value="Unknown">'+ page_please_select + '</option>';
for (var i=1;i<langscodes.length;i++){
   option += '<option value="'+ langscodes[i] + '">' +
   languages.getLanguageInfo(langscodes[i]).name + " (" +
   languages.getLanguageInfo(langscodes[i]).nativeName + ")" +  
   '</option>';
}
option += '<option value="' + page_localized_other + '">' + page_localized_other + '</option>'; 
$('#first_language').append(option);


/**
* updates the current number of prompts that the user selected from dropdown
*/
$('#max_num_prompts_disp').click(function () { 
  prompts.max_num_prompts = this.value.replace(/[^0-9\.]/g,'');
  prompts.initPromptStack();
  updateProgress();

  console.log('max_num_prompts:' + prompts.max_num_prompts);
});

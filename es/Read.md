---
layout: record
title: Read
menu: Read
ref: read
lang: es
permalink: /es/read/
weight: 2

################################################################################

total_number_of_prompts: 43
prompt_list_files:
  - id: "001"
    start: 0
    file_location: /es/prompts/001
    number_of_prompts: 43
    contains_promptid: false
    prefix: es

# need trailing slash for testing on localserver 
# see: https://github.com/barryclark/jekyll-now/issues/13


username_label: Username
anonymous: anonymous
anonymous_submission: (leave blank to submit anonymously)
profile_info: Profile Info

# Yes and No must be in quotes, otherwise evaluates to true/false
# can't use 'yes' or 'no' as variable names in YAML
localized_variable:
  lv_yes: "Yes"
  lv_no: "No"
  other: "Other"

please_select: Please Select
speaker_characteristics: Speaker Characteristics

gender:
  label: Gender
  selection:
    - Male
    - Female
    - Other

age:
  label: Age
  selection:
    - { value: '<20', old_value: 'Youth' }
    - { value: '20 - 29', old_value: 'Adult' }
    - { value: '30 - 39', old_value: 'Adult' }
    - { value: '40 - 49', old_value: 'Adult' }
    - { value: '50 - 59', old_value: 'Adult' }
    - { value: '60 - 69', old_value: 'Adult' }
    - { value: '70 - 79', old_value: 'Senior' }
    - { value: '80 - 89', old_value: 'Senior' }
    - { value: '>89', old_value: 'Senior' }

language_id: EN
# - leave a blank line between groupings of hash/objects; otherwise liquid does 
# not parse properly
# - Yes and No must be in quotes, otherwise evaluates to true/false
native_speaker:
  label: Native Speaker?
  popup_link: 'https://en.wikipedia.org/wiki/First_language'
  popup_text: someone who speaks a language as his or her first language or mother tongue.
  selection:
    - "Yes"
    - "No"

first_language:
  label: First Language
  popup_link: https://en.wikipedia.org/wiki/First_language
  popup_text: language that a person has been exposed to from birth or within the critical period.
  other_label: Other First Language

# see https://en.wikipedia.org/wiki/Regional_accents_of_English
# ( https://en.wikipedia.org/wiki/List_of_dialects_of_the_English_language
# https://en.wikipedia.org/wiki/Non-native_pronunciations_of_English 
dialect:
  label: Pronunciation Dialect
  popup_link: https://en.wikipedia.org/wiki/Dialect
  popup_text: variety of a language that is a characteristic of a particular group of the language's speakers.
  selection:
  - [British Isles, [British English, Scottish English, Welsh English, Irish English]]
  - [European, [European English]]
  - [North America, [Canadian English, American English, West Indies and Bermuda]]
  - [Southern hemisphere, [Australian English, New Zealand English, South Atlantic English, South African English]]
  - [Asia, [Indian English, Philippine English, Hong Kong English, Malaysian English,  Singapore English]]
  - [Other, [Other]]
  other_label: Other Dialect

# see: https://en.wikipedia.org/wiki/North_American_English_regional_phonology
sub_dialect:
  label: Sub Dialect
  popup_link: https://en.wikipedia.org/wiki/North_American_English_regional_phonology
  popup_text: (or regional phonology) looks at variations in the pronunciation of a spoken language
  selection_dialect: # this is array that keeps elements in order
    - American English
    - Canadian English
  selection: # this is hash that keys on dialect
    American English:
      - [Western United States, [Pacific Northwest]]
      - [Greater New York City, [Greater New York City]]
      - [Northern and North-Central United States, [North, New England, North Central]]
      - [Southeastern United States, [Midland, Mid-Atlantic, South, Marginal Southeast]]
    Canadian English:
      - [Canadian English, [Atlantic, Central, West]]

recording_information: Recording Information

microphone:
  label: Microphone Type
  selection:
    - Analog Microphone
    - USB Microphone
    - Laptop Builtin Microphone
    - Smartphone
    - Tablet
    - Microphone Array/Far Field Mic
    - Other
  other_label: Other Microphone Type

recording_location:
  label: Recording Location
  selection:
    - Indoors
    - Outdoors
    - Vehicle
    - Other
  other_label: Other Recording Location

background_noise:
  label: Is There Background Noise?
  selection:
    - "Yes"
    - "No"

noise_volume:
  label: Noise Volume
  selection:
    - Low - constant
    - Low - intermitent
    - Moderate - constant
    - Moderate - intermitent
    - Loud - constant
    - Loud - intermitent

noise_type:
  label: Noise Type
  selection:
    - Crowd
    - Electronic Equipment
    - Echo
    - Fan/Air Conditioner
    - Machinery
    - Nature sounds
    - Talking
    - Music
    - Traffic
    - TV
    - Video
    - Weather Related (wind/rain...)
    - Other
  other_label: Other Type of Noise

license:
  label: License
  popup:
    title: Creative Commons Licences
    link: https://creativecommons.org/licenses/
    hover_text: >
      CC0 - Public Domain Dedication
      CC BY - Attribution
      CC BY-SA - Attribution-ShareAlike
      GPLv3 - GNU General Public License
    text:  > 
      <b>CC0 - Public Domain Dedication</b> you dedicate this work to the
      public domain by waiving all of your rights to the work worldwide
      under copyright law</br>
      <b>CC BY - Attribution</b>  This license lets others distribute, remix, 
      tweak, and build upon your work, even commercially, as long as they 
      credit you for the original creation</br>
      <b>CC BY-SA - Attribution-ShareAlike </b>  This license lets others 
      remix, tweak, and build upon your work even for commercial purposes, 
      as long as they credit you and license their new creations under the 
      identical terms.  </br>
      <b>GPLv3 </b> similar to CC BY-SA, but made for software... used by
      VoxForge 1.0 corpus.
  selection_default: CC0 - Creative Commons - No rights Reserved 
  selection:
    - CC BY - Attribution
    - CC BY-SA - Creative Commons Attribution-ShareAlike
    - GPLv3 - GNU General Public License

ua_string:
  label: Include User Agent
  popup:
    title: Collect User Agent String Information
    link: https://www.whatismybrowser.com/detect/what-is-my-user-agent
    hover_text: >
      Include User Agent string with submission
    text:  > 
      Your browser's user agent indicates something particular about your system.</br>
      The VoxForge app can collect your browser's user agent string
      to troubleshoot and help determine which devices work best with the
      VoxForge recording app
  selection_default: { value: 'Yes',  item: 'Yes' }
  selection:
    - { value: 'No',  option: 'No' }

num_prompts:
  label: Number of prompts to read

instructions:
  label: Instructions
  lines:
    - 1. Press <b>Record</b> to start, saying only the words that appear in the box below.
    - 2. Press <b>Stop</b> when completed.
  lastline: >
    3. When done, press <b>Upload</b> to send your recordings to VoxForge server.

controls:
  record: Record
  stop: Stop
  upload: Upload
  upload_message: >
    "Are you ready to upload your submission?\nIf not, press Cancel now, 
    and then press Upload once you are ready."

browser_support:
  no_worker_message: >
    "Your browser does not support service or web workers, please
    upgrade to a current version of a Free and Open Source browser such as 
    Chrome or Firefox."
  no_indexedDB_message: >
    "Your browser does not support indexedDB for offline storage of 
    submissions, please upgrade to a current version of a Free and Open 
    Source browser such as Chrome or Firefox."
  no_formDataSupport_message: >
    "Browser does not support FormData... please install 
    a current version of a Free and Open Source browser such as Chrome or 
    Firefox"
  no_edgeSupport_message: >
    "Microsoft proprietary browsers not supported... please install 
    a current version of a Free and Open Source browser such as Chrome or 
    Firefox"
  no_FirefoxAndroid_message: >
    Unfortunately, using the VoxForge app with the Firefox browser on Android
    results in audio artifacts (scratches and pops) being included in wav file, 
    please use Chrome.

alert_message:
  serviceworker: serviceworker
  webworker: webworker
  submission_singular: submission
  submission_plural: submissions
  localstorage_message: >
    Submission saved to browser storage.
  browsercontains_message: >
    Your browser storage contains
  uploaded_message: >
    uploaded to VoxForge Server
  audio_too_loud: >
    Your recording is too loud!<br>
    Please reduce your microphone volume<br>
    delete this recording and re-record the prompt
  audio_too_soft: >
    Your recording levels are too low!  <br>Please increase your microphone volume, 
    then delete this prompt recording and re-record it.
  audio_too_loud_autogain: >
    Your recording is too loud!<br>
    automatically decreasing volume<br>
    delete this recording and re-record the prompt
  audio_too_soft_autogain: >
    Your recording levels are too low!<br>
    automatically increasing volume<br>
    delete this recording and re-record the prompt
  no_trailing_silence: >
    No trailing silence.  You cut your recording off (clicked 'stop' too early) </br>Please delete and 
    re-record this prompt.
  no_speech: >
    No Speech </br>Please delete and re-record this prompt.
  getUserMedia_error: >
    Could not get audio input,,, make sure your microphone is connected to your 
    computer.  Your browser is giving this error message:
  notHtml5_error: >
    Your device does not support the HTML5 API needed to record audio

# script below gets loaded in {{ content }} section of layout page
---
<script>
  var page_localized_yes= "{{ page.localized_variable.lv_yes }}";
  var page_localized_no= "{{ page.localized_variable.lv_no }}";
  var page_localized_other= "{{ page.localized_variable.other }}";
  var page_language= "{{ page.lang }}";
  var page_prompt_list_files = {{ page.prompt_list_files | jsonify }};
  var page_total_number_of_prompts = {{ page.total_number_of_prompts }};
  var page_please_select = "{{ page.please_select }}";
  var page_anonymous = "{{ page.anonymous }}";
  var page_upload_message = {{ page.controls.upload_message }};
  var page_alert_message = {{ page.alert_message  | jsonify}};
  var page_browser_support = {{ page.browser_support  | jsonify}};
</script>



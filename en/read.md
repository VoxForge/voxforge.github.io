---
layout: record
title: Read Prompts and Record Speech
menu: Read
ref: read
lang: en
# set permalink in _config.yml
#permalink: /en/read

# using apache2: https://jekyll_voxforge.org/home/read redirect does not work
# using jekyll server: http://localhost:4000/home/read redirects to http://localhost:4000/en/read/
# using github pages: http://voxforge.github.io/home/read redirect does not work
redirect_from: /home/read

weight: 2

################################################################################

# TODO remove .html subffixes for prod
# first prompt file (id: "001") gets cached by service worker
total_number_of_prompts: 1176
prompt_list_files:
  - id: "001"
    start: 0
    file_location: /en/prompts/001.html
    number_of_prompts: 594
    contains_promptid: false
    prefix: en
  - id: "002"
    start: 594
    file_location: /en/prompts/002.html
    number_of_prompts: 299
    contains_promptid: false
    prefix: en
  - id: "003"
    start: 894
    file_location: /en/prompts/003.html
    number_of_prompts: 282
    contains_promptid: false
    prefix: en

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

language_id: EN

# see https://en.wikipedia.org/wiki/Regional_accents_of_English
# ( https://en.wikipedia.org/wiki/List_of_dialects_of_the_English_language
# https://en.wikipedia.org/wiki/Non-native_pronunciations_of_English 
dialect:
  selection:
  - [British Isles, [British English, Scottish English, Welsh English, Irish English]]
  - [European, [European English]]
  - [North America, [Canadian English, American English, West Indies and Bermuda]]
  - [Southern hemisphere, [Australian English, New Zealand English, South Atlantic English, South African English]]
  - [Asia, [Indian English, Philippine English, Hong Kong English, Malaysian English,  Singapore English]]
  - [Other, [Other]]

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




controls:
  record: Record
  stop: Stop
  upload: Upload
  upload_message: >
    "Are you ready to upload your submission?\nIf not, press Cancel now, and 
    then press Upload once you are ready."

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
    "Microsoft browsers not supported... please install 
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
    Cannot connect to server.  Your submission has been saved to your
    browser's internal storage.  It will be uploaded with next submission you 
    make when the VoxForge server is accessible.
  browsercontains_message: >
    Your browser storage contains
  uploaded_message: >
    uploaded to VoxForge Server:
  audio_too_loud: >
    Your recording is too loud!<br>
    Please reduce your microphone volume<br>
    delete this recording and re-record the prompt
  audio_too_soft: >
    Your recording levels are too low!<br>
    Please increase your microphone volume, 
    then delete this prompt recording and re-record it.
  no_speech: >
    No Speech or recording volume too low<br>
    Please increase your microphone volume,
    then delete and re-record this prompt.
  audio_too_loud_autogain: >
    Your recording is too loud!<br>
    Automatically decreasing volume.<br>
    Please delete this recording and re-record the prompt.
  audio_too_soft_autogain: >
    Your recording levels are too low!<br>
    Automatically increasing volume.<br>
    Please delete this recording and re-record the prompt.
  no_speech_autogain: >
    No Speech or recording volume too low.<br>
    Automatically increasing volume.<br>
    Please delete this recording and re-record the prompt.
  no_trailing_silence: >
    Not enough trailing silence - you clicked 'stop' too early! <br>
    You did not leave enough silence at the end of your recording, or you
    cut-off the end of your recording<br>
    Please delete and re-record this prompt.

  getUserMedia_error: >
    Could not get audio input... make sure your microphone is connected to your 
    computer.  Your browser is giving this error message:
  notHtml5_error: >
    Your device does not support the HTML5 API needed to record audio

# script below gets loaded in {{ content }} section of layout page
# these are used by Javascript, therefore need special handling for them to 
# work as expected
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
  var page_license = {{ page.license  | jsonify}};
</script>



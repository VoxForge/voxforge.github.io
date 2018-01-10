---
layout: record
title: Read
menu: Read
weight: 2
ref: read
lang: en
permalink: /en/read
redirect_from: /home/read

username_label: Username
anonymous_submission: (leave blank to submit anonymously)
profile_info: Profile Info

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
# leave a space between groupings of hash/objects; otherwise liquid does not parse properly
# Yes and No must be in quotes, otherwise evaluates true/false
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
  selection_dialect: # this is an array that keeps elements in order
    - American English
    - Canadian English
  selection: # this is a hash that keys on dialect
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
    - Inside
    - Outside
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
  other_label: Type of Noise

license:
  label: License
  selection:
    - CC0 - Creative Commons - No rights Reserved (default)
    - CC BY-SA - Creative Commons Attribution-ShareAlike
    - GPLv3 - GNU General Public License

num_prompts:
  label: Number of prompts to read

instructions:
  label: Instructions
  line1: 1. Press <b>Record</b> to start, saying only the sentence that appears in the box below.
  line2: 2. Press <b>Stop</b> when completed.
  line3: 3. When all the requested prompts are completed, you'll be prompted to <b>Upload</b> your recordings.
  edge:
    mouse_over_text: For Microsoft Edge browser, click here to see how to tell Windows that Edge can use your microphone.
    popup:
      title: Windows - How to give your Edge browser permission to use your microphone
      link: https://privacy.microsoft.com/en-us/windows-10-camera-and-privacy
      text:  > 
        1. Go to Start, then select Settings > Privacy > Microphone.</br> 
        2. Choose your preferred setting for Let apps use my microphone.</br>
        3. Under Choose apps that can use your microphone, turn on the individual setting for the Edge browser.</br>



---






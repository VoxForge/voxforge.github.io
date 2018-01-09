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
  other_label: First Language - Other

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
  other_label: Dialect - Other

# see: https://en.wikipedia.org/wiki/North_American_English_regional_phonology
sub_dialect:
  label: Sub Dialect
  popup_link: https://en.wikipedia.org/wiki/North_American_English_regional_phonology
  popup_text: (or regional phonology) looks at variations in the pronunciation of a spoken language
  selection_dialect:
    - American English
    - Canadian English
  selection:
    American English:
      - [Western United States, [Pacific Northwest]]
      - [Greater New York City, [Greater New York City]]
      - [Northern and North-Central United States, [North, New England, North Central]]
      - [Southeastern United States, [Midland, Mid-Atlantic, South, Marginal Southeast]]
    Canadian English:
      - [Canadian English, [Atlantic, Central, West]]

please_select: Please Select
---







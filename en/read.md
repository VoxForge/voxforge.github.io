---
# See: _data/read/default.yaml for default variables

layout: record
title: VoxForge Speech Recorder
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

# first prompt file (id: "001") gets cached by service worker
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

---


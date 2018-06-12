---
layout: prompts_file
lang: en
permalink: /en/promptsFile/

# TODO remove .html subffixes for prod
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
---
<script>
  var page_language= "{{ page.lang }}";
  var page_prompt_list_files = {{ page.prompt_list_files | jsonify }};
  var page_total_number_of_prompts = {{ page.total_number_of_prompts }};
</script>


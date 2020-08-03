---
# wè: _data/read/default.yaml for default variables

layout: record
title: VoxForge anrejistratè pawòl
menu: Li
ref: li
lang: ht
# fè lyen pèmanan an na _config.yml
#lyen pèmanan: /ht/li

# lèw itilize apache2: https://jekyll_voxforge.org/akèy/li redirije an pa mache
# lèw itilize jekyll server: http://localhost:4000/akèy/li li ap redirije bay http://localhost:4000/ht/li/
# lèw itilize github pages: http://voxforge.github.io/akèy/li redirije an pa mache
redirect_from: /akèy/li

weight: 2

################################################################################

# first prompt file (id: "001") gets cached by service worker
prompt_list_files:
  - id: "001"
    start: 0
    file_location: /ht/prompts/001.html
    number_of_prompts: 414
    contains_promptid: false
    prefix: ht
  - id: "002"
    start: 414
    file_location: /ht/prompts/002.html
    number_of_prompts: 299
    contains_promptid: false
    prefix: ht
  - id: "003"
    start: 894
    file_location: /ht/prompts/003.html
    number_of_prompts: 189
    contains_promptid: false
    prefix: ht


username_label: non itilizatè
anonymous: anonim
anonymous_submission: (kite vid pou soumèt anonim)
profile_info: Pwofil
default_value: anyen

# Yes and No must be in quotes, otherwise evaluates to true/false
# can't use 'yes' or 'no' as variable names in YAML
localized_variable:
  lv_yes: "Wi"
  lv_no: "Non"
  other: "Yon Lòt"

please_select: Tanpri Chwazi
speaker_characteristics: Karakteristik Oratè a

gender:
  label: Sèks
  selection:
    - Gason
    - Fanm
    - Lòt

age:
  label: Laj
  selection:
    - { value: '13 - 17', old_value: 'Jèn', desc: 'Jèn' }
    - { value: '18 - 29', old_value: 'Adilt', desc: 'Adilt' }
    - { value: '30 - 39', old_value: 'Adilt', desc: 'Adilt' }
    - { value: '40 - 49', old_value: 'Adilt', desc: 'Adilt' }
    - { value: '50 - 59', old_value: 'Adilt', desc: 'Adilt' }
    - { value: '60 - 64', old_value: 'Adilt', desc: 'Adilt' }
    - { value: '65 - 74', old_value: 'Moun aje', desc: 'Moun aje' }
    - { value: '> 75', old_value: 'Moun aje', desc: 'Moun aje' }

# - leave a blank line between groupings of hash/objects; otherwise liquid does 
# not parse properly
# - Yes and No must be in quotes, otherwise evaluates to true/false
# TODO test this with new approach to global variables...
native_speaker:
  label: Oratè natif natal?
  popup_link: https://translate.google.com/translate?hl=en&sl=auto&tl=ht&u=https%3A%2F%2Ffr.wiktionary.org%2Fwiki%2Flocuteur_natif&sandbox=1
  popup_text: Moun ki pale lang lan tankou yon lang matènèl.
  selection:
    - "Wi"
    - "Non"

first_language:
  label: Lang matènèl
  popup_link: https://translate.google.com/translate?hl=en&sl=auto&tl=ht&u=https%3A%2F%2Ffr.wikipedia.org%2Fwiki%2FLangue_maternelle
  popup_text: refere a premye lang yon timoun aprann.
  other_label: Lòt lang matènèl

# wè https://en.wikipedia.org/wiki/Regional_accents_of_English
# ( https://en.wikipedia.org/wiki/List_of_dialects_of_the_English_language
# https://en.wikipedia.org/wiki/Non-native_pronunciations_of_English
# dènye seleksyon an dwe idantik localized_variable.other  pou ke skrip lan
# kreye yon bwat pou sezi tèks pou itilizatè an ka natre yon lòt dyalèk
dialect:
  selection:
  - [Ayiti, [Kreyòl Aysyen]]
  

recording_information: Enfòmasyon anrejistreman

microphone:
  label: Kalite mikwo
  selection:
    - Mikwo analog
    - Mikwo USB
    - Mikwo pòtab
    - Telefòn entelijan
    - Tablèt
    - Mikwofòn a chan elwanye
    - Lòt
  other_label: Lòt Mikwo 

recording_location:
  label: Kote anrejistreman an ap fèt
  selection:
    - Anndan
    - Deyò
    - Nan machin
    - Lòt
  other_label: Lòt kote

background_noise:
  label: Èske gen bri kote ou ye a?
  selection:
    - "Wi"
    - "Non"

noise_volume:
  label: Nivo bri a
  selection:
    - Bri fèb - konstan
    - Bri fèb - tanzantan
    - Bri modere - konstan
    - Bri modere - tanzantan
    - Bri fò - konstan
    - Bri fò - tanzantan

noise_type:
  label: Ki Kalite bri?
  selection:
    - Foul
    - Ekipman elektwonik
    - eko
    - Vantilatè / èkondisyone
    - Machin
    - Son lanati
    - Konvèsasyon
    - Mizik
    - Trafik
    - Televizyon
    - videyo
    - Lameteyo (van / lapli ...)
    - lòt
  other_label: Lòt Kalite bri

license:
  label: Licence
  popup:
    title: Creative Commons Licences
    link: https://translate.google.com/translate?hl=en&sl=auto&tl=ht&u=https%3A%2F%2Fcreativecommons.org%2Flicenses%2F%3Flang%3Dht
    hover_text: >
      CC0 1.0 - Creative Commons Public Domain Dedication;
      CC BY 4.0 - Creative Commons Attribution;
      CC BY-SA 4.0 - Creative Commons Attribution-ShareAlike;
      GPLv3 - GNU General Public License.
    text:  > 
      <b>CC0 - Creative Commons - San Dwadotè </b> pèmèt mèt copyright lan
      bay tout dwa yo epi mete yon travay nan domèn piblik lan. <br>
      <b>CC BY - Creative Commons - Atribisyon </b> lisans sa a pèmèt lòt moun distribye,
      remix, fè aranjman, ak adapte travay ou, menm pou bi komèsyal,
      osi lontan ke yo ba ou kredi pou kreyasyon orijinal la pa site
      non ou. <br>
      <b>CC BY-SA - Creative Commons - Atribisyon - Pataje anba menm kondisyon yo </b> lisans sa a
      pèmèt lòt moun remix, fè aranjman, ak adapte travay ou,
      menm pou rezon komèsyal, osi lontan ke yo ba ou kredi pou site
      non ou ak ke nou distribye kreyasyon yo nouvo anba kondisyon yo
      idantik. <br>
      <b>GPLv3 GNU General Public License</b> menm jan ak CC BY-SA, men fèt pou lojisyèl ... itilize pa ...
      VoxForge 1.0 corpus.
  selection_default: { value: 'CC0',  item: 'CC0 - Creative Commons - San Dwadotè (defo)' }
  selection:
    - { value: 'CC_BY',     option: 'CC BY - Creative Commons - Atribisyon' }
    - { value: 'CC_BY-SA',  option: 'CC BY-SA -  Creative Commons - Atribisyon - Pataje anba menm kondisyon y' }
    - { value: 'GPLv3',     option: 'GPLv3 - GNU General Public License' }

num_prompts:
  label: Kantite fraz pou li

instructions:
  label: Enstriksyon
  lines: 
    - 1. Peze <b> Anrejistre </b> pou kòmanse, epi di sèlman fraz ki parèt nan ti bwat ki anba a.
    - 2. Peze <b> Kanpe </b> lè ou fini.
  lastline: >
    3. Lè fini, peze <b> Telechaje </b> pou voye anrejistreman ou yo nan sèvè VoxForge mwen an.

controls:
  record: Anrejistre
  stop: Kanpe
  upload: Telechaje
  play: Jwe

browser_support:
  no_worker_message: >
    "Navigatè ou a pa sipòte 'travayè sèvis' oswa
    'travayè entènèt', tanpri mete ajou navigatè ou a
    (oswa enstale yon vèsyon aktyèl la nan yon navigatè gratis ak Sous louvri
    tankou Chrome oswa Firefox) "
  no_indexedDB_message: >
    "Navigatè ou a pa sipòte indexedDB pou backup offline
    soumèt, tanpri tanpri mete ajou navigatè ou a
    (oswa enstale yon vèsyon aktyèl la nan yon navigatè gratis ak Sous louvri
    tankou Chrome oswa Firefox) "
  no_formDataSupport_message: >
    "Navigatè ou a pa sipòte FormData ... tanpri enstale
    yon vèsyon aktyèl nan yon gratis ak navigatè Sous Open tankou Chrome oswa
    Firefox "
  no_edgeSupport_message: >
    "Navigatè Microsoft yo pa sipòte ... tanpri enstale
    yon vèsyon aktyèl nan yon gratis ak 'Open Sous' navigatè tankou Chrome oswa
    Firefox "

# localstorage_message - <br> or \n line breaks don't work...
alert_message:
  localstorage_message: >
    Nou pa ka konekte sèvè a.
    Soumèt sove nan depo navigatè.
    Li pral telechaje ak soumèt nan pwochen te fè ak koneksyon sou sèvè a.
  browsercontains_message: >
    Depo navigatè ou a gen ladan li 
  uploaded_message: >
    telechaje sou sèvè web VoxForge mwen an
  serviceworker: serviceworker
  webworker: webworker
  workernotfound: worker type not found  
  submission_singular: soumisyon
  submission_plural: soumisyon yo

  getUserMedia_error: >
    Nou pa ka jwenn opinyon odyo ... asire w mikwofòn ou
    konekte ak òdinatè w lan. <br> Navigatè ou a bay mesaj erè sa a:
  notHtml5_error: >
    Aparèy ou an pa sipòte API HTML5 ki nesesè pou anrejistre odyo
  rec_info_activated: >
    Seksyon nan "Enfòmasyon anrejistreman" aktive anba "Profile".
    Seksyon sa a sèvi ak sèvis la jeolokalizasyon
    navigatè default ou a fè ou sonje pou tcheke enfòmasyon ou
    anrejistreman si pozisyon ou chanje. Sèvi ak sèvis sa a
    geolocation ka enfim nan paramèt yo.
  time_limit: >
    Li te gen kèk tan depi dènye soumèt ou: Si ou
    tanpri revize paramèt anrejistreman ou yo epi si sa nesesè
    mete ajou kote ou ye a ak nivo bri ou.
  location_change: >
    Chanjman nan kote: Tanpri revize paramèt enskripsyon ou
    ak Si sa nesesè, mete ajou kote ou ak nivo bri.
  noise_Turn_Off_Vad: >
    Gen anpil bri. Si ou vle ou ka fèmen DAV a (Deteksyon Aktivite Vokal) nan Paramèt, apre sa, efase ak re-anrejustre.

speechCharacteristics:
  audio_too_loud_short: 'Erè: Volim lan twò fò.'
  audio_too_loud_text: >
    Volim twò fò.
    Tanpri diminye volim ou a epi re-anrejistre.
  audio_too_soft_short: 'Avètisman: Volim twò ba.'
  audio_too_soft_text: >  
    Volim ou a ba anpil.
    sistèm lan ogmante volim la otomatikman
    Tanpri re-anrejistre.
  no_trailing_silence_short: 'Avètisman: Anrejistreman an koupe'
  no_trailing_silence_text: >  
    Li posib ke pa gen ase silans nan fen
    anrejistreman ou a (sètadi ou klike 'kanpe' twò bonè).
    Tanpri asire w ke gen kèk silans (omwen
    1/4 segond) nan fen anrejistreman an.
    Sinon, efase li epi anrejistre l ankò.
  no_speech_short: "Erè: Pa gen odyo anrejistre!"
  no_speech_text: >  
    Pa gen anrejistre vwa odyo! Tanpri efase epi re-anrejistre.
    Nou pa tande anyen (oswa volim mikwo ou a twò ba) lè w ap anrejistre a.
    Tanpri ogmante volim nan mikwofòn ou a e tanpri efase
    epi re-anrejistre ...

settings:
  title: Paramèt
  none: null
  recording_information_text: Rapèl
  recording_information_text_2: >
    (pou fè ou sonje pou asire w paramèt enfòmasyon pou
    anrejistreman ou yo toujou valab si ou te chanje kote
    depi dènye anrejistreman ou a).
  display_record_info: >
    Montre seksyon "Enfòmasyon Anrejistreman" an
  recording_time_reminder: >
    itilize tan depi dènye anrejistreman ou pou detèmine
    ki lè pou raple m.
  recording_geolocation_reminder: >
    Rapèl chanjman nan kote anrejistreman fèt la ak jeolokalizasyon
    
  resource_intensive_text: Fonksyon entansif pou resous yo
  resource_intensive_text_2: >  
    (dezaktive yo pou amelyore kalite anrejistreman sou
    aparèy ba konsomasyon)
  vad_run: Deteksyon Aktivite Vokal (DAV)

  audio_visualizer: Vizyalizatè Odyol
  waveform_display: Affichaj fòm ond pou chak anrejistreman
  saved_submissions: N ap tann pou telechaje (li anrejistre nan memwa navigatè a)
  uploaded_submissions: Soumisyon to telechaje
  system_information_text: Enfòmasyon sistèm
  system_information_text_2: (enkli nan soumisyon an)
  ua_string: Ajan Itilizatè
  debug_text: Paramèt odyol navigatè a  


---


---
layout: record
title: Read
menu: Read
ref: read
lang: fr
permalink: /fr/read
weight: 2

################################################################################

# TODO remove .html subffixes for prod
total_number_of_prompts: 865
# sequence number start, url to prompt file
prompt_list_files:
  - id: "001"
    file_location: /fr/prompts/001.html
    contains_promptid: true
    number_of_prompts: 865

username_label: Nom d'utilisateur
anonymous: anonymous
anonymous_submission: (laisser vide pour soumettre anonymement)
profile_info: Profil

# Yes and No must be in quotes, otherwise evaluates to true/false
# can't use 'yes' or 'no' as variable names in YAML
localized_variable:
  lv_yes: "Oui"
  lv_no: "Non"
  other: "Autre"

please_select: Veuillez Sélectionnez
speaker_characteristics: Characteristique du locuteur

gender:
  label: Sexe
  selection:
    - Masculin
    - Féminin
    - Autre

age:
  label: Tranche d'âge
  selection:
    - { value: '<20', old_value: 'Jeune' }
    - { value: '20 - 29', old_value: 'Adulte' }
    - { value: '30 - 39', old_value: 'Adulte' }
    - { value: '40 - 49', old_value: 'Adulte' }
    - { value: '50 - 59', old_value: 'Adulte' }
    - { value: '60 - 69', old_value: 'Adulte' }
    - { value: '70 - 79', old_value: 'Senior' }
    - { value: '80 - 89', old_value: 'Senior' }
    - { value: '>89', old_value: 'Senior' }

language_id: FR
# - leave a blank line between groupings of hash/objects; otherwise liquid does 
# not parse properly
# - Yes and No must be in quotes, otherwise evaluates to true/false
# TODO test this with new approach to global variables...
native_speaker:
  label: Locuteur natif?
  popup_link: https://fr.wiktionary.org/wiki/locuteur_natif
  popup_text: Personne qui parle la langue en question comme langue maternelle.
  selection:
    - "Oui"
    - "Non"

first_language:
  label: Langue maternelle
  popup_link: https://fr.wikipedia.org/wiki/Langue_maternelle
  popup_text: désigne la première langue qu'un enfant apprend.
  other_label: Autre langue maternell

# see https://en.wikipedia.org/wiki/Regional_accents_of_English
# ( https://en.wikipedia.org/wiki/List_of_dialects_of_the_English_language
# https://en.wikipedia.org/wiki/Non-native_pronunciations_of_English 
dialect:
  label: Variante régionale
  popup_link: https://fr.wikipedia.org/wiki/Variétés_régionales_du_français#En_Afrique
  popup_text: variety of a language that is a characteristic of a particular group of the language's speakers.
  selection:
  - [En Afrique, [Français d'Afrique]]
  - [En Europe, [Français Belgique, Français France, Français Suisse]]
  - [Au Canada, [français terre-neuvien, français québécois, français acadien, français cadien, français ontarien, franco-manitobain  ]]
  - [Aux États-Unis, [français cadien/cajun ]]
  - [En Asie, [Français du Cambodge, Français de l'Inde, Français du Laos, Français du Viêt Nam, Français du Liban ]]
  - [Autre, [Autre]]
  other_label: Autre Variante régionale

recording_information: Informations d'enregistrement

microphone:
  label: Type de microphone
  selection:
    - Microphone analogique
    - Micro USB
    - Micro de portable
    - Téléphone intelligent
    - Tablette
    - Microphone à champ éloigné
    - Autre
  other_label: Autre Microphone 

recording_location:
  label: Emplacement d'enregistrement
  selection:
    - À l'intérieur
    - à l'extérieur
    - Véhicule
    - Autre
  other_label: Autre lieu d'enregistrement

background_noise:
  label: Y a-t-il du bruit de fond?
  selection:
    - "Oui"
    - "Non"

noise_volume:
  label: Volume de bruit
  selection:
    - Bruit faible - constant
    - Bruit Faible - intermittent
    - Bruit modéré - constant
    - Bruit modéré - intermittent
    - Bruit Fort - constant
    - Bruit Fort - intermittent

noise_type:
  label: Type de bruit
  selection:
    - Foule
    - Équipement électronique
    - écho
    - Ventilateur / Climatiseur
    - Machinerie
    - Sons de la nature
    - Conversation
    - Musique
    - Circulation
    - TV
    - vidéo
    - Météo (vent / pluie ...)
    - Autre
  other_label: Autre Type de bruit

license:
  label: Licence
  popup:
    title: Creative Commons Licences
    link: https://creativecommons.org/licenses/?lang=fr
    hover_text: >
      CC0 - Public Domain Dedication
      CC BY - Attribution
      CC BY-SA - Attribution-ShareAlike
      GPLv3 - GNU General Public License
    text:  > 
      <b>CC0 - Creative Commons - Pas de droit d’auteur</b> permet aux titulaires de droits de 
      renoncer à tous leurs droits et de placer une œuvre dans le domaine 
      public. <br>
      <b>CC BY - Creative Commons - Attribution</b>  Cette licence permet aux autres de distribuer,
      remixer, arranger, et adapter votre œuvre, même à des fins commerciales, 
      tant qu’on vous accorde le mérite de la création originale en citant 
      votre nom.<br>
      <b>CC BY-SA - Creative Commons - Attribution - Partage dans les Mêmes Conditions</b>  Cette 
      licence permet aux autres de remixer, arranger, et adapter votre œuvre, 
      même à des fins commerciales, tant qu’on vous accorde le mérite en citant 
      votre nom et qu’on diffuse les nouvelles créations selon des conditions 
      identiques. <br>
      <b>GPLv3 GNU General Public License</b> similar to CC BY-SA, but made for software... used by
      VoxForge 1.0 corpus.
  selection_default: { value: 'CC0',  item: 'CC0 - Creative Commons - Pas de droit d’auteur (conseillé)' }
  selection:
    - { value: 'CC_BY',     option: 'CC BY - Creative Commons - Attribution' }
    - { value: 'CC_BY-SA',  option: 'CC BY-SA -  Creative Commons - Attribution - Partage dans les Mêmes Conditions' }
    - { value: 'GPLv3',     option: 'GPLv3 - GNU General Public License' }

ua_string:
  label: inclure l'agent utilisateur
  popup:
    title: Collecter les informations de l'agent utilisateur
    link: https://www.whatismybrowser.com/detect/what-is-my-user-agent
    hover_text: >
      Inclure l'agent utilisateur avec votre soumission
    text:  > 
      L'agent d'utilisateur de votre navigateur indique quelque chose de 
      particulier a propos de votre système. <br>
      VoxForge peut collecter la chaîne de l'agent utilisateur de votre navigateur
      pour dépanner et aider à déterminer quels appareils fonctionnent le mieux avec
      Application d'enregistrement VoxForge
  selection_default: { value: 'Oui',  item: 'Oui' }
  selection:
    - { value: 'Non',  option: 'Non' }

num_prompts:
  label: Nombre de phrases à lire

instructions:
  label: Instructions
  lines: 
    - 1. Appuyez sur <b>Enregistrer</b> pour commencer, en disant seulement la phrase qui apparaît dans la boîte ci-dessous.
    - 2. Appuyez sur <b>Arrêter</b> lorsque vous avez terminé.
  lastline: >
    3. Quand terminé, appuyez sur <b>Télécharger</b> pour envoyer vos enregistrements au serveur VoxForge.

controls:
  record: Enregistrer
  stop: Arrêter
  upload: Télécharger
  upload_message: >
    "Êtes-vous prêt à télécharger votre soumission? \nSi non, appuyez sur 
    Annuler, puis appuyez sur Télécharger une fois que vous êtes prêt."

browser_support:
  no_worker_message: >
    "Votre navigateur ne supporte pas les 'travailleurs de service' ou 
    'travailleurs de web', s'il vous plaît metté à jour votre navigateur
    (ou installer une version courrante d'un navigateur Libre et 'Open Source' 
    tel que Chrome ou Firefox)"
  no_indexedDB_message: >
    "Votre navigateur ne supporte pas indexedDB pour le sauvegardage hors ligne de
    soumissions, s'il vous plaît s'il vous plaît metté à jour votre navigateur
    (ou installer une version courrante d'un navigateur Libre et 'Open Source' 
    tel que Chrome ou Firefox)"
  no_formDataSupport_message: >
    "Browser does not support FormData... please install 
    a current version of a Free and Open Source browser such as Chrome or 
    Firefox"
  no_edgeSupport_message: >
    "Les navigateurs de Microsoft ne sont pas supportés ... veuillez installer
    une version courrante d'un navigateur Libre et 'Open Source' tel que Chrome ou
    Firefox"
  no_FirefoxAndroid_message: >
    Malheureusement, utilisant le logiciel VoxForge avec le navigateur Firefox 
    sur Android résulte en rayures et éclats étant inclus dans le fichier wav,
    s.v.p. veuillez utiliser Chrome.

alert_message:
  serviceworker: serviceworker
  webworker: webworker
  submission_singular: soumission
  submission_plural: soumissions
  localstorage_message: >
    Soumission enregistrée dans le stockage du navigateur.
  browsercontains_message: >
    Le stockage de votre navigateur contient
  uploaded_message: >
    téléchargé sur serveur Web VoxForge
  audio_too_loud: >
    Votre enregistrement est trop fort.  <br>Veuillez réduire votre volume et
    réenregistrer.
  audio_too_soft: >
    Votre enregistrement est trop doux.  <br>Veuillez augmenter votre volume et
    réenregistrer.
  no_trailing_silence: >
    Vous avez couper votre enregistrement (vous avez cliqué trop tôt) <br> 
    Veuillez ré-enregistrer.
  no_speech: >
    Pas d'audio vocal enregistré! <br> Veuillez supprimer et réenregistrer.
  getUserMedia_error: >
    Impossible d'obtenir une entrée audio... assurez-vous que votre microphone 
    est connecté à votre ordinateur.  <br> Votre navigateur donne ce message d'erreur:
  notHtml5_error: >
    Votre appareil ne supporte pas l'API HTML5 nécessaire à l'enregistrement d'audio

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






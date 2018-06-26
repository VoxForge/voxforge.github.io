---
layout: record
title: Enregistrement vocal VoxForge
menu: Lire
ref: read
lang: fr
weight: 2

################################################################################

total_number_of_prompts: 865
# sequence number start, url to prompt file not required since prompt file
# already has prompt IDs in first column
# first prompt file (id: "001") gets cached by service worker
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

license:
  label: License
  popup:
    title: Creative Commons Licences
    link: https://creativecommons.org/licenses/
    hover_text: >
      CC0 1.0 - Creative Commons Public Domain Dedication;
      CC BY 4.0 - Creative Commons Attribution;
      CC BY-SA 4.0 - Creative Commons Attribution-ShareAlike;
      GPLv3 - GNU General Public License.
    text:  > 
      <b>CC0 1.0 - Creative Commons - Pas de droit d’auteur</b> permet aux titulaires de droits de 
      renoncer à tous leurs droits et de placer une œuvre dans le domaine 
      public. <br>
      <b>CC BY 4.0 - Creative Commons - Attribution</b>  Cette licence permet aux autres de distribuer,
      remixer, arranger, et adapter votre œuvre, même à des fins commerciales, 
      tant qu’on vous accorde le mérite de la création originale en citant 
      votre nom.<br>
      <b>CC BY-SA 4.0 - Creative Commons - Attribution - Partage dans les Mêmes Conditions</b>  Cette 
      licence permet aux autres de remixer, arranger, et adapter votre œuvre, 
      même à des fins commerciales, tant qu’on vous accorde le mérite en citant 
      votre nom et qu’on diffuse les nouvelles créations selon des conditions 
      identiques. <br>
      <b>GPLv3 GNU General Public License</b> similaire à CC BY-SA, mais créé pour 
      les logiciels ... utilisé par le corpus VoxForge 1.0.
  selection_default: { value: 'CC0',  item: 'CC0 1.0 - Creative Commons - No rights Reserved (recommended)' }
  selection:
    - { value: 'CC_BY',     option: 'CC BY 4.0 - Creative Commons - Attribution' }
    - { value: 'CC_BY-SA',  option: 'CC BY-SA 4.0 - Creative Commons Attribution-ShareAlike' }
    - { value: 'GPLv3',     option: 'GPLv3 - GNU General Public License' }
  full_license:
    CC0:
      title: CC0 1.0 - Creative Commons CC0 1.0 Universal Public Domain Dedication
      link: "https://creativecommons.org/publicdomain/zero/1.0/"
      attribution: "_year_ VoxForge Speech Recording by:"
      text:
        - The person who associated a work with this deed has dedicated the work 
        - to the public domain by waiving all of his or her rights to the work
        - worldwide under copyright law, including all related and neighboring 
        - rights, to the extent allowed by law.
        - ""
        - You can copy, modify, distribute and perform the work, even for 
        - commercial purposes, all without asking permission. 
        - ""
        - You should have received a copy of the CC0 legalcode along with this
      text_last: work.  If not, see
    CC_BY:
      title: CC BY 4.0 - Creative Commons Attribution 4.0 International Public License
      link: "https://creativecommons.org/licenses/by/4.0/"
      attribution: "VoxForge Speech Recording, Copyright (C) _year_"
      text:
        - This Speech Recording is licensed under a Creative Commons Attribution 4.0
        - Unported License.
        - ""
        - "You are free to:"
        - ""
        - Share — copy and redistribute the material in any medium or format
        - Adapt — remix, transform, and build upon the material
        - for any purpose, even commercially.
        - ""
        - "Under the following terms:"
        - ""
        - Attribution - You must give appropriate credit, provide a link to the 
        - license, and indicate if changes were made. You may do so in any 
        - reasonable manner, but not in any way that suggests the licensor 
        - endorses you or your use.
        - ""
        - You should have received a copy of the CC BY 4.0 legalcode along with 
      text_last: this work.  If not, see
    CC_BY-SA:
      title: CC BY-SA 4.0 - Creative Commons Attribution-ShareAlike 4.0 International Public License
      link: "https://creativecommons.org/licenses/by-sa/4.0/"
      attribution: "VoxForge Speech Recording, Copyright (C) _year_"
      text:
        - This Speech Recording is licensed under a Creative Commons 
        - Attribution 4.0 Unported License.
        - ""
        - "You are free to:"
        - ""
        - Share — copy and redistribute the material in any medium or format
        - Adapt — remix, transform, and build upon the material
        - for any purpose, even commercially.
        - ""
        - "Under the following terms:"
        - ""
        - Attribution - You must give appropriate credit, provide a link to the 
        - license, and indicate if changes were made. You may do so in any 
        - reasonable manner, but not in any way that suggests the licensor 
        - endorses you or your use.
        - ""
        - ShareAlike — If you remix, transform, or build upon the material, 
        - you must distribute your contributions under the same license as 
        - the original.
        - ""
        - You should have received a copy of the CC BY-SA 4.0 legalcode along 
      text_last: with this work.  If not, see
    GPLv3:
      title: GPLv3 - GNU General Public License.
      link: "https://www.gnu.org/licenses/"
      attribution: "VoxForge Speech Recording, Copyright (C) _year_"
      text:
        - "This program is free software: you can redistribute it and/or modify"
        - it under the terms of the GNU General Public License as published by
        - the Free Software Foundation, either version 3 of the License, or
        - (at your option) any later version.
        - ""
        - This program is distributed in the hope that it will be useful,
        - but WITHOUT ANY WARRANTY; without even the implied warranty of
        - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        - GNU General Public License for more details.
        - ""
        - You should have received a copy of the GNU General Public License
      text_last: along with this program.  If not, see

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
    Volume est trop fort.<br>
    Veuillez réduire votre volume et réenregistrer.
  audio_too_soft: >
    Volume est trop doux.<br>
    le system a augmente le volume automatiquement<br>
    Veuillez réenregistrer.
  no_trailing_silence: >
    Vous avez couper votre enregistrement (vous avez cliqué trop tôt) <br> 
    Veuillez ré-enregistrer.
  no_speech: >
    Pas d'audio vocal enregistré! <br> Veuillez supprimer et réenregistrer.
  audio_too_loud_autogain: >
    Volume est trop fort.<br>
    le system a reduit le volume automatiquement<br>
    Veuillez effacer et ré-enregistrer.
  audio_too_soft_autogain: >
    Volume est trop doux.<br>
    le system a augmente le volume automatiquement<br>
    Veuillez effacer et ré-enregistrer.
  no_speech_autogain: >
    Volume est trop doux.<br>
    le system a augmente le volume automatiquement<br>
    Veuillez effacer et ré-enregistrer.
  getUserMedia_error: >
    Impossible d'obtenir une entrée audio... assurez-vous que votre microphone 
    est connecté à votre ordinateur.  <br> Votre navigateur donne ce message d'erreur:
  notHtml5_error: >
    Votre appareil ne supporte pas l'API HTML5 nécessaire à l'enregistrement d'audio

---


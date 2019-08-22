---
layout: record
title: Enregistrement vocal VoxForge
menu: Lire
ref: read
lang: fr
weight: 2

################################################################################

# sequence number start, url to prompt file not required since prompt file
# already has prompt IDs in first column
# first prompt file (id: "001") gets cached by service worker
prompt_list_files:
  - id: "001"
    file_location: /fr/prompts/001.html
    contains_promptid: true
    number_of_prompts: 865

username_label: Nom d'utilisateur
anonymous: anonyme
anonymous_submission: (laisser vide pour soumettre anonymement)
profile_info: Profil
default_value: non séléctionné

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
    - { value: '13 - 17', old_value: 'Jeune', desc: 'Jeune' }
    - { value: '18 - 29', old_value: 'Adulte', desc: 'Adulte' }
    - { value: '30 - 39', old_value: 'Adulte', desc: 'Adulte' }
    - { value: '40 - 49', old_value: 'Adulte', desc: 'Adulte' }
    - { value: '50 - 59', old_value: 'Adulte', desc: 'Adulte' }
    - { value: '60 - 64', old_value: 'Adulte', desc: 'Adulte' }
    - { value: '65 - 74', old_value: 'Sénior', desc: 'Sénior' }
    - { value: '> 75', old_value: 'Sénior', desc: 'Sénior' }

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
  popup_link: https://fr.wikipedia.org/wiki/Variétés_régionales_du_français
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
      CC0 1.0 - Creative Commons Public Domain Dedication;
      CC BY 4.0 - Creative Commons Attribution;
      CC BY-SA 4.0 - Creative Commons Attribution-ShareAlike;
      GPLv3 - GNU General Public License.
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
  selection_default: { value: 'CC0',  item: 'CC0 - Creative Commons - Pas de droit d’auteur (défaut)' }
  selection:
    - { value: 'CC_BY',     option: 'CC BY - Creative Commons - Attribution' }
    - { value: 'CC_BY-SA',  option: 'CC BY-SA -  Creative Commons - Attribution - Partage dans les Mêmes Conditions' }
    - { value: 'GPLv3',     option: 'GPLv3 - GNU General Public License' }

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
  play: Jouer

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
    "Votre navigateur ne supporte pas FormData ... s'il vous plaît installer
    une version courrante d'un navigateur Libre et Open Source tel que Chrome ou
    Firefox"
  no_edgeSupport_message: >
    "Les navigateurs de Microsoft ne sont pas supportés ... veuillez installer
    une version courrante d'un navigateur Libre et 'Open Source' tel que Chrome ou
    Firefox"

# localstorage_message - <br> or \n line breaks don't work...
alert_message:
  localstorage_message: >
    Ne peut pas se connecter au serveur.
    Soumission enregistrée dans le stockage du navigateur.
    Elle va être Téléchargé avec la prochaine soumission faite avec connexion au serveur.
  browsercontains_message: >
    Le stockage de votre navigateur contient
  uploaded_message: >
    téléchargé sur serveur Web VoxForge
  serviceworker: serviceworker
  webworker: webworker
  workernotfound: worker type not found  
  submission_singular: soumission
  submission_plural: soumissions

  getUserMedia_error: >
    Impossible d'obtenir une entrée audio... assurez-vous que votre microphone 
    est connecté à votre ordinateur.  <br> Votre navigateur donne ce message d'erreur:
  notHtml5_error: >
    Votre appareil ne supporte pas l'API HTML5 nécessaire à l'enregistrement d'audio
  rec_info_activated: >
    La section "Informations d'enregistrement" est activée sous "Profil".
    Cette section utilise le service de géolocalisation
    de votre navigateur par défaut pour vous rappeler de vérifier vos Informations
    d'enregistrement si votre position a changé. L'utilisation de ce service de
    géolocalisation peut être désactivé dans les paramètres.
  time_limit: >
    Cela fait un certain temps depuis votre dernière soumission:  S'il vous
    plaît examiner vos paramètres d'enregistrement et si nécessaire, mettez
    à jour votre localisation et le niveau de bruit.
  location_change: >
    Changement de lieu: S'il vous plaît examiner vos paramètres d'enregistrement
    et Si nécessaire, mettez à jour votre localisation et le niveau de bruit.
  noise_Turn_Off_Vad: >
    Bruit de fond présent. Vous devrez peut-être désactiver le DAV (Détection
    d'activité vocale) dans Paramètres, puis supprimer et réenregistrer.

speechCharacteristics:
  audio_too_loud_short: 'Erreur: Volume trop fort.'
  audio_too_loud_text: >
    Volume est trop fort.
    Veuillez réduire votre volume et réenregistrer.
  audio_too_soft_short: 'Avertissement: Volume trop doux.'
  audio_too_soft_text: >  
    Volume est trop doux.
    le system a augmente le volume automatiquement
    Veuillez réenregistrer.
  no_trailing_silence_short: 'Avertissement: Enregistrement coupé'
  no_trailing_silence_text: >  
    Il se peut qu’il n’y ait pas assez de silence à la fin de votre
    enregistrement (c’est-à-dire que cliqué sur 'arrêter' trop tôt).
    Veuillez vous assurer qu'il y a un peu de silence (au moins
    1/4 de seconde) à la fin de cet enregistrement.
    Sinon, supprimez-le et enregistrez-le à nouveau.
  no_speech_short: "Erreur: Pas d'audio enregistré!"
  no_speech_text: >  
    Pas d'audio vocal enregistré! Veuillez supprimer et réenregistrer.
    Pas de parole (ou votre volume de microphone est trop faible) en enregistrement.
    S'il vous plaît augmenter le volume du microphone et veuillez supprimer
    et réenregistrer.

settings:
  title: Paramètres
  none: null
  recording_information_text: Rappels
  recording_information_text_2: >
      (pour vous rappeler de vous assurer que vos paramètres d'informations
      d'enregistrement sont toujours valide si vous avez changé d’emplacement
      depuis votre dernier enregistrement).
  display_record_info: >
    Afficher la section "Informations d'enregistrement"
  recording_time_reminder: >
    utilisez le temps écoulé depuis votre dernier enregistrement pour déterminer
    quand rappeler.
  recording_geolocation_reminder: >
    Rappel de changement de lieu d'enregistrement utilizant géolocalisation
    
  resource_intensive_text: Fonctions gourmandes en ressources
  resource_intensive_text_2: >  
     (désactivez-les pour améliorer la qualité d'enregistrement sur les
     appareils à faible consommation)
  vad_run: Détection d'activité vocale (DAV)

  audio_visualizer: Visualiseur Audio
  waveform_display: Affichage de forme d'onde pour chaque enregistrement
  saved_submissions: En attente de téléchargement (enregistré dans la mémoire du navigateur)
  uploaded_submissions: Soumissions téléchargées
  system_information_text: Informations système
  system_information_text_2: (incluses dans la soumission)  
  ua_string: Agent d'utilisateur
  debug_text: Paramètres audio du navigateur  

---


---
layout: record
title: Read
menu: Read
weight: 2
ref: read
lang: fr
permalink: /fr/read

username_label: Nom d'utilisateur
anonymous_submission: (laisser vide pour soumettre anonymement)
profile_info: Profil

localized_variable:
  yup: "Oui"
  nope: "Non"
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
# leave a space between groupings of hash/objects; otherwise liquid does not parse properly
# Yes and No must be in quotes, otherwise evaluates true/false
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
    - Nature sounds
    - Talking
    - Music
    - Traffic
    - TV
    - Video
    - Weather Related (wind/rain...)
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
      <b>CC0 - Pas de droit d’auteur</b> permet aux titulaires de droits de 
      renoncer à tous leurs droits et de placer une œuvre dans le domaine 
      public. </br>
      <b>CC BY - Attribution</b>  Cette licence permet aux autres de distribuer,
      remixer, arranger, et adapter votre œuvre, même à des fins commerciales, 
      tant qu’on vous accorde le mérite de la création originale en citant 
      votre nom.</br>
      <b>CC BY-SA - Attribution - Partage dans les Mêmes Conditions</b>  Cette 
      licence permet aux autres de remixer, arranger, et adapter votre œuvre, 
      même à des fins commerciales, tant qu’on vous accorde le mérite en citant 
      votre nom et qu’on diffuse les nouvelles créations selon des conditions 
      identiques. </br>
      <b>GPLv3 </b> similar to CC BY-SA, but made for software... used by
      VoxForge 1.0 corpus.
  selection:
    - CC0 - Creative Commons - Pas de droit d’auteur (défaut)
    - CC BY - Attribution
    - CC BY-SA - Attribution - Partage dans les Mêmes Conditions 
    - GPLv3 - GNU General Public License

num_prompts:
  label: Nombre de phrases à lire

instructions:
  label: Instructions
  line1: 1. Appuyez sur <b>Enregistrer</b> pour commencer, en disant seulement la phrase qui apparaît dans la boîte ci-dessous.
  line2: 2. Appuyez sur <b>Arrêter</b> lorsque vous avez terminé.
  line3: 3. Lorsque toutes les invites demandées sont terminées, vous serez invité à <b>Télécharger</b> vos enregistrements.
  edge:
    mouse_over_text: Pour le navigateur Microsoft Edge, cliquez ici pour voir comment indiquer à Windows comment Edge peut utiliser votre microphone.
    popup:
      title: Windows - Comment autoriser votre navigateur Edge à utiliser votre microphone
      link: https://privacy.microsoft.com/en-us/windows-10-camera-and-privacy
      text:  > 
        1. Allez dans Start, puis sélectionnez Paramètres> Confidentialité> Microphone. </br>
        2. Choisissez votre paramètre préféré pour Autoriser les applications à utiliser mon microphone. </br>
        3. Sous <i>Choisir les applications</i> pouvant utiliser votre microphone, activez le paramètre individuel pour le navigateur Edge. </br>

controls:
  record: Enregistrer
  stop: Arrêtez
  upload: Télécharger
---







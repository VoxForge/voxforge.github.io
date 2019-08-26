---
layout: record
title: VoxForge Sprachrecorder
menu: Lesen
ref: read
lang: de
weight: 2

################################################################################

# first prompt file (id: "001") gets cached by service worker in user browser
prompt_list_files:
  - id: "001"
    start: 0
    file_location: /de/prompts/001.html
    number_of_prompts: 400
    contains_promptid: true
    prefix: de
  - id: "002"
    start: 400
    file_location: /de/prompts/002.html
    number_of_prompts: 400
    contains_promptid: true
    prefix: de
  - id: "003"
    start: 800
    file_location: /de/prompts/003.html
    number_of_prompts: 412
    contains_promptid: true
    prefix: de    
username_label: Nutzername
anonymous: anonym
anonymous_submission: (leer lassen, um anonym einzureichen)
profile_info: Profil Information
default_value: nicht ausgewählt

# Yes and No must be in quotes, otherwise evaluates to true/false
# can't use 'yes' or 'no' as variable names in YAML
localized_variable:
  lv_yes: "Ja"
  lv_no: "Nein"
  other: "Andere"

please_select: Bitte auswählen
speaker_characteristics: Lautsprechereigenschaften

gender:
  label: Geschlecht
  selection:
    - Männlich
    - Weiblich
    - Andere

age:
  label: Alter
  selection:
    - { value: '13 - 17', old_value: 'Jugend', desc: 'Jugend' }
    - { value: '18 - 29', old_value: 'Erwachsene', desc: 'Erwachsene' }
    - { value: '30 - 39', old_value: 'Erwachsene', desc: 'Erwachsene' }
    - { value: '40 - 49', old_value: 'Erwachsene', desc: 'Erwachsene' }
    - { value: '50 - 59', old_value: 'Erwachsene', desc: 'Erwachsene' }
    - { value: '60 - 64', old_value: 'Erwachsene', desc: 'Erwachsene' }
    - { value: '65 - 74', old_value: 'Senior', desc: 'Senior' }
    - { value: '> 75', old_value: 'Senior', desc: 'Senior' }

native_speaker:
  label: Muttersprachler?
  popup_link: https://de.wikipedia.org/wiki/Muttersprache
  popup_text: >
    Jemand, der eine Sprache als Muttersprache oder Muttersprache spricht.
  selection:
    - "Ja"
    - "Nein"

first_language:
  label: Muttersprache
  popup_link: https://en.wikipedia.org/wiki/First_language
  popup_text: >
    Sprache, der eine Person von Geburt an oder in der kritischen Zeit
    ausgesetzt war.
  other_label: Andere Muttersprache

# see: https://de.m.wikipedia.org/wiki/Deutsche_Dialekte
dialect:
  label: Aussprache Dialekt
  popup_link: https://de.wikipedia.org/wiki/Dialekt
  popup_text: >
    Vielfalt einer Sprache, die ein Merkmal einer bestimmten Gruppe der ist
    Sprecher der Sprache.
  selection:
    - [Deutschland , [Norddeutschland, Westdeutschland, Berlin, "südl. Ostdeutschland", Bayern]]
    - [andere, [, Schweiz, sterreich]]
    - ["Andere", ["Andere"]]    
  other_label: "Anderer Sprachraum"

# no default required for sub-dialect

recording_information: Informationen aufzeichnen

microphone:
  label:  Tipo de Microfono
  selection:
    - Headset-Mikro (am Kopfhörer)
    - Headset-Mikro (USB)
    - Tisch-Mikro
    - Tisch-Mikro (USB)
    - Eingebautes Laptop-Mikro
    - Webcam-Mikro
    - Studio-Mikro
    - Andere
  other_label: Anderer Mikrofontyp

recording_location:
  label: Aufnahmeort
  selection:
    - Drinnen
    - Im Freien
    - Fahrzeug
    - Andere
  other_label: Anderer Ort

background_noise:
  label: Gibt es Hintergrundgeräusche?
  selection:
    - "Ja"
    - "Nein"

noise_volume:
  label: Lautstärke
  selection:
    - Niedrig - konstant
    - Niedrig - intermittierend
    - Mäßig - konstant
    - Mäßig - intermittierend
    - Laut - konstant
    - Laut - intermittierend

noise_type:
  label: Geräuschtyp
  selection:
    - Menschenmenge
    - Elektronische Geräte
    - Echo
    - Lüfter / Klimaanlage
    - Maschinen
    - Naturgeräusche
    - Reden
    - Musik
    - Der Verkehr
    - FERNSEHER
    - Video
    - Wetterbedingt (Wind / Regen ...)
    - Andere
  other_label: Andere Geräuschart

license:
  label: Lizenz
  selection_default: { value: 'CC0',  item: 'CC0 1.0 Universell Public Domain Dedication (Standard)' }
  selection:
    - { value: 'CC_BY',     option: 'CC BY 4.0 - Namensnennung 4.0 International' }
    - { value: 'CC_BY-SA',  option: 'CC BY-SA 4.0 - Namensnennung - Weitergabe unter gleichen Bedingungen 4.0 International ' }
    - { value: 'GPLv3',     option: 'GPLv3 - GNU General Public License Version 3' }

num_prompts:
  label: Anzahl der zu lesenden Eingabeaufforderungen

instructions:
  label: Anleitung
  lines:
    - 1. Klicken Sie zum Starten auf <b> Aufnahme </b> und lesen Sie nur den im
        Feld unten angezeigten Satz vor (der nach dem Drücken der Aufnahmetaste
        angezeigt wird).
    - 2. Wenn Sie mit dem Sprechen fertig sind, <b> warten </b> Sie einen Moment
        und klicken dann auf <b> Stopp </b>.
    - 3. <b> Überprüfen Sie </b> alle Aufzeichnungen mit Warnungen.        
  lastline: >
    4. Klicken Sie nach Abschluss aller Eingabeaufforderungen auf
        <b> Hochladen </b> Zum Hochladen auf den VoxForge-Server oder zum
        späteren Hochladen im Browserspeicher speichern.

controls:
  record: Aufzeichnung
  stop: Halt
  upload: Hochladen
  play: Abspielen

browser_support:
  no_worker_message: >
    Ihr Browser unterstützt keine Dienste oder Web-Worker
    Upgrade auf eine aktuelle Version eines Free- und Open Source-Browsers wie z
    Chrome oder Firefox.
  no_indexedDB_message: >
    Ihr Browser unterstützt keine indexedDB zur Offline-Speicherung von
    Bitte aktualisiere auf eine aktuelle Version von Free and Open
    Quellbrowser wie Chrome oder Firefox.
  no_formDataSupport_message: >
    Der Browser unterstützt FormData nicht ... bitte installieren
    eine aktuelle Version eines Free und Open Source Browsers wie Chrome oder
    Feuerfuchs
  no_edgeSupport_message: >
    Microsoft-Browser werden nicht unterstützt ... bitte installieren
    eine aktuelle Version eines Free und Open Source Browsers wie Chrome oder
    Feuerfuchs

# localstorage_message - <br> or \n line breaks don't work...
alert_message:
  localstorage_message: >
    Kann nicht mit dem Server verbinden.
    Die Übermittlung wurde im Browser-Speicher gespeichert.
    Wird bei der nächsten Übermittlung mit Verbindung zum Server hochgeladen. 
  browsercontains_message: >
    Ihr Browser-Speicher enthält    
  uploaded_message: >
    auf VoxForge Server hochgeladen
  serviceworker: Servicearbeiter
  webworker: Webworker
  workernotfound: Arbeitertyp nicht gefunden
  submission_singular: Einreichung
  submission_plural: Einreichungen
  getUserMedia_error: >
    Audioeingang konnte nicht empfangen werden. Vergewissern Sie sich, dass Ihr
    Mikrofon an Ihr angeschlossen ist Computer. Ihr Browser gibt diese
    Fehlermeldung aus:
  notHtml5_error: >
    Ihr Gerät unterstützt nicht die HTML5-API, die zum Aufzeichnen von Audio
    erforderlich ist
  rec_info_activated: >
    Abschnitt "Aufzeichnungsinformationen" unter "Profilinformationen"
    aktiviert. Dies nutzt ein einfacher Timer seit Ihrer letzten Einreichung,
    der Sie daran erinnert, Ihre Eingaben zu bestätigen Die Einstellungen für
    "Aufnahmeinformationen" sind weiterhin gültig. Das kann in den Einstellungen
    deaktiviert werden.
  time_limit: >
    Es ist schon eine Weile her, seitdem Sie Ihre Beiträge eingereicht haben:
    Bitte überprüfen Sie Ihre Nehmen Sie die Einstellungen für die
    Aufzeichnungsinformationen vor und aktualisieren Sie gegebenenfalls Ihre
    Standort und Geräuschpegel.
  location_change: >
    Standortänderung: Bitte überprüfen Sie Ihre Einstellungen für die
    Aufnahmeinformationen und Aktualisieren Sie gegebenenfalls Ihren Standort
    und den Geräuschpegel/-typ.
  noise_Turn_Off_Vad: >
    Hintergrundgeräusche vorhanden. Möglicherweise müssen Sie VAD
    (Sprachaktivität) deaktivieren Erkennung in den Einstellungen löschen und
    die letzte Aufforderung erneut aufzeichnen.
    
speechCharacteristics:
  audio_too_loud_short: 'Fehler: zu laut!'
  audio_too_loud_text: >
    Ihre Aufnahme ist zu laut!
    Bitte reduzieren Sie Ihre Mikrofonlautstärke,
    Löschen Sie dann diese Aufnahme und nehmen Sie sie erneut auf.
  audio_too_soft_short:  'Achtung: nicht laut genug!'
  audio_too_soft_text: >  
    Ihre Aufnahmepegel sind zu niedrig!
    Bitte erhöhen Sie Ihre Mikrofonlautstärke,
    Löschen Sie dann diese sofortige Aufnahme und nehmen Sie sie erneut auf.
  no_trailing_silence_short: >
    'Attencion: La aplicación cree que no has dejado suficiente silencio.'
  no_trailing_silence_text: >
    Möglicherweise ist am Ende Ihrer Aufnahme nicht genug Stille (d. H. Sie)
    zu früh auf "Stopp" geklickt).
    Bitte überprüfen Sie und vergewissern Sie sich, dass es eine gewisse Stille
    gibt (zumindest 1/4 Sekunde) am Ende dieser Aufnahme.  Wenn nicht, löschen
    Sie sie und zeichnen Sie sie erneut auf.
  no_speech_short: 'Fehler: keine Rede.'
  no_speech_text: >  
    Keine Sprache (oder Mikrofonlautstärke zu niedrig) bei der Aufnahme.
    Bitte erhöhen Sie die Mikrofonlautstärke,
    dann löschen und neu aufnehmen.

settings:
  title: die Einstellungen
  none: keiner
  recording_information_text: Erinnerungen
  recording_information_text_2: >
    (um Sie daran zu erinnern, dass Ihre Einstellungen für die
    Aufnahmeinformationen noch gültig sind gültig, wenn Sie seit Ihrer letzten
    Aufnahme den Standort gewechselt haben).
  display_record_info: >
    Zeigen Sie den Abschnitt "Aufzeichnungsinformationen" an.
  recording_time_reminder: >
    Verwenden Sie die Zeit seit Ihrer letzten Aufnahme, um festzustellen, wann
    Sie daran erinnern müssen.
  recording_geolocation_reminder: >
    Verwenden Sie GPS, um Änderungen des Standorts zu überwachen und
    festzustellen, wann eine Erinnerung erforderlich ist
    (ressourcenintensiv)
  resource_intensive_text: Ressourcenintensive Funktionen
  resource_intensive_text_2: >  
    (Deaktivieren Sie diese Optionen, um die Aufnahmequalität auf Geräten mit
    geringem Stromverbrauch zu verbessern)
    
  vad_run: Sprachaktivitätserkennung (VAD)
  audio_visualizer: Audio-Visualizer
  waveform_display: Wellenformanzeige für jede Aufnahme
  saved_submissions: Warten auf den Upload (im Browser-Speicher)
  uploaded_submissions: Hochgeladene Beiträge
  system_information_text: System Information
  system_information_text_2: (in der Einreichung enthalten)
  ua_string: User Agent String
  debug_text: Audioeinstellungen des Browsers 

---


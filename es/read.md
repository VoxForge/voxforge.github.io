---
layout: record
title: Grabador de voz VoxForge
menu: Leer
ref: read
lang: es
weight: 2

################################################################################

# first prompt file (id: "001") gets cached by service worker
prompt_list_files:
  - id: "001"
    start: 0
    file_location: /es/prompts/001.html
    number_of_prompts: 43
    contains_promptid: false
    prefix: es

username_label: Nombre de Usuario
anonymous: anónimo
anonymous_submission: (dejar en blanco para enviar anonimamente)
profile_info: Información de perfil
default_value: no seleccionado

# Yes and No must be in quotes, otherwise evaluates to true/false
# can't use 'yes' or 'no' as variable names in YAML
localized_variable:
  lv_yes: "Sí"
  lv_no: "No"
  other: "Otro"

please_select: Seleccione
speaker_characteristics: Características del altavoz

gender:
  label: Genero
  selection:
    - Masculino
    - Femenino
    - Otro

age:
  label: Rango de Edad
  selection:
    - { value: '< 20', old_value: 'Niño' }
    - { value: '20 - 29', old_value: 'Adulto' }
    - { value: '30 - 39', old_value: 'Adulto' }
    - { value: '40 - 49', old_value: 'Adulto' }
    - { value: '50 - 59', old_value: 'Adulto' }
    - { value: '60 - 69', old_value: 'Adulto' }
    - { value: '70 - 79', old_value: 'Tercera Edad' }
    - { value: '80 - 89', old_value: 'Tercera Edad' }
    - { value: '> 89', old_value: 'Tercera Edad' }

# - leave a blank line between groupings of hash/objects; otherwise liquid does 
# not parse properly
# - Yes and No must be in quotes, otherwise evaluates to true/false
native_speaker:
  label: Hablante nativo?
  popup_link: https://es.wikipedia.org/wiki/Lengua_materna
  popup_text: alguien que habla un idioma como su primer idioma o lengua materna.
  selection:
    - "Sí"
    - "No"

first_language:
  label: Primer idioma
  popup_link: https://en.wikipedia.org/wiki/First_language
  popup_text: lenguaje al que una persona ha estado expuesta desde el nacimiento o dentro del período crítico.
  other_label: Otro primer idioma

dialect:
  label: Dialecto de la pronunciación
  popup_link: https://es.wikipedia.org/wiki/Dialecto_(programación)
  popup_text: variedad de un idioma que es una característica de un grupo particular de hablantes del idioma.
  selection:
  - [España, [Español España]]
  - [America latina, [Español Mexicano, Español Argentina, Español Chile, Español Latinoamerica]]
  - [Otro, [Otro]]
  other_label: Otro dialecto

# no default required for sub-dialect

recording_information: Información de grabación

microphone:
  label:  Tipo de Microfono
  selection:
    - Micrófono Auricular
    - Micrófono Auricular USB
    - Micrófono de Escritorio
    - Micrófono de Notebook incorporado
    - Teléfono inteligente
    - Tableta
    - Matriz de micrófono/Micrófono de campo remoto
    - Otro
  other_label: Otro tipo de micrófono

recording_location:
  label: Ubicación de grabación
  selection:
    - Adentro
    - Al aire libre
    - Vehículo
    - Otro
  other_label: Otra ubicación de grabación

background_noise:
  label: ¿Hay ruido de fondo?
  selection:
    - "Sí"
    - "No"

noise_volume:
  label: Volumen de ruido
  selection:
    - Bajo nivel de ruido - constante
    - Bajo nivel de ruido - enterramiento
    - nivel de ruido moderado - constante
    - nivel de ruido moderado - enterramiento
    - nivel de ruido fuerte - constante
    - nivel de ruido fuerte - enterramiento

noise_type:
  label: Tipo de ruido
  selection:
    - Multitud
    - Equipo electronico
    - Eco
    - Ventilador / Aire Acondicionado
    - Maquinaria
    - La naturaleza suena
    - Hablando
    - Música
    - Tráfico
    - televisión
    - Vídeo
    - Clima relacionado (viento / lluvia ...)
    - Otro
  other_label: Otro tipo de ruido

license:
  label: Licencia
  popup:
    title: Licencias Creative Commons
    link: https://creativecommons.org/licenses/?lang=es
    hover_text: >
      CC0 1.0 - Dedicación del dominio público de Creative Commons;
      CC BY 4.0 - Creative Commons Reconocimiento;
      CC BY-SA 4.0 - Creative Commons Reconocimiento-Compartir por igual;
      GPLv3 - Licencia pública general de GNU.
  selection_default: { value: 'CC0',  item: 'CC0 1.0 - Creative Commons - No hay derechos reservados (defecto)' }
  selection:
    - { value: 'CC_BY',     option: 'CC BY 4.0 - Creative Commons - Attribution' }
    - { value: 'CC_BY-SA',  option: 'CC BY-SA 4.0 - Creative Commons Reconocimiento-Compartir por igual' }
    - { value: 'GPLv3',     option: 'GPLv3 - Licencia pública general de GNU' }

num_prompts:
  label: Número de indicaciones para leer

instructions:
  label: Instrucciones
  lines:
    - 1. Haga clic en <b>Grabar</b> para comenzar y solo diga las palabras que aparecen en el cuadro siguiente.
    - 2. Haga clic en <b>Detener</b> cuando se haya completado.
  lastline: >
    3. Cuando termine, haga clic en <b> Subir </b> para enviar sus grabaciones al servidor de VoxForge.

controls:
  record: Grabar
  stop: Parar
  upload: Reproducir
  play: Jugar

browser_support:
  no_worker_message: >
    "Su navegador no es compatible con los trabajadores de servicio o web, por favor
    actualizar a una versión actual de un navegador de código abierto y gratuito como
    Chrome o Firefox."
  no_indexedDB_message: >
    "Su navegador no es compatible con indexedDB para el almacenamiento fuera de línea de
    presentaciones, actualice a una versión actual de una versión gratuita y abierta
    Navegador de origen como Chrome o Firefox."
  no_formDataSupport_message: >
    "El navegador no es compatible con FormData ... por favor instala
    una versión actual de un navegador de código libre y abierto como Chrome o
    Firefox"
  no_edgeSupport_message: >
    "Los navegadores de Microsoft no son compatibles ... por favor instale
    una versión actual de un navegador de código libre y abierto como Chrome o
    Firefox"

# localstorage_message - <br> or \n line breaks don't work...
alert_message:
  localstorage_message: >
    No se puede conectar al servidor.
    Envío guardado en el almacenamiento del navegador.
    Se cargará con la siguiente presentación realizada con conexión al servidor.
  browsercontains_message: >
    El almacenamiento de su navegador contiene
  uploaded_message: >
    cargado en el servidor VoxForge
  serviceworker: serviceworker
  webworker: webworker
  submission_singular: sumisión
  submission_plural: sumisiones
  audio_too_loud: >
    ¡Tu grabación es demasiado fuerte! <br>
    Por favor reduzca el volumen de su micrófono, <br>
    luego borre esta grabación y vuelva a grabarla.
  audio_too_soft: >
    ¡Tus niveles de grabación son demasiado bajos! <br>
    Por favor, aumente el volumen de su micrófono, <br>
    luego borre esta grabación y vuelva a grabarla.
  no_trailing_silence: >
    No hay suficiente silencio final: has hecho clic en "detener" demasiado pronto. <br>
    No dejaste suficiente silencio al final de tu grabación, o
    cortar el final de su grabación <br>
    Por favor borre esta grabación y vuelva a grabarla.
  no_speech: >
    No hay volumen de voz o grabación demasiado bajo <br>
    Por favor, aumente el volumen de su micrófono,<br>
    luego borre y vuelva a grabar este mensaje.
  audio_too_loud_autogain: >
    ¡Tu grabación es demasiado fuerte! <br>
    Disminución automática del volumen. <br>
    Borre esta grabación y vuelva a grabarla.
  audio_too_soft_autogain: >
    ¡Tus niveles de grabación son demasiado bajos! <br>
    Aumento automático del volumen. <br>
    Borre esta grabación y vuelva a grabarla.
  no_speech_autogain: >
    No hay volumen de voz o grabación demasiado bajo. <br>
    Aumento automático del volumen. <br>
    Borre esta grabación y vuelva a grabarla.
  getUserMedia_error: >
    No se pudo obtener la entrada de audio ... asegúrese de que su micrófono esté conectado a su
    computadora. Su navegador está dando este mensaje de error:
  notHtml5_error: >
    Su dispositivo no es compatible con la API HTML5 necesaria para grabar audio
  rec_info_activated: >
    La sección "Información de grabación" se activó en "Información del perfil"
    (se puede deshabilitar en Configuración).
  time_limit: >
    Ha pasado un tiempo desde la última vez que lo envió: Por favor revise
    la configuración de Información de grabación y, si es necesario,
    actualice su Ubicación y Niveles de ruido.
  location_change: >
    Cambio de ubicación: Por favor revise la configuración de Información
    de grabación y, si es necesario, actualice su Ubicación y Niveles de ruido.

settings:
  title: Configuraciones
  include_heading: Incluir en la sumisión
  ua_string: Agente de usuario Cadena
  debug: Información de depuración
  other_heading: Otro
  display_record_info: >
    Información de grabación (necesita actualizarse cada vez
    que cambia la ubicación o las características del ruido)
  vad_run: VAD habilitado (detección de actividad de voz)
  recording_location_reminder: Recordatorio de cambio de ubicación de grabación
  

#TODO no longer used
ua_string:
  label: Agente de usuario Cadena
  popup:
    title: Recopilar información de cadena de agente de usuario
    link: http://www.useragentstring.com
    hover_text: >
      Incluir cadena de agente de usuario con grabación
    text:  > 
      Cuando su navegador web realiza una solicitud a un sitio web, también envía un usuario
      Cadena del agente Esta cadena contiene información sobre el nombre de su navegador,
      sistema operativo, tipo de dispositivo, etc. <br>
      La aplicación VoxForge recopila esta información para ayudar a solucionar problemas y
      determinar qué dispositivos funcionan mejor con esta aplicación. <br>
  selection_default: { value: 'Sí',  item: 'Sí' }
  selection:
    - { value: 'No',  option: 'No' }




---


---
layout: record
title: Grabador de voz VoxForge
menu: Leer
ref: read
lang: es
weight: 2

################################################################################

# first prompt file (id: "001") gets cached by service worker in user browser
prompt_list_files:
  - id: "001"
    start: 0
    file_location: /es/prompts/001.html
    number_of_prompts: 43
    contains_promptid: false
    prefix: es
  - id: "002"
    start: 44
    file_location: /es/prompts/002.html
    number_of_prompts: 64
    contains_promptid: false
    prefix: es
  - id: "003"
    start: 109
    file_location: /es/prompts/003.html
    number_of_prompts: 167
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
    - { value: '13 - 17', old_value: 'Niño', desc: 'Niño' }
    - { value: '18 - 29', old_value: 'Adulto', desc: 'Adulto' }
    - { value: '30 - 39', old_value: 'Adulto', desc: 'Adulto' }
    - { value: '40 - 49', old_value: 'Adulto', desc: 'Adulto' }
    - { value: '50 - 59', old_value: 'Adulto', desc: 'Adulto' }
    - { value: '60 - 64', old_value: 'Adulto', desc: 'Adulto' }
    - { value: '65 - 74', old_value: 'Tercera Edad', desc: 'Tercera Edad' }
    - { value: '> 75', old_value: 'Tercera Edad', desc: 'Tercera Edad' }

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
  popup_text: >
    lenguaje al que una persona ha estado expuesta desde el nacimiento o
    dentro del período crítico.
  other_label: Otro primer idioma

dialect:
  label: Dialecto de la pronunciación
  popup_link: https://es.wikipedia.org/wiki/Dialecto_(programación)
  popup_text: >
    variedad de un idioma que es una característica de un grupo particular de
    hablantes del idioma.
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
    - 3. <b> Revise </b> cualquier grabación con advertencias.        
  lastline: >
    4. Cuando termine, haga clic en <b> Subir </b> para enviar sus grabaciones
    al servidor de VoxForge.

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
    No es posible conectar con el servidor.
    Envío guardado en el almacenamiento del navegador.
    Se cargará con la siguiente presentación realizada con conexión al servidor.
  browsercontains_message: >
    El almacenamiento de su navegador contiene
  uploaded_message: >
    cargado en el servidor VoxForge
  serviceworker: trabajador del servicio
  webworker: trabajador web
  workernotfound: tipo de trabajador no encontrado 
  submission_singular: sumisión
  submission_plural: sumisiones

  getUserMedia_error: >
    No se pudo obtener la entrada de audio ... asegúrese de que su micrófono esté conectado a su
    computadora. Su navegador está dando este mensaje de error:
  notHtml5_error: >
    Su dispositivo no es compatible con la API HTML5 necesaria para grabar audio
  rec_info_activated: >
    La sección "Información de grabación" se activó en "Información del perfil". Esto usa
    el servicio de geolocalización de su navegador por defecto para recordarle que verifique su
    Información de grabación si su ubicación ha cambiado. El uso de la geolocalización puede
    estar deshabilitado en Configuración.
  time_limit: >
    Ha pasado un tiempo desde la última vez que lo envió: Por favor revise
    la configuración de Información de grabación y, si es necesario,
    actualice su Ubicación y Niveles de ruido.
  location_change: >
    Cambio de ubicación: Por favor revise la configuración de Información
    de grabación y, si es necesario, actualice su Ubicación y Niveles de ruido.
  noise_Turn_Off_Vad: >
    Ruido de fondo presente. Es posible que deba deshabilitar DAV (Detección
    de actividad de voz) en Configuración, luego elimine y vuelva a grabar
    su último mensaje.

# TODO: fix draft translations below
speechCharacteristics:
  audio_too_loud_short: 'Error: ¡Tu grabación es demasiado fuerte!'
  audio_too_loud_text: >
    ¡Tu grabación es demasiado fuerte!
    Por favor reduzca el volumen de su micrófono,
    luego borre esta grabación y vuelva a grabarla.
  audio_too_soft_short:  'Attencion: ¡Tus niveles de grabación son demasiado bajos!'
  audio_too_soft_text: >  
    ¡Tus niveles de grabación son demasiado bajos!
    Por favor, aumente el volumen de su micrófono,
    luego borre esta grabación y vuelva a grabarla.
  no_trailing_silence_short: 'Attencion: La aplicación cree que no has dejado suficiente silencio.'
  no_trailing_silence_text: >
    La aplicación cree que no has dejado suficiente silencio. Es posible que hayas hecho clic
    'para' demasiado temprano!
    Revise esta grabación rápida y elimine y vuelva a grabar si es necesario.
  no_speech_short:  'Error: No hay volumen de voz o grabación demasiado bajo.'
  no_speech_text: >  
    Sin voz (o volumen de micrófono demasiado bajo) en la grabación.
    Aumente el volumen del micrófono,
    luego borre y vuelva a grabar su.

settings:
  title: Configuración (haga clic en el cuadro para habilitar)
  none: ninguna
  recording_information_text: Recordatorios
  recording_information_text_2: >
    (para recordarle que se asegure de que la configuración de la información
    de grabación aún esté válido, si cambió de ubicación desde su última
    grabación).
  display_record_info: >
    Información de grabación (necesita actualizarse cada vez
    que cambia la ubicación o las características del ruido)
  recording_time_reminder: >
    use el tiempo transcurrido desde su última grabación para determinar cuándo
    recordar.
  recording_geolocation_reminder: >
    use el GPS para monitorear el cambio de ubicación para determinar cuándo
    recordar (uso intensivo de recursos).
  resource_intensive_text: Funciones intensivas en recursos
  resource_intensive_text_2: >  
    (desactívelas para mejorar la calidad de grabación en dispositivos de baja
    potencia)
    
  vad_run: Detección de actividad de voz (DAV)
  audio_visualizer: Visualizador de audio
  waveform_display: Pantalla de forma de onda para cada grabación 
  saved_submissions: En espera de subir (guardado en el almacenamiento del navegador)
  uploaded_submissions: Sumisiones cargados
  system_information_text: Información del sistema
  system_information_text_2: (incluida en la sumisione)
  ua_string: Cadena de agente de usuario
  debug_text: Configuración de audio del navegador  

---


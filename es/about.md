---
layout: default
menu: About
title: About
ref: about
lang: es
weight: 8
---

Sobre VoxForge
--------------

VoxForge es un proyecto que tiene como objetivo recoger transcripciones
de textos mediante voz, para ser usados en [Software de reconicimiento
de voz] ("SRE"s) como pueden ser [ISIP], [HTK], [Julius] o [Sphinx].  El
proyecto se encargará de categorizar y poner disponibles todos los
ficheros de voz que se envíen (tambien llamados 'Speech Corpus") y los
modelos acústicos bajo licencia [GPL]. 

[][3]
¿Por qué se necesitan voces en formato GPL?
-------------------------------------------

Con el fin de que un sistema de reconocimiento de voz pueda funcionar,
se necesitan dos tipos de ficheros: el corpus (voces); y la gramática o
el modelo de lenguage.

El primero, al que se lláma Corpus, se crea mediante la extracción de
datos estadísticos de ficheros con voces, esta información estadística
es una representación del sonido que forma cada palabra. Contra más
información de voces se tenga, el modelo de Corpus será más y más
exacto.

El segundo es una gramatica o un modelo de lenguaje. La gramática es un
fichero relativamente pequeño que contiene conjuntos de combinaciones de
palabras. El modelo de lenguaje es un fichero más grande, que contiene
la probabilidad de que aparezcan ciertas palabras en un determinado
orden. Dependiendo de la aplicación se usará o bien una gramática (se
definen una serie de frases, con un cierto formato) o un modelo de
lenguaje (empleado para aplicaciones de dictado).

Problemas asociados a las soluciones actuales:
----------------------------------------------

### Los modelos acústicos no son Open Source

En la mayoría de los software de reconocimiento de voz del tipo 'Open
Source', el modelo acústico no es abierto (no es Open Source). Es decir
no te dan acceso al audio (la fuente o source en inglés) que se ha usado
para crear el modelo acústico. En algunos casos, se da acceso, pero bajo
licencias restrictivas sobre la distribución de estas fuentes (ej. sólo
pueden ser usadas de forma personal o con propósitos educativos).

La razón de esto es que no hay suficiente Corpus de voz, que pueda ser
usado realmente, o que no es sufientemente grande como para crear
modelos acústicos de buena calidad para ser usados en software de
reconocimiento de voz.

A pesar de que existen pequeños corpus disponibles para poder crear
modelos acústicos, la mayoría (especialmente los grandes y mejor
construidos, con los que se podrían construir buenos modelos acústicos)
deben ser adquiridos bajo licencias restrictivas.

Debido a esto, aquellos proyectos que quieren distribuir su código
libremente, deben adquirir licencias restrictivas del Corpus que limitan
la distribución de la 'source' de voz, aunque puede ser que se permita
distribuír modelos acústicos que se hayan creado.

VoxForge quiere resolver este problema, dejando disponible toda la
información de todos los modelos acústicos y su 'source' (ej. los
archivos de voz transcritos) bajo la licencia [GPL] - la cual obliga que
la distribución de trabajos deribados de estos ficheros incluyan acceso
a los fuentes usados para crear ese trabajo.

### Las licencias restrictivas impiden acceso a la información a posibles colaboradores

Cada proyecto que necesite construir un modelo acustico usando un corpus
restrictivo, debe adquirir su propia copia del corpus. Esto dificulta a
los proyectos de reconocimiento de voz abiertos, que generalmente no
tiene ingresos. Si un proyecto adquiere dichas licencias, las
restricciones que estas imponen limitarán el acceso a esa información a
los miembros del mismo. Esto limita la libertad y flexibilidad que le
podría aportar los usuarios finales y los potenciales usuarios que
podrían aportar su conocimiento al proyecto.

### Los modelos acústicos no son Intercambiables

Cada uno de los software de reconocimiento de voz Open Source vienen con
un modelo acústico. Sin embargo estos modelos acústicos no son
intercambiables con otros programas de reconocimiento de voz. La forma
de solucionar este problema, es proveer el "código fuente" que se ha
utilizado para crear los modelos acusticos (la información de sonido del
corpus, [Speech Corpora], usado para crear el modelo acustico. De esta
forma se le permitirá a posibles desarrolladores que "compilen" los
modelos para ser usado con el software de reconocimiento de voz
favorito.

VoxForge quiere acabar con este problema creando un repositorio de
'sources" de voces y su correspondiente transcripción, y además creando
Modelos acusticos para ser usados directamente con los principales
programas open source de reconocimiento de voz (como son [Sphinx],
[Julius], [HTK] y [ISIP][4]) .\

### Los modelos lingüisticos necesitan ser mejorados

Los modelos acústicos que se usan actualmente en los software de
reconocimiento de voz 'Open Source' no tienen el mismo nivel de calidad
que los empleados por soluciones de reconocimiento de voz comerciales.

VoxForge quiere centralizar la localización de material con voces y sus
correspondientes transcripciones, distribuyéndolas en formato [GPL].
Contra más audio se pueda recoger, el modelo acústico que se genere del
mismo será más completo y podrá ser comparable con los sistemas de
reconocimiento comerciales.

### No existe software de dictado Open Source

La mayoría de los sistemas de reconocimiento de voz Open Source están
diseñados para entender comandos y construír aplicaciones de operadora
automática entelefonía (ej. [Sphinx], [HTK] y [ISIP][4]).  [Julius], por
el contrario, ha sido diseñado para aplicaciones de dictado, sin embargo
la distribución de  [Julius] sólo incluye modelos acústicos para
Japonés. Dado que sus modelos acústicos son entrenados usando la
herramienta [HTK], se podría preparar para funcionar en otros idiomas,
como pueden ser inglés o castellano. Lo unoco que se necesita para esto
es horas y horas de voces grabadas. El mismo audio recogido de esta
forma, podría ser usado por otros softwares de reconocimiento para poder
implementar aplicaciones de dictado.

Actualmente VoxForge tiene como objetivo el reconocimiento de voz no
orientado al dictado, pero en un futuro, cuando la cantidad de
grabaciones de las que se dispongan aumenten, los datos podrían ser
usado para la creación de modelos acústicos para software de dictado
(para la primera aplicación se estima que se necesitan unas 140 horas de
audio, mientras que para sistemas de dictado unas 2000!!!).

[][5]
El Objetivo de VoxForge
-----------------------

Actualmente, es posible el que un usuario pueda crear un modelo acústico
para reconocer su propia voz, usando software de reconocimiento Open
Source, sólo se necesita tiempo y paciencia. El objetivo principal de
VoxForge es crear un Modelo Acustico multi-usuario, que pueda ser
utilizado (sin entrenamiento) para:

-   [Operadora automática de telefonía (IVR)] (Modelos acústicos a
    8kHz);\
-   [Comandos y control de puestos](Modelos acústicos a 16-48kHz);
-   Aplicaciones de dictado (en un futuro).\

Para poder cumplir esto, VoxForge tendrá disponible un repositorio de
datos con los ficheros de audio (y sus transcripciones). Además
dispondrá de los Modelos Acusticos, que se irán mejorando con las
contribuciones de las voces que los donantes desinteresados dejen (según
se vaya contribuyendo con nuevos audios, estos serán unidos al modelo
acústico muti-usuario de VoxForge).

Según se vaya recogiendo más y más datos de voz, la creación de modelos
acústicos para una única persona, también será más sencillo. Esto es
debido a que los usuarios podrán adaptar el modelo multi-usuario de
VoxForge para que reconozca su voz, en lugar de crear uno desde zero.
Aunque contra más datos se tengan disponibles, llegará un punto en el
que el modelo de VoxForge podrá reconocer la voz de cualquiera sin la
necesidad de adaptarse a la de un usuario concreto.

Para llevar acabo este objetivo, se necesita tu ayuda. Hay dos maneras
en las que puedes ayudar:

-   [Crea ficheros de voz transcritos] y mándalos a VoxForge:\

> -   *Puedes crear tus propios ficheros de voz y mandarlos a
>     VoxForge*;\
> -   *VoxForge los compilará en su modelo acústico multi-usuario.*

-   [Crea tus propios Modelos Acústicos] y envía los ficheros de audio
    de voz usados para crearlos a VoxForge:

> -   *Usa nuestros* How-to o tutoriales para aprender cómo crear tu
>     propio Modelo Acústico y envianos los datos de voz y sus
>     transcripciones;\
> -   *VoxForge los compilará en su modelo acústico multi-usuario.*

Actualmente estamos recogiendo audio de alta calidad (48kHz/16-bit) y se
hace [downsampling] para ser utilizado en aplicaciones de telefonía
(8kHz/16-bit) y en aplicaciones de comandos y control de puestos
(16kHz-48kHz/16-bit).  \

La ventaja de recoger datos a estas altas frecuencias aseguran que estos
ficheros puedan ser usados también en la creación de modelos acústicos
para aplicaciones de dictado (hay que hacer constar que será necesario
crear nuevos modelos de lenguaje estadísticos robustos, para usar estos
Modelos Acústicos).

[Más información sobre la creación de modelos acústicos.]

[][6]
¿Por qué GPL?
-------------

### Licencias sin restricción no serían efectivas

Creemos que dejando el [Speech Corpora] disponible sin ninguna
limitación, con licencias del estilo [BSD] no van a ayudar a la
comunidad Open Source en este caso particular. Una licencia [BSD]
permite que los usuarios puedan distribuir trabajos derivados, sin
devolver las modificaciones de vuelta a la comunidad. En nuestra
opinión, la comunidad de usuarios que podrían ayudar en el
reconocimiento de voz Open Source, en caso de que se usase una licencia
de tipo [BSD] no existirían suficientes colaboradores para llevar a cabo
los proyectos. Si existiese una comunidad mayor, existiría mayor
probabilidad de los trabajos se devolviesen a la comunidad, apesar de
que no se les requiera hacerlo con la licencia de tipo [BSD].

La licencia [GPL] asegura que las contribuciones que se hagan a
VoxForge, van a beneficiar a la comunidad de sistemas de reconocimiento
Open Source. Esto es así por que los trabajos derivados del VoxForge
[Speech Corpora] deben ponerse disponibles en formato fuente para la
comunidad (ej. el audio de voz transcrito).

[][7]
Comments
--------

[Search]

 

Unless otherwise indicated, © 2006-2017 VoxForge; Legal: [Terms and
Conditions]

  []: /uploads/oP/cO/oPcOg0B0_5H2D7FtnksJ9Q/voxforge-logoTransaparent.gif{#image}
  [Click here to register.]: /es/about?op=auth;method=createAccount
  [Home]: /es{.horizontalMenu}
  [Read]: /es/read{.horizontalMenu}
  [Listen]: /es/listen{.horizontalMenu}
  [Forums]: /es/forums{.horizontalMenu}
  [Dev]: /es/dev{.horizontalMenu}
  [Downloads]: /es/downloads{.horizontalMenu}
  [About]: /es/about{.horizontalMenu}
  [1]: /home/faq-icon.jpg "FAQ - Frequently Asked Questions"{width="20"
  height="20"}
  [![][1]]: /home/docs/faq
  []: {#idvZWhJsOVkiVjSQIhMQoD4w}
  [2]: {#idIA9nnvFpTLLHBv8INJ4-Mg}
  [Software de reconicimiento de voz]: http://en.wikipedia.org/wiki/Open_source
  [ISIP]: http://www.ece.msstate.edu/research/isip/projects/speech/index.html
  [HTK]: http://htk.eng.cam.ac.uk/
  [Julius]: http://julius.sourceforge.jp/en_index.php?q=en/index.html
  [Sphinx]: http://cmusphinx.sourceforge.net/html/cmusphinx.php
  [GPL]: ../home/docs/faq/faq/what-is-gpl
  [3]: {#idtgcuJP0rf73wWjxe0cqBUA}
  [Speech Corpora]: ../home/docs/faq/faq/what-is-a-speech-corpus-or-speech-corpora
  [4]: http://www.cavs.msstate.edu/hse/ies/projects/speech/
  [5]: {#idSpgpegBbII-oBp9hik1uSA}
  [Operadora automática de telefonía (IVR)]: ../home/docs/faq/faq/what-is-telephony-ivr
  [Comandos y control de puestos]: ../home/docs/faq/faq/what-is-a-desktop-command-and-control-application
  [Crea ficheros de voz transcritos]: ../home/read
  [Crea tus propios Modelos Acústicos]: ../home/dev/acousticmodels
  [downsampling]: ../home/docs/faq/faq/what-is-downsampling2
  [Más información sobre la creación de modelos acústicos.]: ../home/docs/acoustic-model-creation
  [6]: {#id9Pe4v-rp02evdWB8D5JP-g}
  [BSD]: http://www.opensource.org/licenses/bsd-license.php
  [7]: {#idXNDznM6UappsTOR1_f_KaA}
  [Search]: /es/about/comments?func=search
  [Terms and Conditions]: http://www.voxforge.org/home/about/legal

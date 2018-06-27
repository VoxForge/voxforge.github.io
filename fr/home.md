---
layout: default
menu: Accueil
title: Page D’accueil
ref: home
lang: fr
weight: 1
permalink: /fr/
---

VoxForge est un projet qui vise à collecter des enregistrements oraux de 
textes. Les modèles générés à partir de ces enregistrements sont utilisables 
par les moteurs de reconnaissance vocale [Open Source].

Nous mettons à disposition tous ces enregistrements sous licence [GPL]. 
À partir de ces enregistrements, nous construisons des modèles acoustiques, 
utilisables avec des moteurs de reconnaissance vocale [Open Source] comme 
[Sphinx], [Julius] ou [HTK] (nota: le moteur HTK possède des restrictions de distribution)

## Pourquoi nous avons besoin d'enregistrements audio libres sous GPL.

La plupart des [modèles acoustiques] utilisés par les moteurs de reconnaissance
vocale (Speech-to-Text) Open Source ne sont pas '**Libres**'. Ils ne donnents 
pas accès aux sources audio et aux transcriptions (_c-à-d_ [corpus oraux]) 
utilisées lors de leur création.

L'explication réside dans le fait que les projets Libres et Open Source
 ('FOSS'), sont obligés d'acheter de grands [corpus oraux] aux licences 
restrictives. Bien qu'il existe quelques exemples de corpus libres, 
la grande majorité (et en particulier ceux nécessaires à la construction de 
bons modèles acoustiques) doivent être achetés sous une licence restrictive.

## Comment vous pouvez nous aider.

[Enregistrez vos lectures de textes] et envoyer les à VoxForge avec votre 
ordinateur en utilisant un applet Javascript qui vous propose une liste de
 textes à lire et la possibiliter d'envoyer vos enregistrements très simplement.



[Open Source]: {% link _faqs/en/what-is-open-source-software.md %}
[GPL]: {% link _faqs/en/what-is-gpl.md %}
[modèles acoustiques]: {% link _faqs/en/what-is-an-acoustic-model.md %}
[corpus oraux]: {% link _faqs/en/what-is-a-speech-corpus-or-speech-corpora.md %}
[Enregistrez vos lectures de textes]: {% link fr/read.md %}

[Sphinx]: https://cmusphinx.github.io/
[Julius]: https://github.com/julius-speech/julius
[HTK]: http://htk.eng.cam.ac.uk/


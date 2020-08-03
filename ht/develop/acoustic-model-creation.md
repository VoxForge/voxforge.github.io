---
layout: default
title: kreyasyon modèl akoustik
redirect_from: /akèy/docs/kreasyon-modèl-akoustik
---

Acoustic Model Creation
=======================

Speech Recognition Engine Files 
--------------------------------

motè rekonesans vokal nesesite de tip fichye pou yo rekonèt lapawòl. li nesesite yon **modèl akoustik**, ki kreye lè yo pran anrejistreman vokal lapawòl ak tout transkripsyon, epi yo konpile yo nan yon reprezantasyon statistik son ki konpoze chak mo. yo nesesite egalman yon fichye **langaj modèl** oubyen **gramè**. yon modèl langaj se yon fichye ki kenbe ladann pwobabilite sekans mo yo. yon gramè se yon fichye ki pi piti ki gen ladann yon ansanm konbinezon mo ki defini depi anvan. modèl langaj yo itilize pou aplikasyon dikte yo, tandiske gramè yo itilize nan aplikasyon tip [kontwol ak kòmand òdinatè] oubyen [IVR telefòn].
modèl akoustik

Acoustic Models 
----------------

son an ka ankode a diferan [to echatiyonaj](sa ki vle di echantiyon pa segonn-sak pi kouran yo se: 8kHz, 16kHZ, 32 kHZ,44,1 kHZ,48kHZ ak 96kHZ) ak [diferan bit pa echantiyon][to echantiyonaj](sak pi kouran) se : 8 bit, 16 bit oubyen 32 bit). motè rekonesans vokal yo pi byen fonksyone si modèl akoustik ke yap itilize an te fòme avè son vokal ki anrejistre nan menm frekans echantiyonaj/bit pa echantiyon lapwòl ke yo rekonèt lan

### Telephony 

Pou Telephony faktè ki limite bann pasan kote lapawòl lan ka transmèt lan. pa ekzanp, telefòn fix standa yo gen ke yo bann pasan de 64kbps ak yon to echantiyonaj 8kHz ak 8 bit pa echantiyon(8000 echantiyon pa segonn\*8 bit pa echantiyon=64000bps=64kpbs). pa konsekan pou rekonesans base sou telefòn yo ,wap bezwen yon modèl akoustik ki fòme avèk fichye son vokal 8kHz/8 bit.

Pou vwa sou IP("VoiP") [kodèk] ki itilize an detèmine generalman to echantiyonaj/bit pa echantiyon ki pi elve pou trnasmisyon lapawòll,( pou amelyore kalite sonò an), modèl akoustik ou an dwe fème avèk done son ki korespon a to echantiyonaj/bit pa echantiyon. nan ka spesifik sistèm PBX asteriks, son an echantiye an plis andedan nan valè 8kHz/16 bit kelkeswa echantiyonaj/ bit kodèk pa echantiyon. pa konsekan, Asteriks bezwen yon modèl fòme ak done son 8 kHz/16 bit

### Desktop 

Pou rekonesans vokal sou òdinatè, faktè limitan an se kat son an. jounen jodia pifò kat son ka anrejistre nan to echantiyonaj ki konpris ant 16kHz ak 48 kHz avèk debi binè 8 a 16 bit pa echantiyon ak yon lekti jiska 98kHz.

Nan règ jeneral, yon motè rekonesans vokal pi byen fonksyone avèk modèl akoustik ki antrene ak done son vokal anrejistre nan to echantiyonaj/ bit pi elve pa echantiyo. men ililizasyonson avèk yon to echantiyonaj/ bit pa echantiyon twò eve ka ralanti motè rekonesans ou an. ou bezwen gen yon ekilib. kidonk pou rekonesans vokal òdinatè, nòm aktyèl lan se modèl akoustik ki antrene ak done son vokal ki anrejistre nan to echantiyonaj 16 kHz/ 16bit pa echantiyon.

Ou ka toujou itilize modèl akoutik ki antrene a 8 kHz pou aplikasyon òdinatè yo, men jeneralman wap bezwen o mwen de fwa(e jeneralman plis...) done son pou ka jwenn rezilta rekonesans ki konparab ak modèl akoustik ki antrene a 16 kHz.

Enfòmasyon siplemantè ap ka jwenn sou lyen sa yo:

[fonksyonman rekonesans vokal]

 


Unless otherwise indicated, © 2006-2017 VoxForge; Legal: [Terms and Conditions]

 [kontwol ak kòmand òdinatè]: /akèy/docs/faq/faq/kisa-ki-yon-aplikasyon-kontwol-ak-kòmand-òdinatè
 [Telephony IVR]: /akèy/docs/faq/faq/kisa-ki-yon-telephony-ivr
 [Sampling Rates]: /akèy/docs/faq/faq/what-are-sampling-rate-and-bits-per-sample
 [codec]: /akèy/docs/faq/faq/kisa-ki-yon-codec
 [How Speech Recognition WorksÂ]: "http://project.uet.itgo.com/speech.htm"
 [Sampling rate and Nyquist frequency]: /akèy/docs/acoustic-model-creation/comments/sampling-rate-and-nyquist-frequency#uLlmNV_c82azVazrg_CdUw
 [SPEECH and LANGUAGE PROCESSING]: "http://www.cs.colorado.edu/%7Emartin/slp2.html"
 [Daniel Jurafsky]: "http://www.stanford.edu/%7Ejurafsky"
 [James H. Marti]: "http://www.cs.colorado.edu/%7Emartin/"
 [Terms and Conditions]: "http://www.voxforge.org/home/about/legal"

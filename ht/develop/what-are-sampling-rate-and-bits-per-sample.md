---
layout: default
title: Kisa ki Sampling Rate ak Bits per Sample (to echantiyonaj lan ak bit pa echantiyon)?
redirect_from: akèy/docs/fak/fak/kisa-ki-sampling-rate-ak-bits-per-sample
---

**Kisa ki to echantiyonaj lan ak bit pa echantiyon (Sampling Rate ak Bits per Sample)?**

Apati Audacity [Digital Audio Tutorial]:

prensipal aparèy ki itilize pou anrejistreman nimerik lan se yon konvètisè analojik nimerik(ADC). ADC an kaptire enstanteman tansyon elektrik lan sou yon liy son epi reprezantel tankou yon nimewo nimerik ki kapab voye ale bay yon òdinatè. pandan lap kaptire tansyon an milye fwa pa segonn wap kapab jwenn yon très bòn aproksimasyon sinyal vwa orijinal lan:

<img src="http://manual.audacityteam.org/m/images/e/e2/waveform_digital.png" alt="http://manual.audacityteam.org/m/images/e/e2/waveform_digital.png" class="transparent" />


chak pwen nan figi sa yo ki anba an reprezante yon echantiyon vwa* de faktè detèmine kalite yon anrejistreman nimerik:

-   **to echatiyonaj (Sample rate)**: to kote echantiyon yo kaptire oubyen li an, ki mezire en Hertz(Hz), oubyen echantiyon pa segonn. yon CD vwa gen yon frekans echantiyonaj 44100 HZ, ki souvan ekri 44KHz pou fè kout. li egalman reprezante to echantiyonaj pa defo ke Audacity itilize paske CD vwa yo trè repandi.

-   **fòma echantiyonaj (Sample format)** oswa **gwosè echantiyon**: esansyèlman li fè referans ak nomb chif nan reprezantasyon nimerik chak echantiyon. konsidere frekans echantiyonaj lan kò presizyon orizontal fòm ond nimerik lan e fòma echantiyonaj lan presizyon vètikal. yon Cd vwa gen yon presizyon 16 bit, sa ki koresponn ak 5 chif decimal

to echatiyonaj pi elve yo pèmèt yon anrejistreman nimerik anrejistreavèk presizyon frekans sonò ki pi elve. to echantiyonaj lan ta dwe o mwen 2 fwa frekans ki pi elve kew vle reprezante an.lèzòm pa ka tande frekans ki siperyè a anviwon 20000Hz, kidonk 44100Hz te chwazi kòm to pou Cd yo pou li ka enkli inikman tout frekans lèzòm yo. to echantiyonaj 9h ak 192 kHz komanse vinn kouran sitou an patikilye ak DVD-mizik yo, men onètman moun yo pa ka tande diferans lan.

tay echantiyon pi elve yo pèmèt yon plaj pi dinamik- son pi fò yo ak son ki pi dou yo. si ou konnen echèl desibèl(dB), plaj dinamik yon CD vwa se teorikman 90dB men en realite, sinal don volim yo se -24dB ou plis gen yon kalitte konsiderab redwi.Audacity pran an chaj de tay echantiyon siplemantè: 24 bits, ki kouramman itilize nan anrejistreman nimerik e 32 bits*float*, ki gen yon plaj dinamik prekse enfini e li pran ke de fwa plis stokaj ke echatiyon 16 bit yo

Men kèk atik siplemantè ki founi plis detay sou frekans echantiyonaj lan ak pwofondè bit yo( sa ki vle di bit pa echatiyon):

-   [Discussion of the mysteries behind bit-depth, sample rates and sound quality]
-   [Sample rate and bit depth - an introduction to sampling][][
    ][Sample rate and bit depth - an introduction to sampling]

  [Digital Audio Tutorial]: http://manual.audacityteam.org/man/digital_audio.html
  [Discussion of the mysteries behind bit-depth, sample rates and sound quality]: http://tweakheadz.com/16_vs_24_bit_audio.htm
  [Sample rate and bit depth - an introduction to sampling]: http://www.musiciansfriend.com/document?doc_id=88273&src=3SOSWXXA


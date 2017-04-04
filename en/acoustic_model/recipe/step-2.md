---
layout: default
title: how-to step-2
ref: how-to-step-2
lang: en
permalink: /recipe/step-2
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/data-prep/step-2
---

Step 2 - Pronunciation Dictionnary
----------------------------------

Create a file called [prompts.txt] in your 'voxforge/howto' folder containing the following:

<pre>
*/sample1 DIAL ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE OH ZERO
*/sample2 DIAL ONE THREE FIVE SEVEN NINE ZERO TWO FOUR SIX EIGHT OH
*/sample3 DIAL ZERO NINE SEVEN FIVE THREE ONE OH EIGHT SIX FOUR TWO
*/sample4 DIAL ONE ONE TWO TWO THREE THREE FOUR FOUR FIVE FIVE
*/sample5 DIAL SIX SIX SEVEN SEVEN EIGHT EIGHT NINE NINE OH OH ZERO ZERO
*/sample6 PHONE STEVE YOUNG CALL STEVE YOUNG
*/sample7 PHONE STEVE CALL STEVE PHONE YOUNG CALL YOUNG
*/sample8 PHONE PHONE STEVE STEVE  CALL CALL YOUNG YOUNG
*/sample9 MEASURE LEISURE AND LEISURE MEASURE
*/sample10 COMPLAIN CHAMPLAIN AIRPLANE ELAINE EXPLAIN
*/sample11 BOOKENDS KENNEL KENNETH KENYA WEEKEND
*/sample12 BELT BELOW BEND AEROBIC DASHBOARD DATABASE
*/sample13 GATEWAY GATORADE GAZEBO AFGHAN AGAINST AGATHA
*/sample14 ABALON ABDOMINALS BODY ABOLISH
*/sample15 ABOUNDING ABOUT ACCOUNT ALLENTOWN
*/sample16 ACHIEVE ACTUAL ACUPUNCTURE ADVENTURE
*/sample17 ALGORITHM ALTHOUGH ALTOGETHER ANOTHER
*/sample18 BATTLE BEATLE LITTLE METAL
*/sample19 BITTEN BLATANT BRIGHTEN BRITAIN
*/sample20 BROOKHAVEN HOOD BROUHAHA BULLHEADS
*/sample21 BUSBOYS CHOICE COILS COIN
*/sample22 COLLECTION COLORATION COMBINATION COMMERCIAL
*/sample23 MIDDLE NEEDLE POODLE SADDLE
*/sample24 ALRIGHT ARTHRITIS BRIGHT COPYRIGHT CRITERIA RIGHT
*/sample25 COUPLE CRADLE CRUMBLE
*/sample26 CUBA CUBE CUMULATIVE
*/sample27 CURING CURLING CYCLING
*/sample28 CYNTHIA DANFORTH DEPTH
*/sample29 DIGEST DIGITAL DILIGENT
*/sample30 AMNESIA ASIA AVERSION BEIGE BEIJING
*/sample31 HELP HELLO HELMET HELPLESS AHEAD HELP
*/sample32 VOXFORGE HOME READ LISTEN FORUMS DEVELOPER ABOUT HOWTO TUTORIAL
*/sample33 RHYTHMBOX PLAY START NEXT SKIP FORWARD PREVIOUS BACK
*/sample34 MUSIC SHOW WHO ABOUT INFORMATION UP LOUDER DOWN LOWER
*/sample35 PLAYER SOFTER SILENCE STOP QUIET
*/sample36 COMPUTER WEATHER EMAIL VOLUME LOUDER SOFTER
*/sample37 COMPUTERIZE AMPUTATE MINICOMPUTER PUMA'S PEWTER  
*/sample38 ACUTE AMPUTATION BOOTERS CONTRIBUTOR'S ALOUETTE GIFTWARE GLADWELL
*/sample39 MAYWEATHER WHETHER WOODSTREAM ARTILLERYMAN CREMATION DAIRYMAID FEMALE
*/sample40 ISHMAEL'S LANCEDALE LAVAL VOLATILE SCALIA SOLUBLE SUPERVALUE VALUATION</p></td>
</pre>

This file will be used:

-   by the Acoustic Model Creation script to create the word list ([wlist]) file which is used in the creation of your Pronunciation Dictionnary, and
-   to prompt you for the creation of your audio files in Step 3.

Next create a new folder in you 'voxforge' directory call 'lexicon'.  Then copy   [VoxforgeDict.txt] to your 'voxforge/lexicon' folder.


  [prompts.txt]: https://github.com/VoxForge/develop/raw/master/howto/prompts.txt
  [wlist]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/interim_files/wlist
  [VoxforgeDict.txt]: https://github.com/VoxForge/develop/raw/master/lexicon/VoxForgeDict.txt


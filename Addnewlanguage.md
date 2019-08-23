1. voxforge_sw.js

    var urlsToCache = [

      '/de/manifest.json',

      // need one entry for each language, otherwise will not be able to switch
      // language while offline  
      '/de/read',

      // cache at least one prompt file for each language
      '/de/prompts/001.html',

      // cache language specific front pages so can switch languages
      '/de',    
    ];


2. _config.yml

    # Site settings
    title:
      de: VoxForge - Freie Spracherkennung 

    # word 'language' in local language
    languagesLocal:
      de: Sprache

    # localized language name
    languageName:
      de: Deutsche
      
    # hover language name translated to English
    languageEnglish:
      de: German

    # home page    
    index:
      de: startseite

3. home.md



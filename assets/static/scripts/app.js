/*
Copyright 2018 VoxForge

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

// ### GLOBALS #################################################################

var uploadURL;
if (window.location.origin === 'https://voxforge.github.io') { // prod
    uploadURL = 'https://upload.voxforge1.org'; 
} else { // testing
  // NOTE: need to update _config.yaml var for local apache2 ssl to work
  // correctly:
  //    # add trailing slash to permalinks for debugging with Apache2 and self signed SSL certificate
  //    permalink: /:lang/:ref/ # debugging
  //    #permalink: /:lang/:ref
  uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
  //var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS
}
if (window.location.origin === 'http://localhost:4000') { 
   window.alert( "upload to jekyll server localhost may not work - need SSL certificate" );        
}

var view;  // needs to be global so can be accessible to index.html

// #############################################################################

(function () { // function context
    // ### Get Jekyll variables#################################################

    // references inline Javascript in record.html - so that Jekyll will localize variables properly
    var pageVariables = new PageVariables(); 

    // ### Confirm app can run on browser ######################################

    if( ! window.Worker )
    {
      window.alert( pageVariables.browser_support.no_worker_message );           
    }

    if( ! window.indexedDB )
    {
      window.alert( pageVariables.browser_support.no_indexedDB_message );          
    }

    // Edge webworkers do not support FormData, and their web worker debugging is not there yet...
    if (platform.os.family === "Windows" && (platform.name === "Microsoft Edge" || platform.name === "IE" ) )
    {
      window.alert( pageVariables.browser_support.no_edgeSupport_message );         
    }

    // ### set localstorage defaults ###########################################
    
    if ( ! localStorage.getItem("vad_run") ) {
      localStorage.setItem("vad_run", 'true');
    } 

    if ( ! localStorage.getItem("debug") ) {
      localStorage.setItem("debug", 'true');
    } 

    if ( ! localStorage.getItem("ua_string") ) {
      localStorage.setItem("ua_string", 'true');
    }
    
    // #############################################################################
    const appversion = "0.2";

    var parms = new Parms(); 

    var prompts = new Prompts(parms.prompt, pageVariables); 
    var profile = new Profile(appversion, pageVariables);

    var debug = new Debug(); 
    // 'view' needs to be global so can be accessed by index.html
    view = new View(parms.view,
                    prompts,
                    profile,
                    debug,
                    pageVariables); 

    var audio = new Audio(parms.audio,
                          pageVariables);
    var uploader = new Uploader(parms.uploader,
                                pageVariables.alert_message);

    var controller =  new Controller(parms.controller,
                                     prompts, 
                                     profile, 
                                     view, 
                                     audio,
                                     uploader,
                                     debug,
                                     appversion,
                                     pageVariables);

    prompts.init();
    view.init();
    if ( localStorage.getItem("vad_run") === 'true') {
      view.enableVoiceActivityDetection();
    }
    audio.init();
    uploader.init();
    controller.start();

})(); // function context

// see: https://developers.google.com/web/fundamentals/app-install-banners/#criteria
window.addEventListener('appinstalled', (evt) => {
  console.log('a2hs installed');
});

if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('display-mode is standalone');
}

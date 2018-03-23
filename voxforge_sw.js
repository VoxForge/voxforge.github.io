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
var uploadURL = 'https://upload.voxforge1.org'; // prod
//var uploadURL = 'https://jekyll2_voxforge.org/index.php'; 
//var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS
//var uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
importScripts('assets/static/lib/localforage.js'); 

// Chrome service worker debugging woes:
// 1) http://127.0.0.1:4000/en/read/  # jekyll default server
// client service worker registers and caches files... wtf
// server with uploadURL = 'http://127.0.0.1/index.php'
//      error: (index):1 Failed to load http://127.0.0.1/index.php: Response for preflight is invalid (redirect)
//      need https for preflight to work correctly

// 2) https://127.0.0.1:4000/en/read/  # jekyll default server
// service workers register; fetch of javascript etc files works; error: will not upload
// now service workers do not work at all...

// 3) https://127.0.0.1/en/read/ # apache2
// service worker registers, but fetch of files to cache fails with TypeError: Failed to fetch

// 4) https://localhost/en/read/  # apache2
//ServiceWorker registration successful; but fetch of files to cache fails with: Uncaught (in promise) TypeError: Failed to fetch

// 5) https://jekyll_voxforge.org/en/read/  # apache2
// service worker fails to register with error: ServiceWorker registration failed:  DOMException: Failed to register a ServiceWorker: An SSL certificate error occurred when fetching the script.
// but upload works:
// browser: https://jekyll_voxforge.org/en/read/   
// index.php: $ALLOWEDURL = "https://jekyll_voxforge.org";

// 6) https://jekyll2_voxforge.org/en/read/  # apache2
// service worker fails to register with error: ServiceWorker registration failed:  DOMException: Failed to register a ServiceWorker: An SSL certificate error occurred when fetching the script.
// but upload works:
// browser: https://jekyll_voxforge.org/en/read/   
// index.php: $ALLOWEDURL = "https://jekyll2_voxforge.org";

// 7) http://jekyll_voxforge.org/en/read/  # apache2
// redirects to https; failes as above

/**
  testing service workers with private cert
  https://deanhume.com/home/blogpost/testing-service-workers-locally-with-self-signed-certificates/10155
when I’m working locally, I need to use self signed certificates. [...]
 However, my service worker will no longer register! 

// F12; Network>Disable Cache
// F12 Application>Service Workers>Update on reload
//In 'chrome://flags' set 'Allow invalid certificates from resources loaded from localhost'


This worked for me:
https://stackoverflow.com/questions/7580508/getting-chrome-to-accept-self-signed-localhost-certificate?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
Using Chrome, hit a page on your server via HTTPS and continue past the red warning page (assuming you haven't done this already).
Open up Chrome Settings > Show advanced settings > HTTPS/SSL > Manage Certificates.
Click the Authorities tab and scroll down to find your certificate under the Organization Name that you gave to the certificate.
Select it, click Edit (NOTE: in recent versions of Chrome, the button is now "Advanced" instead of "Edit"), check all the boxes and click OK. You may have to restart Chrome.

https://stackoverflow.com/questions/7580508/getting-chrome-to-accept-self-signed-localhost-certificate?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
Click anywhere on the page and type a BYPASS_SEQUENCE
https://chromium.googlesource.com/chromium/src/+/refs/heads/master/components/security_interstitials/core/browser/resources/interstitial_large.js
in colsole type: console.log(window.atob('dGhpc2lzdW5zYWZl'));
then cick on page and type "thisisunsafe"

workaround in Chrome:
$google-chrome --allow-insecure-localhost https://localhost 
index.php: $ALLOWEDURL = "https://localhost"; // testing
var uploadURL = 'https://localhost/index.php';

chrome://serviceworker-internals  > open DEvTools window and pause Javascript
execution on Service Worker startup...
*/


var CACHE_NAME = 'voxforge-cache-v0.1';
var PATH = '/assets/static/';

var urlsToCache = [
  PATH + 'lib/EncoderWorker.js',
  PATH + 'lib/jquery-1.12.4.js',
  PATH + 'lib/jquery.mobile-1.4.5.js',
  PATH + 'lib/languages.js',
  PATH + 'lib/platform.js',
  PATH + 'lib/visualize.js',
  PATH + 'lib/wavesurfer.js',
  PATH + 'lib/idb-keyval.js',
  PATH + 'lib/jszip.js',
  PATH + 'lib/localforage.js',
  PATH + 'lib/state-machine.js',
  PATH + 'lib/WavAudioEncoder.js',

  PATH + 'scripts/app.js',
  PATH + 'scripts/Audio.js',
  PATH + 'scripts/Profile.js',
  PATH + 'scripts/Prompts.js',
  PATH + 'scripts/upload.js',
  PATH + 'scripts/View.js',
  PATH + 'scripts/ZipWorker.js',

  PATH + 'styles/app.css',
  PATH + 'styles/jquery.mobile-1.4.5.css',

  '/en/prompts/001.html',
  '/en/prompts/002.html',
  '/en/prompts/003.html',
  '/en/read/',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
* this should cache the /en/prompts/001... prompt files as they are requested...
* TODO if browser offline && asking for a prompt file, then don't just pick
* a random prompt file, use theone currently in cache, and add more prompt files
* once user is back online...
*
* If we want to cache new requests cumulatively, we can do so by handling the
* response of the fetch request and then adding it to the cache, like below.
*
* see: https://developers.google.com/web/fundamentals/primers/service-workers/
*/
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

/**
*
* see: https://developers.google.com/web/updates/2015/12/background-sync
checkForSavedSubmissions() is promise indicating the success/failure of 
upload of submission to VoxForge server: 
If it fulfills, the sync is complete. 
If it fails, another sync will be scheduled to retry. 
Retry syncs also wait for connectivity, and employ an exponential back-off.
*/
self.addEventListener('sync', function(event) {
  if (event.tag == 'myFirstSync') {
    event.waitUntil(processSavedSubmissions());
  }
});

/* Inner Function: if saved submissions exist, get then upload the submission */
function processSavedSubmissions() {
  return new Promise(function (resolve, reject) {
    localforage.length().then(function(numberOfKeys) {
      console.info('number of submissions saved in browser storage: ' + numberOfKeys);

      // TODO since later loop iterates through all saved submissions, this 
      // prevents service worker from turning into a zombie threads 
      // and continually checking for (deleted) saved submissions...
      if (numberOfKeys <= 0) {
        resolve('no submissions found in browser storage: ' + numberOfKeys);
      }
    })
    .catch(function(err) {
      reject(err);
    });

    localforage.keys().then(function(savedSubmissionArray) {
      console.info('submissions to upload to VoxForge server: \n' + ' - '+ savedSubmissionArray.join('\n'));

      for (var i = 0; i < savedSubmissionArray.length; i++) {
        getSavedSubmission( savedSubmissionArray[i] )
        .then(uploadSubmission)
        .then(removeSubmission)
        .then(function(result) {
            if ( i == savedSubmissionArray.length - 1 && result === "OK" ) {
              console.info("submission(s) successfully uploaded.");
              resolve("OK");
            }
        })
        .catch(function(err) {
              reject(err);
        });
      }

    }).catch(function(err) {
      reject(err);
    });
  });
}

/* get the submission object */
function getSavedSubmission(saved_submission_name) {
  return new Promise(function (resolve, reject) {
    // getItem only returns jsonObject
    localforage.getItem(saved_submission_name)

      .then(function(jsonOnject) {
        // resolve sends these as parameters to next promise in chain
        resolve([saved_submission_name, jsonOnject, uploadURL]);

      }).catch(function(err) {
        reject('checkForSavedFailedUpload err: ' + err);
      });
  });
}

/* upload the submission to the VoxForge server */
function uploadSubmission(data) {
  var [saved_submission_name, jsonOnject, uploadURL] = data;

  return new Promise(function (resolve, reject) {
    var form = new FormData();
    form.append('file', jsonOnject['file'], "webworker_file.zip");
    form.append('language', jsonOnject['language'])
    form.append('username', jsonOnject['username'])

    fetch(uploadURL, {
      method: 'post',
      body: form,
      mode: 'cors',
      credentials: 'include',
    })
    .then(function (response) {
      console.log('post URL ' +  uploadURL);
       console.log('response data: ' + response.text());
      // to catch configuration errors on server side
      //if (response.text() === "submission uploaded successfully." ) {
      //  console.info("transferComplete: upload to VoxForge server successfully completed for: " + saved_submission_name);

        // resolve sends these as parameters to next promise in chain
        resolve(saved_submission_name);

      //} else {
      //  reject('Request failed - server configuration issues', response);
      //}

    })
    .catch(function (error) {
      console.error('Warning: upload of saved submission failed for: ' + saved_submission_name + 'will try again next time');
      reject('Request failed', error);
    });

  });
}


/* delete submission from local storage */
function removeSubmission(saved_submission_name) {
  return new Promise(function (resolve, reject) {
    // only remove saved submission if upload completed successfully
    localforage.removeItem(saved_submission_name).then(function() {
      console.log('Backup submission removed from browser: ' + saved_submission_name);

      resolve("OK");

    }).catch(function(err) {
      reject('Error: cannot remove saved submission: ' + saved_submission_name + ' err: ' + err);
    });  
  });
}


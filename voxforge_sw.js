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
// TODO: processSavedSubmissions is called from service worker (voxforge_sw.js) 
// from a absolute root (as opposed to relative path) therefore localforage 
// import must be done in calling script
importScripts('assets/static/lib/localforage.js'); // localforage needs to be defined before call to processSavedSubmissions

importScripts('assets/static/scripts/processSavedSubmissions.js'); 


/**
this allows testing of service workers on private network:
https://stackoverflow.com/questions/43665243/invalid-self-signed-ssl-cert-subject-alternative-name-missing?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

// F12; Network>Disable Cache
// F12 Application>Service Workers>Update on reload

// this does not work:
//In 'chrome://flags' set 'Allow invalid certificates from resources loaded from localhost'

chrome://serviceworker-internals  > open DEvTools window and pause Javascript
execution on Service Worker startup...

see also: chrome://inspect/#service-workers
*/

var CACHE_NAME = 'voxforge-cache-v0.1';
var PATH = '/assets/static/';

var urlsToCache = [
  PATH + 'lib/jquery.mobile-1.4.5.js',
  PATH + 'lib/jquery-1.12.4.js',
  PATH + 'lib/jszip.js',
  PATH + 'lib/languages.js',
  PATH + 'lib/localforage.js',
  PATH + 'lib/platform.js',
  PATH + 'lib/state-machine.js',
  PATH + 'lib/visualize.js',
  PATH + 'lib/WavAudioEncoder.js',
  PATH + 'lib/wavesurfer.js',
  PATH + 'lib/webrtc_vad.js',

  PATH + 'scripts/app.js',
  PATH + 'scripts/Audio.js',
  PATH + 'scripts/AudioWorker.js',
  PATH + 'scripts/Controller.js',
  PATH + 'scripts/processSavedSubmissions.js',
  PATH + 'scripts/Profile.js',
  PATH + 'scripts/Prompts.js',
  PATH + 'scripts/upload.js',
  PATH + 'scripts/UploadWorker.js',
  PATH + 'scripts/Vad.js',
  PATH + 'scripts/View.js',
  PATH + 'scripts/ZipWorker.js',

  PATH + 'styles/app.css',
  PATH + 'styles/jquery.mobile-1.4.5.css',

  '/voxforge_sw.js',
  '/manifest.json',

  '/en/read/',
//  '/en/prompts/001.html',
//  '/en/prompts/002.html',
//  '/en/prompts/003.html',
];

//var uploadURL;
self.addEventListener('install', function(event) {
  //event.waitUntil(self.skipWaiting()); // Activate worker immediately

  // Perform install steps
  event.waitUntil(
      caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// https://stackoverflow.com/questions/38168276/navigator-serviceworker-controller-is-null-until-page-refresh?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
//  To take control over all open pages without waiting for refresh/reopen, 
// you have to add these commands to your Service Worker:
// self.skipWaiting(); // added above in install
// see also: https://gist.github.com/Rich-Harris/fd6c3c73e6e707e312d7c5d7d0f3b2f9
// https://stackoverflow.com/questions/37050383/unable-to-post-message-to-service-worker-because-controller-value-is-null
//self.addEventListener('activate', function(event) {
//    event.waitUntil(self.clients.claim()); // Become available to all pages
//});


/**
// TODO don't need to cache requests that are not listed above...
* If we want to cache new requests cumulatively, we can do so by handling the
* response of the fetch request and then adding it to the cache, like below.
*
* see: https://developers.google.com/web/fundamentals/primers/service-workers/

// TODO do we need a manifest file???
// http://diveintohtml5.info/offline.html
// TODO is this even required given that we have a list of the files we want
// cached above and we cache those...
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

* .catch function:
        // TODO causes weird behaviour in Chrome Android 4.4.2: rather than
        // firing off as soon as internet disconnected after user tries to 
        // upload to server, it queues and fires just before actual upload
        // occurs after internet is re-connected????
        // Chrome on LInux fires this off as soon as user tries to upload
        // when there is no Internet connection...

    // waitUntil method is used to tell the browser not to terminate the 
    // service worker until the promise passed to waitUntil is either resolved 
    // or rejected.

    // https://googlechrome.github.io/samples/service-worker/post-message/index.html
*/
self.addEventListener('sync', function(event) {
    if (event.tag == 'voxforgeSync') {
      console.log('voxforgeSync: background sync request received by serviceworker');

      let uploadURL = new URL(location).searchParams.get('uploadURL');
      // TODO passing parameters this way to service worker may be causing problems when
      // when app installed and called as a standalone app...
      //var uploadURL;
      //if (self.location.origin === 'https://voxforge.github.io') { // prod
      //    uploadURL = 'https://upload.voxforge1.org'; 
      //} else { 
      //    uploadURL = 'https://jekyll_voxforge.org/index.php'; // test
      //}

      event.waitUntil(
          processSavedSubmissions(uploadURL)
          .then(function(returnObj) {
              sendMessage(returnObj);
          })
          .catch(function(returnObj) {
              sendMessage(returnObj);
          })
      ); 

  }
});

/**
* A page is controlled by a service worker on navigation to an origin that the 
* service worker is registered for. So the original page load that actually
* initializes the service worker is not itself controlled...
*
* https://stackoverflow.com/questions/35100759/serviceworkers-focus-tab-clients-is-empty-on-notificationclick/35108844?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
*
* other research:
// https://stackoverflow.com/questions/30177782/chrome-serviceworker-postmessage?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
// https://miguelmota.com/blog/getting-started-with-service-workers/
//http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.Wsz7C-yEdNA
//https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage
//https://serviceworke.rs/message-relay_service-worker_doc.html
*/
function sendMessage(returnObj) {
  self.clients.matchAll({includeUncontrolled: true, type: 'window'})
  .then(function(clientList) {
    clientList.forEach(function(client) {
      client.postMessage(returnObj);
    });
  });
}




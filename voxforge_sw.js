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
// processSavedSubmissions is called from service worker (voxforge_sw.js) 
// from a absolute root (as opposed to relative path) therefore localforage 
// import must be done in calling script
importScripts('assets/static/lib/localforage.js'); // localforage needs to be defined before call to processSavedSubmissions

importScripts('assets/static/scripts/processSavedSubmissions.js'); 

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
  PATH + 'scripts/Debug.js',
  PATH + 'scripts/location.js',
  PATH + 'scripts/Parms.js',
  PATH + 'scripts/processSavedSubmissions.js',
  PATH + 'scripts/Profile.js',
  PATH + 'scripts/Prompts.js',
  PATH + 'scripts/Uploader.js',
  PATH + 'scripts/UploadWorker.js',
  PATH + 'scripts/Vad.js',
  PATH + 'scripts/View.js',
  PATH + 'scripts/wavAudioEncoder.js',
  PATH + 'scripts/ZipWorker.js',

  PATH + 'styles/app.css',
  PATH + 'styles/jquery.mobile-1.4.5.css',

  '/voxforge_sw.js',
  '/en/manifest.json',
  '/fr/manifest.json',

  // need one entry for each language, otherwise will not be able to switch
  // language while offline
  // no .html suffix required, but if make updates, need to wait for changes
  // to propagate in githubPages, because they cache on their server too...
  // if change /en/read, make sure to change manifest file
  '/en/read',
  '/fr/read',
  '/es/read',
  
  //'/en/read/', // TODO debug with Apache2 and self signed SSL certificate

  // TODO also cache links to outside websites for definitions, elaboration, etc...

  // cache at least one prompt file for each language
  '/en/prompts/001.html',
  '/fr/prompts/001.html',
  '/es/prompts/001.html',

  // cache language specific front pages so can switch languages
  // Note: caching only occurs after user goes to read page....
  '/',
  '/fr',
  '/es',
  // supporting files for that language specific home pages work
  '/css/main.css',
  '/images/voxforge-logo-2.png',
  '/images/search.jpg',
  '/images/faq-icon.jpg',
  '/images/Gear_icon-72a7cf.png',
];

//var uploadURL;
self.addEventListener('install', function(event) {
  //event.waitUntil(self.skipWaiting()); // Activate worker immediately

  // Perform install steps
  event.waitUntil(
      caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('adding files to service worker cache');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
* to cache new requests cumulatively, handle the
* response of the fetch request and then adde it to the cache:
*
// TODO don't need to cache requests that are not listed above...should this be removed?
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

self.addEventListener('sync', function(event) {
    if (event.tag == 'voxforgeSync') {
      console.log('voxforgeSync: background sync request received by serviceworker');

      let uploadURL = new URL(location).searchParams.get('uploadURL');

      event.waitUntil(
          processSavedSubmissions(uploadURL, "serviceworker")
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
* 
*/
function sendMessage(returnObj) {
  self.clients.matchAll({includeUncontrolled: true, type: 'window'})
  .then(function(clientList) {
    clientList.forEach(function(client) {
      client.postMessage(returnObj);
    });
  });
}


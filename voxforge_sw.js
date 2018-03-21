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
// Chrome service worker debugging woes:
// 1) http://127.0.0.1:4000/en/read/  # jekyll default server
// client service worker registers and caches files... wtf
// server with uploadURL = 'http://127.0.0.1/index.php'
//      error: (index):1 Failed to load http://127.0.0.1/index.php: Response for preflight is invalid (redirect)
//      need https for preflight to work correctly

// 2) https://127.0.0.1:4000/en/read/  # jekyll default server
// service workers register; fetch of javascript etc files works; error: will not upload

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


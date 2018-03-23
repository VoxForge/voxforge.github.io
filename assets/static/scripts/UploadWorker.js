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

/*
for testing:
if get Failed to load ‘https://jekyll2_voxforge.org/index.php’. A ServiceWorker 
passed a promise to FetchEvent.respondWith() that rejected with 
‘TypeError: NetworkError when attempting to fetch resource.’.
make sure to import self-signed root Cert into Firefox certificate store

*/

importScripts('processSavedSubmissions.js'); 
importScripts('../lib/localforage.js');

self.onmessage = function(event) {
  var data = event.data;
  switch (data.command) {
    case 'upload':
      upload(self, data);
      break;
    default:
      console.error('UploadWorker error. Invalid command: ' + data.command);
      break;
  }
};

/**
* every time a user makes a submission and tries upload, this worker will
* check for any saved submissions that were recorded offline, or which
* had problems uploading to server
*/
function upload(self, data) {
    processSavedSubmissions()
    .then((successMessage) => {
      self.postMessage({
        status: successMessage,
      });
    })
    .catch(function(errorMessage) {
      self.postMessage({
        status: errorMessage, 
      });
    })
}

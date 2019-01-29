/*
Copyright 2019 VoxForge

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

/**
* setup app settings Popup for user to modify
*/
function SubmissionsLog (
    saved_submissions,
    uploaded_submissions,)
{
    this.saved_submissions = saved_submissions;
    this.uploaded_submissions = uploaded_submissions;
    
    this.uploadedSubmissions = localforage.createInstance({
      name: "uploadedSubmissions"
    });
    
    this.submissionCache = localforage.createInstance({
      name: "submissionCache"
    });    
}

/**
* setup display of log of uploaded and saved submissions
* 
* TODO how to deal with n>25 submissions... only show 25 most recent submissions?
* TODO this function is really slow on slower mobile devices, need caching
*/
SubmissionsLog.prototype.setupDisplay = function () 
{
    var self = this;
  
    /**
     * returns Array of submissions 
     */
    function getDatabaseKeys(database, message) {
      return new Promise(function (resolve, reject) {
        
        database.length()
        .then(function(numberOfKeys) {
          if (numberOfKeys <= 0) {
            console.log('no ' + message);
            resolve("");
          }
        })
        .catch(function(err) {
            console.log(err);
            resolve("");
        });

        database.keys()
        .then(function(keys) {
            // An array of all the key names.
            if (keys.length > 0) {
              console.log(message + ' ' + keys);
              resolve(keys);
            }
        })
        .catch(function(err) {
            // This code runs if there were any errors
            console.log(err);
            resolve("");
        });

      });
    }

    /**
     * returns Array containing list of submissions that were uploaded to
     * Voxforge server
     */
    function getUploadedSubmissionList() {
      return new Promise(function (resolve, reject) {
        
          getDatabaseKeys(self.uploadedSubmissions, 'uploaded submissions')
          .then(function (uploadedSubmissionList) {
              if (uploadedSubmissionList) {
                  resolve(uploadedSubmissionList);
              } else {
                  resolve("");
              }
          })
          .catch((err) => { console.log(err) });
          
      });
    }

    /**
     * get list of submissions stored in browser cache
     */
    function getSavedSubmissionList(uploadedSubmissionList) {
      return new Promise(function (resolve, reject) {
        
          getDatabaseKeys(self.submissionCache, 'saved submissions')
          .then(function (savedSubmissionList) {
              if (savedSubmissionList) {
                  resolve([uploadedSubmissionList, savedSubmissionList]);
              } else {
                  resolve([uploadedSubmissionList, ""]);
              }
          })
          .catch((err) => { console.log(err) });

      });
    }
   
    /**
    * helper function to wrap array in html
    *
    */
    function makeHTMLlist (array, heading) {
        var count = 1;
        if (array) {
            return '<h3>' + heading + '</h3>' +
               '<ul>' + 
               jQuery.map(array,
                   function(element) {
                      return( '<li>' + count++ + '. ' + element + '</li>' );
                   }
               )
               .join('') + // returns as a string
               '</ul>';
        } else {
           return "";
        }
    }

    // cannot call one popup from another; therefore open second one
    // after first one closes
    // see: http://api.jquerymobile.com/popup/
    // chaining of popups
    $( document ).on( "pageinit", function() {
        $("#popupSettings").on({
          popupafterclose: function() {
              getUploadedSubmissionList()
              .then(getSavedSubmissionList)
              .then(function (savedAndUploadedSubmissionArray) {
                  $('#popupSubmissionList').popup(); // initialize popup before open

                  // TODO translate
                  var uploadedHTML = makeHTMLlist(
                      savedAndUploadedSubmissionArray[0],
                      self.uploaded_submissions);
                  var savedHTML = makeHTMLlist(
                      savedAndUploadedSubmissionArray[1],
                      self.saved_submissions);                 
                  if (savedAndUploadedSubmissionArray[0] ||
                      savedAndUploadedSubmissionArray[1])
                  {
                    $("#submission-list").html(uploadedHTML + savedHTML);
                    setTimeout(function() { $("#popupSubmissionList").popup( "open" ) }, 100 );
                  }
              })
              .catch(function(err) { console.log(err) });
          } // popupafterclose
        });
    });
}

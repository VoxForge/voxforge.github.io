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

var SubmissionsLog = (function() { // code to keep helper classes inside View namespace //
    
/**
* setup display of log of uploaded and saved submissions
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

/*
* TODO how to deal with n>25 submissions... only show 25 most recent submissions?
* TODO this function is really slow on slower mobile devices, need caching
*
* Note: cannot call one popup from another; therefore open second one
* after first one closes
* see: http://api.jquerymobile.com/popup/
*chaining of popups
*/
SubmissionsLog.prototype.setupDisplay = function() {
    var self = this;

    $( document ).on( "pageinit", function() {
        $("#popupSettings").on({
          popupafterclose: function() {
                self._getDatabaseKeys.call(self,
                    self.uploadedSubmissions,
                    'uploaded submissions')
                .then(function (uploadedSubmissionList) {
                    self.uploadedSubmissionList = uploadedSubmissionList;
                })
                self._getDatabaseKeys.call(self,
                    self.submissionCache,
                    'saved submissions')
                .then(function (savedSubmissionList) {
                        self.savedSubmissionList = savedSubmissionList;              
                })                
              .then( self._getSavedSubmissionList.bind(self) )
              .then( self._secondPopup.bind(self) )
              .catch(function(err) { console.log(err) });
          } // popupafterclose
        });
    });
}

/**
 * returns Array of submissions 
 */
SubmissionsLog.prototype._getDatabaseKeys = function(submissionDB, message) {
    var self = this;
    
    return new Promise(function (resolve, reject) {

        submissionDB.length()
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

        submissionDB.keys()
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

SubmissionsLog.prototype._secondPopup = function() {
    var submissionList = this._submissionListToString();

    $('#popupSubmissionList').popup(); // initialize popup before open
    if ( this._uploadedOrSaved() ) {
        $("#submission-list").html(submissionList);
        setTimeout(
            function() {
                $("#popupSubmissionList").popup( "open" )
            }, 100 );
    }
}

SubmissionsLog.prototype._uploadedOrSaved = function(submissions) {
    return this.uploadedSubmissionList || this.savedSubmissionList;
}

SubmissionsLog.prototype._submissionListToString = function() {
    var uploadedHTML = new Html(
        this.uploaded_submissions,    
        this.uploadedSubmissionList);
    var savedHTML = new Html(
        this.saved_submissions,    
        this.savedSubmissionList);

    return uploadedHTML.make() + savedHTML.make();
}

// #############################################################################

/*
 * Constructor
 */
/**
* helper function to wrap array in html
*
*/
function Html(
    heading,
    submissionList)
{
    this.heading = heading;
    this.submissionList = submissionList;
}

Html.prototype.make = function() {
    if (this.submissionList) {
        return this._submissionList2Html();
    } else {
       return "";
    }
}

Html.prototype._submissionList2Html = function() {
    return '<h3>' + this.heading + '</h3>' +
        this._arrayToHtmlList();
}

Html.prototype._arrayToHtmlList = function() {
    var count = 1;
    
    var result = '<ul>';
    result += jQuery.map(this.submissionList,
           function(element) {
              return( '<li>' + count++ + '. ' + element + '</li>' );
           })
        .join(''); // returns as a string
    result += '<ul>';
    
    return result;
}


/// code to keep helper classes inside SubmissionsLog namespace ////////////////
return SubmissionsLog;
}());

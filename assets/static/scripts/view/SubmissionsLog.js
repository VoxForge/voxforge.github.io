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
* setup display of log of uploaded and saved submissions
*/
View.SubmissionsLog = function(
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
    this.maxNumberOfSubmissions2display = 20;
}

/*
* Note: cannot call one popup from another; therefore open second one
* after first one closes
* see: http://api.jquerymobile.com/popup/
* (chaining of popups)
*/
View.SubmissionsLog.prototype.setupDisplay = function() {
    var self = this;

    $( document ).on( "pageinit", function() {
        $("#popupSettings").on(
            'popupafterclose', self._popupafterclose.bind(self) );
    });
}

View.SubmissionsLog.prototype._popupafterclose = function() {
    var self = this;
    
    Promise.all( this._getSubmissionListPromises() )
    .then( self._popup.bind(self) )
    .catch(function(err) { console.log(err) });
}

// TODO need to check for empty indexedDB - error occurs
View.SubmissionsLog.prototype._getSubmissionListPromises = function() {
    var self = this;
    
    var promise1 =
        this.uploadedSubmissions.keys()
        .then(function(uploadedSubmissionList) {
            self.uploadedSubmissionList = uploadedSubmissionList;
        });
    var promise2 =
        self.submissionCache.keys()
        .then(function (savedSubmissionList) {
            self.savedSubmissionList = savedSubmissionList;              
        });

    return [promise1, promise2];
}

View.SubmissionsLog.prototype._popup = function() {
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

View.SubmissionsLog.prototype._uploadedOrSaved = function(submissions) {
    return this.uploadedSubmissionList || this.savedSubmissionList;
}

// TODO implement pagination of some sort...
// display new popup for each 20 submissions,
// with option to cancel so user can skip
View.SubmissionsLog.prototype._submissionListToString = function() {
    var savedHTML = new View.Html(
        this.saved_submissions,    
        this.savedSubmissionList
            .slice(0, this.maxNumberOfSubmissions2display));    
    var uploadedHTML = new View.Html(
        this.uploaded_submissions,    
        this.uploadedSubmissionList
            .slice(0, this.maxNumberOfSubmissions2display));

    return savedHTML.make() + uploadedHTML.make();
}

// #############################################################################

/**
* helper function to wrap array in html
*/
View.Html = function(
    heading,
    submissionList)
{
    this.heading = heading;
    this.submissionList = submissionList;
}

/*
 * Methods
 */
View.Html.prototype.make = function() {
    if (this.submissionList) {
        if ( this.submissionList == 0 ) {
            return this._emptySubmissionList2Html();
        } else {
            return this._submissionList2Html();
        }
    } else {
       return "";
    }
}

View.Html.prototype._emptySubmissionList2Html = function() {
    return '<h3>' + this.heading + '</h3>' +
        '<ul>' + '<li>' + "none" + '</li>' + '<ul>';
}

View.Html.prototype._submissionList2Html = function() {
    return '<h3>' + this.heading + '</h3>' +
        this._arrayToHtmlList();
}

// TODO need some way of return translated "None" if no submissions
View.Html.prototype._arrayToHtmlList = function() {
    var count = 1;
    
    var result = '<ul>';
    result += jQuery.map(this.submissionList,
        function(element, index) {
            return( '<li>' + count++ + '. ' + element + '</li>' );
        })
        .join(''); // returns as a string
    result += '<ul>';
    
    return result;
}


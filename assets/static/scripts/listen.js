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
var baseurl;

if (window.location.origin === 'https://voxforge.github.io') { // prod
  baseurl = 'https://upload.voxforge1.org'; 
} else { // testing
  //baseurl = 'https://jekyll_voxforge.org/directory_list.php'; // test basic workings
  baseurl = 'https://jekyll_voxforge.org'; // test basic workings
  //baseurl = 'https://jekyll2_voxforge.org/directory_list.php'; // test CORS
}

var url = baseurl + "/directory_list.php";
var path = "/assets/static/scripts/";

$.ajax({
  url: url,
  method: 'GET',
  headers: {
      'Access-Control-Allow-Origin': '*'
  },
  contentType: "application/json",
  success: function(response) {
    console.log(response);
    $('.directory-list').html( response.map(x => '<a href ="' + baseurl + path + x + '">'+ x + '</a><br>') );
  },
});



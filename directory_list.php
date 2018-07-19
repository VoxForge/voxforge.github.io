<?php
// set voxforge1.org server to be php7.1
// https://help.1and1.com/hosting-c37630/scripts-and-programming-languages-c85099/php-c37728/enable-error-logs-a792503.html
// set up logging in php.ini in same folder as this script

// if change here, remember to update ZipWorker.js: uploadURL
// also move index.php to prod
$ALLOWEDURL = "https://voxforge.github.io"; // prod

//!!!!!!
//$ALLOWEDURL = "https://jekyll_voxforge.org"; // testing
$ALLOWEDURL = "http://localhost:4000"; // testing
//!!!!!!


header("Access-Control-Allow-Origin: $ALLOWEDURL");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Request-Headers, x-requested-with");
//header("Access-Control-Max-Age: 86400"); # 24hrs * 60min * 60secs = 86400
header("Access-Control-Max-Age: 1"); #testing
//header("Access-Control-Allow-Credentials: true"); # allow cookies

/* testing: clear && curl --include -X voxforge1.org/upload.php --header Access-Control-Request-Method:POST --header Access-Control-Request-Headers:Content-Type --header Origin:https://voxforge.github.io
 * error handling see http://php.net/manual/en/features.file-upload.php
 * make sure apache user has write permission to uploadfolder
 *
 * see: https://www.w3.org/wiki/CORS_Enabled 
 */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
   die("OPTIONS response");
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
   die("only GET requests are allowed");
}

// see: https://stackoverflow.com/questions/41326257/how-i-can-get-origin-of-request-with-php/41326346
//if ($_SERVER['HTTP_ORIGIN'] !== $ALLOWEDURL) {
//   die("POSTing Only Allowed from $ALLOWEDURL");
//}

// ### MAIN ####################################################################

//define the path as relative
// DEBUG  $path = "./audiosubmissions/";
$path = "assets/static/scripts";  

$dir_handle = @opendir($path) or die("Unable to open $path");

$fileList[]=""; 
while (false !== ($file = readdir($dir_handle))) {
    if ($file != "." && $file != "..") {
	    global $filelist;
      $fileList[] = $file;
    }
}

echo json_encode($fileList);

closedir($dir_handle);

// ### FUNCTIONS ###############################################################


?>

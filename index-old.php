<?php
// set voxforge1.org server to be php7.1
// https://help.1and1.com/hosting-c37630/scripts-and-programming-languages-c85099/php-c37728/enable-error-logs-a792503.html
// set up logging in php.ini in same folder as this script

// if change here, remember to update ZipWorker.js: uploadURL
// also move index.php to prod
$ALLOWEDURL = "https://voxforge.github.io"; // prod
$UPLOADFOLDER = '../../public/speechsubmissions/'; // prod

//!!!!!!
$ALLOWEDURL = "https://jekyll_voxforge.org"; // testing
$UPLOADFOLDER = './submissions/'; // testing
//!!!!!!

// see: https://jekyll_voxforge.org/phpinfo.php
// dev location of apache2 PHP7 configs: /etc/php/7.2/apache2/PHP.ini
// post_max_size = 100M
// upload_max_filesize = 100m
// if change php.ini, restart apache2 for it to take effect
// TODO max upload size should be a function of the number of prompts
// but also need to change php.ini configs...
$MAX_UPLOAD_SIZE = 100 * 1024 * 1024; //100 megabytes
$MAX_UNZIPPED_SIZE = 100 * 1024 * 1024; // 100 megabytes

header("Access-Control-Allow-Origin: $ALLOWEDURL");
header("Content-Type: multipart/form-data");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
   die("only POST requests are allowed");
}

// see: https://stackoverflow.com/questions/41326257/how-i-can-get-origin-of-request-with-php/41326346
if ($_SERVER['HTTP_ORIGIN'] !== $ALLOWEDURL) {
   die("POSTing Only Allowed from $ALLOWEDURL");
}

// ### MAIN ####################################################################

try {
    $tmp_name = $_FILES['file']['tmp_name'];

    errorChecking(
      $_FILES['file']['error'],
      $_FILES['file']['size'],
      $_FILES['file']['tmp_name']
    );

    $destination = createNewFileName(
      $_REQUEST['language'],
      $_REQUEST['username'],
      $_REQUEST['suffix'],
      $GLOBALS['UPLOADFOLDER']
    );

    if (!move_uploaded_file(
      $tmp_name,
      $destination
    )) {
      throw new RuntimeException('Failed to move submission file.');
    }
    echo 'submission uploaded successfully.';

} catch (RuntimeException $e) {
    echo $e->getMessage();
}

// ### FUNCTIONS ###############################################################

function errorChecking($file_error, $file_size, $tmp_name) {
    // Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if (
      !isset($file_error) ||
      is_array($file_error)
    ) {
     throw new RuntimeException('Invalid parameters.');
    }

    // Check $_FILES['file']['error'] value.
    switch ($file_error) {
      case UPLOAD_ERR_OK:
          break;
      case UPLOAD_ERR_NO_FILE:
          throw new RuntimeException('No file sent.');
      case UPLOAD_ERR_INI_SIZE:
    // see: php.ini 
    // upload_max_filesize = 500M
    // post_max_size = 200M
    // phpinfo.php to confirm apache2 is picking this up
    // e.g. https://jekyll_voxforge.org/phpinfo.php
    // apache2 uses /etc/php/7.2/apache2/php.ini by default
    // $ sudo ln  /home/daddy/git/voxforge.github.io /etc/php/7.2/apache2/php.ini
      case UPLOAD_ERR_FORM_SIZE:
          throw new RuntimeException('Exceeded filesize limit.');
      default:
          throw new RuntimeException('Unknown errors.');
    }

    // You should also check filesize here. 
    if ($file_size > $GLOBALS['MAX_UPLOAD_SIZE']) {
      throw new RuntimeException('Exceeded filesize limit. (' + $file_size + ')');
    }

    // DO NOT TRUST $_FILES['file']['mime'] VALUE !!
    // Check MIME Type by yourself.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if (false === $extension = array_search(
      $finfo->file($tmp_name),
      array(
          'zip' => 'application/zip',
      ),
      true
    )) {
      throw new RuntimeException('Invalid file format.');
    }

    $unzipped_filesize = get_zip_originalsize($tmp_name);
    if ($unzipped_filesize > $GLOBALS['MAX_UNZIPPED_SIZE']) {
      throw new RuntimeException('Exceeded unzipped size limit. (' + $file_size + ')');
    }

}

function get_zip_originalsize($filename) {
    $size = 0;
    $resource = zip_open($filename);
    while ($dir_resource = zip_read($resource)) {
        $size += zip_entry_filesize($dir_resource);
    }
    zip_close($resource);

    return $size;
}

function createNewFileName($language, $username, $suffix, $uploadfolder) {
    // limits the length of the filename to 40 char + date and 3 char random code
    $language = basename( $language ); // may prevent directory traversal attacks
    $language = preg_replace  ( "[^a-zA-Z0-9_-]" , "" , $language  ); // remove unwanted characters
    $language = strtoupper( substr($language , 0, 2) ); // set to uppercase; 2 character max size
    if ($language === '') {
      $language = 'XX';
    }

    $username = basename( $username );
    $username = preg_replace  ( "/\s+/", "_", $username ); // replace one or more spaces with single undescore
    $username = preg_replace  ( "[^a-zA-Z0-9_-]"  , "" , $username ); // remove unwanted characters
    $username = substr($username , 0, 40); // 40 character max size
    if ($username === '') {
      $username = 'YYYYYYYY';
    }

    $suffix = basename( $suffix ); 
    $suffix = preg_replace  ( "[^a-z]" , ""  , $suffix  ); // only allow lower case alpha characters
    $suffix = substr($suffix , 0, 3); // 3 character max size
    if ($suffix === '') {
      $suffix = 'ZZZ';
    }

    date_default_timezone_set('America/Toronto');
    $date =  date('Ymd');
    //$threeRandomChar = substr(md5(microtime()),rand(0,26),3);
    $randomNumbers = mt_rand();

    $filename = $language . '-' . $username . '-' . $date . '-' . $suffix . "[" . $randomNumbers . "]" . ".zip";
    $destination = $uploadfolder . $filename;

    return $destination;
}

?>

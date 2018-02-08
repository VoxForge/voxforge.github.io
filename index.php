<?php
$allowedURL = "https://voxforge.github.io";


header("Access-Control-Allow-Origin: $allowedURL");
header("Content-Type: multipart/form-data");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Request-Headers, x-requested-with");
//header("Access-Control-Max-Age: 86400"); # 24hrs * 60min * 60secs = 86400
header("Access-Control-Max-Age: 1"); #testing

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
if ($_SERVER['HTTP_ORIGIN'] !== $allowedURL) {
  die("POSTing Only Allowed from $allowedURL");
}


try {
  //$uploadfolder = './submissions/'; // testing
  $uploadfolder = '../../public/speechsubmissions/'; // prod
  // max size should be a function of the number of prompts
  $max_size_mb = 10; // max size in megabytes

  $tmp_name = $_FILES['file']['tmp_name'];
  $file_error = $_FILES['file']['error'];
  $file_size = $_FILES['file']['size'];
  $max_size =  $max_size_mb * 1024 * 1024;
  $username = $_REQUEST['username'];
  $language = $_REQUEST['language'];

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
    case UPLOAD_ERR_FORM_SIZE:
        throw new RuntimeException('Exceeded filesize limit.');
    default:
        throw new RuntimeException('Unknown errors.');
  }

  // You should also check filesize here. 
  if ($file_size > $max_size) {
    throw new RuntimeException('Exceeded filesize limit.');
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

  // limits the length of the filename to 40 char + date and 3 char random code
  $language = basename( $language ); // may prevent directory traversal attacks
  $language = preg_replace  (  "[^a-zA-Z0-9_-]"  , ""  , $language  ); // remove unwanted characters
  $language = strtoupper( substr($language , 0, 2) ); // set to uppercase

  $username = basename( $username ); // may prevent directory traversal attacks
  $username = preg_replace  (  "/\s+/", "_", $username  ); // replace one or more spaces with single undescore
  $username = preg_replace  (  "[^a-zA-Z0-9_-]"  , ""  , $username  ); // remove unwanted characters
  $username = substr($username , 0, 40); // 40 character max size

  $date =  date('Ymd');
  $threeRandomChar = substr(md5(microtime()),rand(0,26),3);
  $randomNumbers = mt_rand();

  $filename = $language . '-' . $username . '-' . $date . '-' . $threeRandomChar . "[" . $randomNumbers . "]" . ".zip";
  $destination = $uploadfolder . $filename;

  if (!move_uploaded_file(
    $tmp_name,
    $destination
  )) {
    throw new RuntimeException('Failed to move submission file.');
  }

  echo 'submission is uploaded successfully.';

} catch (RuntimeException $e) {
  echo $e->getMessage();
}
?>
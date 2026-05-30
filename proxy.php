<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$gas_url = 'https://script.google.com/macros/s/AKfycby6QK8SBTzYbyoFDQ5NFFP3G9OR4k-xcHHScaj46AdNaYYDxRIJGk-imYbH-GNvFT5iVw/exec';

$query = http_build_query($_GET);
$full_url = $gas_url . '?' . $query;

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $full_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $result = curl_exec($ch);
    $error  = curl_error($ch);
    curl_close($ch);

    if ($result === false || $error) {
        echo json_encode(['status' => 'error', 'message' => $error]);
    } else {
        echo $result;
    }
} else {
    $context = stream_context_create([
        'http' => [
            'method'          => 'GET',
            'follow_location' => 1,
            'timeout'         => 15,
        ]
    ]);
    $result = @file_get_contents($full_url, false, $context);
    echo $result !== false
        ? $result
        : json_encode(['status' => 'error', 'message' => 'connection failed']);
}

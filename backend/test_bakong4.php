<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$ref = new ReflectionClass('KHQR\BakongKHQR');
echo 'BakongKHQR file: ' . $ref->getFileName() . PHP_EOL;
$dir = dirname($ref->getFileName());
echo 'Dir: ' . $dir . PHP_EOL;
$files = glob($dir . '/*.php');
foreach ($files as $f) echo basename($f) . PHP_EOL;

// Also list parent dir
$parentFiles = glob(dirname($dir) . '/*.php');
foreach ($parentFiles as $f) echo 'parent: ' . basename($f) . PHP_EOL;
$subDirs = glob(dirname($dir) . '/*', GLOB_ONLYDIR);
foreach ($subDirs as $d) echo 'subdir: ' . basename($d) . PHP_EOL;

// Read the source to understand the MD5 computation
echo "\n=== BakongKHQR Source ===\n";
echo file_get_contents($ref->getFileName());

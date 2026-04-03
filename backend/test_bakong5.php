<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$ref = new ReflectionClass('KHQR\BakongKHQR');
$libDir = dirname(dirname($ref->getFileName()));
echo "Library root: $libDir\n\n";

// Find all PHP files in the library
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($libDir));
foreach ($iterator as $file) {
    if ($file->getExtension() === 'php') {
        echo $file->getPathname() . "\n";
    }
}

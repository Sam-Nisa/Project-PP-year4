<?php

namespace App\Services;

use ImageKit\ImageKit;

class ImageKitService
{
    protected $imageKit;

    public function __construct()
    {
        $this->imageKit = new ImageKit(
            env('IMAGEKIT_PUBLIC_KEY'),
            env('IMAGEKIT_PRIVATE_KEY'),
            env('IMAGEKIT_URL_ENDPOINT')
        );
    }

    public function upload($file, $fileName, $folder = '/uploads')
    {
        return $this->imageKit->upload([
            'file' => fopen($file, 'r'),
            'fileName' => $fileName,
            'folder' => $folder,
        ]);
    }
}

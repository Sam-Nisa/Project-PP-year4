<?php

namespace App\Services;

use KHQR\BakongKHQR;
use KHQR\Helpers\KHQRData;
use KHQR\Models\MerchantInfo;
use KHQR\Exceptions\KHQRException;
use Illuminate\Support\Facades\Log;

class BakongPaymentService
{
    private $bakongKhqr;
    private $bakongAccountId;
    private $merchantName;
    private $merchantCity;
    private $mobileNumber;

    public function __construct()
    {
        $token = config('services.bakong.api_token');
        $this->bakongAccountId = config('services.bakong.account_id');
        $this->merchantName = config('services.bakong.merchant_name');
        $this->merchantCity = config('services.bakong.merchant_city', 'Phnom Penh');
        $this->mobileNumber = config('services.bakong.mobile_number');

        // Initialize BakongKHQR with token if available
        if ($token) {
            $this->bakongKhqr = new BakongKHQR($token);
        }
    }

    /**
     * Generate KHQR code for an order
     * 
     * @param float $amount
     * @param string $currency (USD or KHR)
     * @param string|null $billNumber
     * @param string|null $storeLabel
     * @return array
     */
    public function generateQRCode($amount, $currency = 'USD', $billNumber = null, $storeLabel = null)
    {
        try {
            // Log input parameters
            Log::info('Bakong QR Generation Started', [
                'amount' => $amount,
                'currency' => $currency,
                'billNumber' => $billNumber,
                'storeLabel' => $storeLabel
            ]);

            // Convert currency code to KHQR format
            $currencyCode = $currency === 'USD' ? KHQRData::CURRENCY_USD : KHQRData::CURRENCY_KHR;

            // Get merchant ID (use account ID as fallback if not set)
            $merchantId = config('services.bakong.merchant_id');
            if (empty($merchantId)) {
                // Use the username part of the Bakong account ID as merchant ID
                $merchantId = explode('@', $this->bakongAccountId)[0];
            }

            // Get acquiring bank (required)
            $acquiringBank = config('services.bakong.acquiring_bank');
            if (empty($acquiringBank)) {
                $acquiringBank = 'ABA Bank'; // Default
            }

            // Log configuration
            Log::info('Bakong Configuration', [
                'account_id' => $this->bakongAccountId,
                'merchant_name' => $this->merchantName,
                'merchant_city' => $this->merchantCity,
                'merchant_id' => $merchantId,
                'acquiring_bank' => $acquiringBank,
                'mobile_number' => $this->mobileNumber
            ]);

            // Create merchant info
            $merchantInfo = new MerchantInfo(
                bakongAccountID: $this->bakongAccountId,
                merchantName: $this->merchantName,
                merchantCity: $this->merchantCity,
                merchantID: $merchantId,
                acquiringBank: $acquiringBank,
                currency: $currencyCode,
                amount: $amount,
                mobileNumber: $this->mobileNumber,
                billNumber: $billNumber,
                storeLabel: $storeLabel
            );

            Log::info('Calling BakongKHQR::generateMerchant');
            $response = BakongKHQR::generateMerchant($merchantInfo);

            Log::info('Bakong Response', [
                'response_type' => gettype($response),
                'response' => $response
            ]);

            if ($response && isset($response->status) && $response->status['code'] === 0) {
                Log::info('QR Generation Successful');
                return [
                    'success' => true,
                    'qr_string' => $response->data['qr'],
                    'md5' => $response->data['md5'],
                    'amount' => $amount,
                    'currency' => $currency
                ];
            }

            Log::error('QR Generation Failed', [
                'status' => $response->status ?? 'No status',
                'message' => $response->status['message'] ?? 'Unknown'
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate QR code',
                'error' => $response->status['message'] ?? 'Unknown error'
            ];

        } catch (KHQRException $e) {
            Log::error('Bakong QR Generation Error (KHQR Exception): ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Failed to generate QR code',
                'error' => $e->getMessage()
            ];
        } catch (\Exception $e) {
            Log::error('Bakong QR Generation Error (General Exception): ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Failed to generate QR code',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Check if Bakong account exists
     * 
     * @param string $accountId
     * @return bool
     */
    public function checkAccountExists($accountId)
    {
        try {
            $response = BakongKHQR::checkBakongAccount($accountId);
            
            if ($response->status['code'] === 0) {
                return $response->data['bakongAccountExists'];
            }
            
            return false;
        } catch (KHQRException $e) {
            Log::error('Bakong Account Check Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check transaction status by MD5
     * 
     * @param string $md5Hash
     * @return array|null
     */
    public function checkTransactionByMD5($md5Hash)
    {
        try {
            if (!$this->bakongKhqr) {
                throw new \Exception('Bakong API token not configured');
            }

            $response = $this->bakongKhqr->checkTransactionByMD5($md5Hash, true);
            
            if ($response && isset($response->status) && $response->status['code'] === 0 && isset($response->data)) {
                return [
                    'success' => true,
                    'transaction' => $response->data
                ];
            }

            return [
                'success' => false,
                'message' => 'Transaction not found'
            ];

        } catch (KHQRException $e) {
            Log::error('Bakong Transaction Check Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify KHQR string
     * 
     * @param string $qrString
     * @return bool
     */
    public function verifyQRCode($qrString)
    {
        try {
            $result = BakongKHQR::verify($qrString);
            return $result->isValid;
        } catch (KHQRException $e) {
            Log::error('Bakong QR Verification Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Decode KHQR string
     * 
     * @param string $qrString
     * @return array|null
     */
    public function decodeQRCode($qrString)
    {
        try {
            $response = BakongKHQR::decode($qrString);
            
            if ($response->status['code'] === 0) {
                return [
                    'success' => true,
                    'data' => $response->data
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to decode QR code'
            ];

        } catch (KHQRException $e) {
            Log::error('Bakong QR Decode Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Renew Bakong API token
     * 
     * @param string $email
     * @return array
     */
    public function renewToken($email)
    {
        try {
            $result = BakongKHQR::renewToken($email);
            
            if ($result['responseCode'] === 0) {
                return [
                    'success' => true,
                    'token' => $result['data']['token'],
                    'message' => $result['responseMessage']
                ];
            }

            return [
                'success' => false,
                'message' => $result['responseMessage'],
                'error_code' => $result['errorCode']
            ];

        } catch (\Exception $e) {
            Log::error('Bakong Token Renewal Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}

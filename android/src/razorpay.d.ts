declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    /**
     * The description of the transaction (e.g., "Official Merchandise")
     */
    description?: string;
    /**
     * URL of the image/logo to be displayed in the checkout modal
     */
    image?: string;
    /**
     * 3-letter ISO currency code (e.g., "INR")
     */
    currency: string;
    /**
     * Your Razorpay API Key ID
     */
    key: string;
    /**
     * Amount in the smallest currency unit (e.g., paise for INR)
     */
    amount: number;
    /**
     * The name of the merchant/business
     */
    name: string;
    /**
     * Optional order_id generated from your backend SDK
     */
    order_id?: string;
    /**
     * Pre-populated customer information
     */
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    /**
     * Custom branding for the checkout modal
     */
    theme?: {
      color?: string;
    };
    /**
     * Arbitrary key-value pairs for internal tracking
     */
    notes?: {
      [key: string]: string;
    };
  }

  /**
   * Response returned upon a successful transaction
   */
  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export default class RazorpayCheckout {
    /**
     * Opens the Razorpay Checkout modal
     * @param options Configuration for the payment
     */
    static open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>;
  }
}
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { createOrder } from '@/lib/actions/orders';
import { getSettings } from '@/lib/actions/settings';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { OrderSummary } from './order-summary';
import { DISTRICTS } from '@/lib/constants/districts';
import { toast } from 'sonner';

export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [district, setDistrict] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<
    'inside' | 'outside'
  >('inside');
  const [shippingCharges, setShippingCharges] = useState({
    inside: 70,
    outside: 180,
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Fetch shipping charges on mount
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getSettings();
      if (result.success && result.data) {
        setShippingCharges({
          inside: result.data.insideDhakaShipping,
          outside: result.data.outsideDhakaShipping,
        });
      }
    };
    loadSettings();

    // Track InitiateCheckout
    if (items.length > 0) {
      if (typeof window.fbq !== 'undefined') {
        window.fbq('track', 'InitiateCheckout', {
          num_items: items.reduce((acc, item) => acc + item.quantity, 0),
          value: totalPrice,
          currency: 'BDT',
          content_ids: items.map((item) => item.id),
          content_type: 'product',
        });
      }
    }
  }, []);

  // Auto-select delivery location based on district
  useEffect(() => {
    if (district === 'Dhaka') {
      setDeliveryLocation('inside');
    } else if (district) {
      setDeliveryLocation('outside');
    }
  }, [district]);

  const [phoneError, setPhoneError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Custom phone validation and formatting
    if (name === 'phone') {
      // Allow only numbers
      const cleaned = value.replace(/\D/g, '');

      // Limit to 11 digits
      const truncated = cleaned.slice(0, 11);

      setFormData((prev) => ({
        ...prev,
        [name]: truncated,
      }));

      // Validate format
      if (truncated.length > 0) {
        if (!truncated.startsWith('01')) {
          setPhoneError('Phone number must start with 01');
        } else if (
          truncated.length >= 3 &&
          !['3', '4', '5', '6', '7', '8', '9'].includes(truncated[2])
        ) {
          setPhoneError('Invalid operator code (must be 013-019)');
        } else if (truncated.length === 11) {
          setPhoneError('');
        } else {
          setPhoneError('Phone number must be 11 digits');
        }
      } else {
        setPhoneError('');
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const shippingCost =
    deliveryLocation === 'inside'
      ? shippingCharges.inside
      : shippingCharges.outside;
  const subtotal = Number(totalPrice);
  const orderTotal = subtotal + shippingCost;

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (items.length === 0) {
      toast.error('Your cart is empty');
      setIsSubmitting(false);
      return;
    }

    // Final phone validation before submit
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError(
        'Please enter a valid Bangladeshi phone number (e.g., 01712345678)',
      );
      toast.error('Please enter a valid phone number');
      setIsSubmitting(false);
      return;
    }

    try {
      const fullAddress = district
        ? `${formData.address}, ${district}`
        : formData.address;

      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        address: fullAddress,
        notes: formData.notes,
        total: orderTotal,
        shippingCost: shippingCost,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          productImage: item.featuredImage,
          quantity: item.quantity,
          price: Number(item.price),
          selectedOptions: item.selectedOptions,
        })),
      };

      const result = await createOrder(orderData);

      if (result.success) {
        setIsSuccess(true);
        clearCart();
        toast.success('Order placed successfully!');
        router.push(`/checkout/success?orderNumber=${result.orderNumber}`);
      } else {
        toast.error(result.error || 'Failed to place order');
        setIsSubmitting(false);
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <div className="text-2xl font-semibold">Your cart is empty</div>
        <p className="text-muted-foreground">
          Add some items to your cart to proceed with checkout.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Checkout Form */}
      <div className="lg:col-span-7">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Shipping Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please enter your contact and delivery information.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground block"
                >
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-foreground block"
                >
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`flex h-12 w-full rounded-lg border bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${
                    phoneError
                      ? 'border-destructive focus-visible:ring-destructive'
                      : 'border-input'
                  }`}
                  placeholder="01712345678"
                />
                {phoneError && (
                  <p className="text-sm text-destructive">{phoneError}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="district"
                className="text-sm font-medium text-foreground block"
              >
                District <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  className="flex h-12 w-full appearance-none rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                >
                  <option value="">Select District</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.english} value={d.english}>
                      {d.english} ({d.bangla})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="address"
                className="text-sm font-medium text-foreground block"
              >
                Address <span className="text-destructive">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                placeholder="House #, Road #, Area..."
              />
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-sm font-medium text-foreground block">
                Delivery Location <span className="text-destructive">*</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
                    deliveryLocation === 'inside'
                      ? 'border-foreground bg-muted/30'
                      : 'border-border bg-background'
                  } ${district && district !== 'Dhaka' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value="inside"
                    checked={deliveryLocation === 'inside'}
                    onChange={(e) =>
                      setDeliveryLocation(e.target.value as 'inside')
                    }
                    disabled={district !== 'Dhaka' && district !== ''}
                    className="sr-only"
                  />
                  <div className="font-semibold">Inside Dhaka</div>
                  <div className="text-sm text-muted-foreground">
                    Delivery Charge:{' '}
                    <span className="text-foreground font-medium">
                      ৳{shippingCharges.inside}
                    </span>
                  </div>
                  {deliveryLocation === 'inside' && (
                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-foreground" />
                  )}
                </label>

                <label
                  className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
                    deliveryLocation === 'outside'
                      ? 'border-foreground bg-muted/30'
                      : 'border-border bg-background'
                  } ${district === 'Dhaka' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value="outside"
                    checked={deliveryLocation === 'outside'}
                    onChange={(e) =>
                      setDeliveryLocation(e.target.value as 'outside')
                    }
                    disabled={district === 'Dhaka'}
                    className="sr-only"
                  />
                  <div className="font-semibold">Outside Dhaka</div>
                  <div className="text-sm text-muted-foreground">
                    Delivery Charge:{' '}
                    <span className="text-foreground font-medium">
                      ৳{shippingCharges.outside}
                    </span>
                  </div>
                  {deliveryLocation === 'outside' && (
                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-foreground" />
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="notes"
                className="text-sm font-medium text-foreground block"
              >
                Order Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          {/* Desktop: Button inside form */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="hidden lg:flex w-full rounded-full bg-foreground py-4 text-base font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-50 items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Place Order - Cash on Delivery'
            )}
          </button>
        </form>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-5">
        <div className="sticky top-24">
          <OrderSummary shippingCost={shippingCost} />
        </div>
      </div>

      {/* Mobile: Button after summary */}
      <div className="lg:hidden">
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={async (e) => {
            e.preventDefault();
            const form = document.querySelector('form');
            if (form) {
              const submitEvent = new Event('submit', {
                bubbles: true,
                cancelable: true,
              });
              form.dispatchEvent(submitEvent);
            }
          }}
          className="w-full rounded-full bg-foreground py-4 text-base font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Place Order - Cash on Delivery'
          )}
        </button>
      </div>
    </div>
  );
}

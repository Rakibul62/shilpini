'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { createOrder } from '@/lib/actions/orders';
import { getSettings } from '@/lib/actions/settings';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const shippingCost =
    deliveryLocation === 'inside'
      ? shippingCharges.inside
      : shippingCharges.outside;
  const subtotal = Number(totalPrice);
  const orderTotal = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (items.length === 0) {
      setError('Your cart is empty');
      setIsSubmitting(false);
      return;
    }

    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
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
        clearCart();
        // Redirect to a success page or show a success message
        // For now, let's redirect to a simple success page or home with a query param
        router.push(
          `/checkout/success?orderNumber=${result.orderNumber}&amount=${orderTotal}`,
        );
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Shipping Details</h2>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="017..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium">
            Address <span className="text-destructive">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="House #, Road #, Area..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">
            Delivery Location <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition has-checked:border-foreground has-checked:bg-muted/30">
              <input
                type="radio"
                name="delivery"
                value="inside"
                checked={deliveryLocation === 'inside'}
                onChange={(e) =>
                  setDeliveryLocation(e.target.value as 'inside')
                }
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="font-medium">Inside Dhaka</p>
                <p className="text-sm text-muted-foreground">
                  Delivery Charge: ৳{shippingCharges.inside}
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition has-checked:border-foreground has-checked:bg-muted/30">
              <input
                type="radio"
                name="delivery"
                value="outside"
                checked={deliveryLocation === 'outside'}
                onChange={(e) =>
                  setDeliveryLocation(e.target.value as 'outside')
                }
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="font-medium">Outside Dhaka</p>
                <p className="text-sm text-muted-foreground">
                  Delivery Charge: ৳{shippingCharges.outside}
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Order Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Any special instructions..."
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
}

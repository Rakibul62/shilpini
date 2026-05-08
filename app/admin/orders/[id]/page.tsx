import { getOrderById } from '@/lib/actions/orders';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { OrderStatusSelector } from '@/components/admin/order-status-selector';
import { PaymentStatusSelector } from '@/components/admin/payment-status-selector';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DeleteOrderButton } from '@/app/admin/orders/[id]/delete-order-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatPrice(value: number | string) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `৳ ${numValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function parseSelectedOptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value as Record<string, unknown>).reduce(
    (acc, [key, val]) => {
      if (typeof val === 'string' && val.trim()) {
        acc[key] = val;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const { data: order, error } = await getOrderById(id);

  if (error || !order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <DeleteOrderButton orderId={order.id} orderNumber={order.orderNumber} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                (() => {
                  const selectedOptions = parseSelectedOptions(item.selectedOptions);
                  const hasVariant = Object.keys(selectedOptions).length > 0;
                  return (
                <div key={item.id} className="flex gap-4 rounded-lg border p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.productName}</h3>
                    {item.product && (
                      <Link
                        href={`/admin/products/${item.product.id}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        View Product
                      </Link>
                    )}
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Qty: {item.quantity}</span>
                      <span>×</span>
                      <span>{formatPrice(Number(item.price))}</span>
                    </div>
                    {hasVariant && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(selectedOptions).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(Number(order.subtotal))}</span>
                </div>
                {Number(order.shippingCost) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(Number(order.shippingCost))}</span>
                  </div>
                )}
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-red-600">
                      -{formatPrice(Number(order.discount))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-2 text-lg font-semibold">Order Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Customer</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Status</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  Order Status
                </label>
                <OrderStatusSelector
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  Payment Status
                </label>
                <PaymentStatusSelector
                  orderId={order.id}
                  currentStatus={order.paymentStatus}
                />
              </div>
              {order.paymentMethod && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="mt-1 font-medium">{order.paymentMethod}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

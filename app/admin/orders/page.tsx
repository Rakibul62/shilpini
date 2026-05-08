import Link from 'next/link';
import { Eye } from 'lucide-react';
import { getOrders } from '@/lib/actions/orders';
import { OrderStatusBadge } from '@/components/admin/order-status-badge';
import { PaymentStatusBadge } from '@/components/admin/payment-status-badge';

export const dynamic = 'force-dynamic';

function formatPrice(value: number | string) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `৳ ${numValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function hasVariantSnapshot(selectedOptions: unknown) {
  return Boolean(
    selectedOptions &&
      typeof selectedOptions === 'object' &&
      Object.keys(selectedOptions as Record<string, unknown>).length > 0,
  );
}

export default async function OrdersPage() {
  const { data: orders, error } = await getOrders();

  if (error || !orders) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load orders.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Manage customer orders and track status
          </p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden rounded-2xl border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                (() => {
                  const variantLineCount = order.items.filter((item) =>
                    hasVariantSnapshot(item.selectedOptions),
                  ).length;
                  return (
                <tr key={order.id} className="transition hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.customerPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <span className="text-sm">{order._count?.items || 0} items</span>
                      {variantLineCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {variantLineCount} variant lines
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">
                      {formatPrice(Number(order.total))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-medium text-foreground/80 transition hover:text-foreground hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Orders will appear here when customers place them
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          (() => {
            const variantLineCount = order.items.filter((item) =>
              hasVariantSnapshot(item.selectedOptions),
            ).length;
            return (
          <div
            key={order.id}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-semibold">
                  {order.orderNumber}
                </p>
                <p className="text-sm font-medium">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customerPhone}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatPrice(Number(order.total))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order._count?.items || 0} items
                </p>
                {variantLineCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {variantLineCount} variant lines
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-3">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <Link
                href={`/admin/orders/${order.id}`}
                className="inline-flex items-center gap-1 font-medium text-foreground/80 transition hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Link>
            </div>
          </div>
            );
          })()
        ))}

        {orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Orders will appear here when customers place them
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

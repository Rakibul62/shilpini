import { Container } from '@/components/container';
import { SuccessView } from '@/components/checkout/success-view';
import { getOrderByOrderNumber } from '@/lib/actions/orders';

export const metadata = {
  title: 'Order Placed - Shilpini',
  description: 'Thank you for your order',
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber: string; amount?: string }>;
}) {
  const { orderNumber, amount } = await searchParams;

  let totalAmount: number | undefined = amount ? parseFloat(amount) : undefined;
  let orderItems: Array<{ id: string; quantity: number; item_price: number }> | undefined = undefined;

  if (orderNumber) {
    const res = await getOrderByOrderNumber(orderNumber);
    if (res.success && res.data) {
      totalAmount = res.data.total;
      orderItems = res.data.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      }));
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 py-10">
      <Container>
        <SuccessView
          orderNumber={orderNumber}
          totalAmount={totalAmount}
          items={orderItems}
        />
      </Container>
    </main>
  );
}


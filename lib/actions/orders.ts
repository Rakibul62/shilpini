'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

// Initialize Resend lazily or inside the action to ensure environment variables are loaded
// in production/build mode.

interface OrderItemInput {
  productId?: string;
  quantity: number;
  price: number;
  productName: string;
  productImage?: string | null;
  selectedOptions?: Record<string, string>;
}

interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  address: string;
  notes?: string;
  items: OrderItemInput[];
  total: number;
  shippingCost: number;
}

// Public: Create new order (from checkout)
export async function createOrder(data: CreateOrderInput) {
  try {
    const {
      customerName,
      customerPhone,
      address,
      notes,
      items,
      total,
      shippingCost,
    } = data;

    if (!items || items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const uniqueProductIds = Array.from(
      new Set(items.map((item) => item.productId).filter(Boolean)),
    ) as string[];
    const validProductIdSet =
      uniqueProductIds.length > 0
        ? new Set(
            (
              await prisma.product.findMany({
                where: { id: { in: uniqueProductIds } },
                select: { id: true },
              })
            ).map((p) => p.id),
          )
        : new Set<string>();

    // Generate sequential order number (SHILP-1001, SHILP-1002, etc.)
    const counter = await prisma.counter.upsert({
      where: { name: 'order_number' },
      update: { count: { increment: 1 } },
      create: { name: 'order_number', count: 1001 },
    });

    const orderNumber = `SHILP${counter.count}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: customerName,
        customerPhone: customerPhone,
        address: address,
        notes: notes,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        subtotal: total - shippingCost,
        shippingCost: shippingCost,
        total: total,
        items: {
          create: items.map((item) => ({
            productId:
              item.productId && validProductIdSet.has(item.productId)
                ? item.productId
                : null,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            price: item.price,
            selectedOptions: item.selectedOptions || {}, // Store as JSON
          })),
        },
      },
    });

    // Send email notification
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const sendMail = process.env.SENDMAIL;

      if (!apiKey) {
        throw new Error('RESEND_API_KEY is not defined');
      }

      if (!sendMail) {
        throw new Error('SENDMAIL is not defined');
      }

      const resend = new Resend(apiKey);

      await resend.emails.send({
        from: 'Shilpini <onboarding@resend.dev>',
        to: sendMail,
        subject: `New Order Received: ${orderNumber}`,
        html: `
          <h1>New Order Details</h1>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Customer Name:</strong> ${customerName}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Notes:</strong> ${notes || 'N/A'}</p>
          
          <h2>Items</h2>
          <ul>
            ${items
              .map(
                (item) => `
              <li>
                ${item.productName} x ${item.quantity} - ৳${item.price * item.quantity}
                ${
                  item.selectedOptions
                    ? `<br/><small>${Object.entries(item.selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}</small>`
                    : ''
                }
              </li>
            `,
              )
              .join('')}
          </ul>
          
          <p><strong>Subtotal:</strong> ৳${total - shippingCost}</p>
          <p><strong>Shipping:</strong> ৳${shippingCost}</p>
          <p><strong>Total:</strong> ৳${total}</p>
        `,
      });
    } catch (emailError) {
      console.error('Error sending order notification email:', emailError);
      // We don't fail the order if the email fails, but we log it
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

// Admin: Get all orders with optional search
export async function getOrders(query?: string) {
  try {
    const orders = await prisma.order.findMany({
      where: query
        ? {
            OR: [
              { orderNumber: { contains: query, mode: 'insensitive' } },
              { customerName: { contains: query, mode: 'insensitive' } },
              { customerPhone: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            id: true,
            selectedOptions: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });
    return { success: true, data: orders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }
}

// Admin: Get single order by ID with all items
export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: 'Failed to fetch order' };
  }
}

// Admin: Update order status
export async function updateOrderStatus(
  id: string,
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURNED',
) {
  try {
    await prisma.order.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}

// Admin: Update payment status
export async function updatePaymentStatus(
  id: string,
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED',
) {
  try {
    await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });

    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error: 'Failed to update payment status' };
  }
}

// Admin: Delete order
export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({
      where: { id },
    });

    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: 'Failed to delete order' };
  }
}

// Public: Get single order by Order Number with items (used for checkout success & tracking)
export async function getOrderByOrderNumber(orderNumber: string) {
  try {
    if (!orderNumber) {
      return { success: false, error: 'Order number is required' };
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        items: order.items.map((item) => ({
          id: item.productId || item.id,
          productName: item.productName,
          quantity: item.quantity,
          price: Number(item.price),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching order by order number:', error);
    return { success: false, error: 'Failed to fetch order' };
  }
}


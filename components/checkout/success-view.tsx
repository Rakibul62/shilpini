/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface SuccessViewProps {
  orderNumber: string;
}

export function SuccessView({ orderNumber }: SuccessViewProps) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Track Purchase
    // We don't have the order details here (total, items) without fetching.
    // For now, track the event with order ID.
    // Ideally, we should pass order details to this component or fetch them.
    // Since we just redirected, maybe we can't easily get value here without a fetch.
    // OPTION: We could pass value in URL params (less secure) or just track generic purchase.
    // Better: The user just came from checkout, but state is cleared.
    // Let's track generic Purchase with order ID for now.
    // To get value, we'd need to fetch the order by ID.
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'Purchase', {
        order_id: orderNumber,
        currency: 'BDT',
      });
    }
  }, [orderNumber]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.5,
        }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 ring-8 ring-green-50 dark:ring-green-900/10"
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Check
            className="h-12 w-12 text-green-600 dark:text-green-400"
            strokeWidth={3}
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Order Placed Successfully!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Thank you for your purchase.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Order Number
          </span>
          <span className="text-2xl font-mono font-bold tracking-wider text-foreground">
            {orderNumber}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-10 flex flex-col gap-4 sm:flex-row"
      >
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-base font-medium text-background shadow-lg transition-all hover:bg-foreground/90 hover:shadow-xl active:scale-[0.98]"
        >
          Continue Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}

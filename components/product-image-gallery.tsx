"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const displayImages = images.length > 0 ? images : ["/window.svg"];

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="relative aspect-[1.08/1] w-full overflow-hidden rounded-2xl border bg-muted transition hover:opacity-95"
        >
          <Image
            src={displayImages[selectedIndex]}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </button>

      {/* Thumbnail Grid */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:gap-4">
          {displayImages.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-[1.08/1] overflow-hidden rounded-lg border-2 transition ${
                index === selectedIndex
                  ? "border-foreground"
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 p-4"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute right-4 top-4 z-101 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Fullscreen Image */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={displayImages[selectedIndex]}
                alt={`${productName} - Fullscreen`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>

            {/* Thumbnail Navigation in Fullscreen */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-101 flex max-w-md -translate-x-1/2 gap-2 overflow-x-auto rounded-full bg-black/50 p-2 backdrop-blur scrollbar-hide">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(index);
                    }}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      index === selectedIndex
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

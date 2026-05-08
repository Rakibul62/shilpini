/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ProductCollection } from '../../generated/prisma/client';
import type { ProductFormData } from '../../lib/actions/admin-products';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../lib/actions/admin-products';
import { slugify } from '../../lib/utils';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  categories: Category[];
  mode: 'create' | 'edit';
  productId?: string;
}

type ProductVariantInput = NonNullable<ProductFormData['variants']>[number];

const collectionOptions = [
  { value: 'NEW_ARRIVAL', label: 'New Arrival' },
  { value: 'BEST_SELL', label: 'Best Seller' },
  { value: 'TRENDING', label: 'Trending' },
];

export function ProductForm({
  initialData,
  categories,
  mode,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    comparePrice: initialData?.comparePrice || '',
    sku: initialData?.sku || '',
    stock: initialData?.stock || 0,
    categoryId: initialData?.categoryId || '',
    tags: initialData?.tags || [],
    featuredImage: initialData?.featuredImage || '',
    images: initialData?.images || [],
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    collections: initialData?.collections || [],
    order: initialData?.order || 0,
    options: initialData?.options || [],
    variants: initialData?.variants || [],
  });

  const [newOptionName, setNewOptionName] = useState('');

  const addOption = () => {
    if (
      newOptionName.trim() &&
      !formData.options?.some((o) => o.name === newOptionName.trim())
    ) {
      setFormData({
        ...formData,
        options: [
          ...(formData.options || []),
          { name: newOptionName.trim(), values: [] },
        ],
      });
      setNewOptionName('');
    }
  };

  const removeOption = (index: number) => {
    const optionToRemove = formData.options?.[index]?.name ?? '';
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    setFormData({
      ...formData,
      options: newOptions,
      variants: (formData.variants || []).map((variant) => ({
        ...variant,
        selections: variant.selections.filter(
          (selection) => selection.optionName !== optionToRemove,
        ),
      })),
    });
  };

  const addOptionValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return;

    const newOptions = [...(formData.options || [])];
    const option = newOptions[optionIndex];

    if (!option.values.includes(value.trim())) {
      option.values.push(value.trim());
      setFormData({ ...formData, options: newOptions });
    }
  };

  const removeOptionValue = (optionIndex: number, valueToRemove: string) => {
    const newOptions = [...(formData.options || [])];
    const option = newOptions[optionIndex];
    option.values = option.values.filter((v) => v !== valueToRemove);
    setFormData({ ...formData, options: newOptions });
  };

  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [uploadingVariantGalleryIndex, setUploadingVariantGalleryIndex] = useState<number | null>(null);
  const [variantGalleryInputs, setVariantGalleryInputs] = useState<Record<number, string>>({});
  const [isSlugManual, setIsSlugManual] = useState(mode === 'edit');

  const normalizeSkuPart = (value: string) =>
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const getVariantValuesInOptionOrder = (
    selections: ProductVariantInput['selections'],
  ) =>
    (formData.options || []).map((option) => {
      const found = selections.find((selection) => selection.optionName === option.name);
      return found?.value?.trim() || '';
    });

  const buildVariantAutoFields = (
    selections: ProductVariantInput['selections'],
  ) => {
    const orderedValues = getVariantValuesInOptionOrder(selections);
    const hasAllOptionsSelected =
      (formData.options || []).length > 0 && orderedValues.every(Boolean);

    if (!hasAllOptionsSelected) {
      return { title: '', sku: '' };
    }

    const title = `${formData.name} ${orderedValues.join(' ')}`.trim();
    const sku = [formData.sku || formData.slug || formData.name, ...orderedValues]
      .map(normalizeSkuPart)
      .filter(Boolean)
      .join('-');

    return { title, sku };
  };

  const hasIncompleteVariantSelections = (variants: ProductVariantInput[]) => {
    const requiredOptions = formData.options || [];
    if (requiredOptions.length === 0) return false;

    return variants.some((variant) =>
      requiredOptions.some((option) => {
        const selected = variant.selections.find(
          (selection) => selection.optionName === option.name,
        )?.value;
        return !selected?.trim();
      }),
    );
  };

  const handleNameChange = (name: string) => {
    const newFormData = { ...formData, name };
    if (!isSlugManual) {
      newFormData.slug = slugify(name);
    }
    newFormData.variants = (newFormData.variants || []).map((variant) => {
      const auto = buildVariantAutoFields(variant.selections);
      return { ...variant, title: auto.title, sku: auto.sku };
    });
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const variants = formData.variants || [];
      if (hasIncompleteVariantSelections(variants)) {
        throw new Error('Please select all option values for every variant.');
      }

      if (mode === 'create') {
        await createProduct(formData);
      } else if (mode === 'edit' && productId) {
        await updateProduct(productId, formData);
      }
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !productId) return;

    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteProduct(productId);
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const uploadImage = async (file: File, type: 'featured' | 'additional') => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    if (type === 'featured') {
      setIsUploadingFeatured(true);
    } else {
      setIsUploadingAdditional(true);
    }

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (type === 'featured') {
        setFormData({ ...formData, featuredImage: data.url });
      } else {
        setFormData({
          ...formData,
          images: [...formData.images, data.url],
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      if (type === 'featured') {
        setIsUploadingFeatured(false);
      } else {
        setIsUploadingAdditional(false);
      }
    }
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      });
      setImageInput('');
    }
  };

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img !== image),
    });
  };

  const toggleCollection = (collection: ProductCollection) => {
    setFormData({
      ...formData,
      collections: formData.collections.includes(collection)
        ? formData.collections.filter((c) => c !== collection)
        : [...formData.collections, collection],
    });
  };

  const updateOptionName = (index: number, newName: string) => {
    const newOptions = [...(formData.options || [])];
    const oldName = newOptions[index].name;
    newOptions[index].name = newName;
    setFormData({
      ...formData,
      options: newOptions,
      variants: (formData.variants || []).map((variant) => ({
        ...variant,
        selections: variant.selections.map((selection) =>
          selection.optionName === oldName
            ? { ...selection, optionName: newName }
            : selection,
        ),
      })),
    });
  };

  const getDefaultSelections = (): ProductVariantInput['selections'] =>
    (formData.options || []).map((option) => ({
      optionName: option.name,
      value: option.values[0] || '',
    }));

  const generateOptionCombinations = (
    options: NonNullable<ProductFormData['options']>,
  ): string[][] => {
    if (options.length === 0) return [];

    const matrix = options.map((option) => option.values);
    let combinations: string[][] = [[]];

    for (const values of matrix) {
      const next: string[][] = [];
      for (const base of combinations) {
        for (const value of values) {
          next.push([...base, value]);
        }
      }
      combinations = next;
    }

    return combinations;
  };

  const generateVariantsFromOptions = () => {
    const options = formData.options || [];
    if (options.length === 0) {
      setError('Add product options first to generate variants.');
      return;
    }

    const optionsWithoutValues = options.filter((option) => option.values.length === 0);
    if (optionsWithoutValues.length > 0) {
      setError(
        `Please add values for: ${optionsWithoutValues
          .map((option) => option.name)
          .join(', ')}`,
      );
      return;
    }

    if (
      (formData.variants || []).length > 0 &&
      !window.confirm('Replace existing variants with generated option matrix?')
    ) {
      return;
    }

    const combinations = generateOptionCombinations(options);
    const variants: ProductVariantInput[] = combinations.map((combo, index) => {
      const selections = options.map((option, optionIndex) => ({
        optionName: option.name,
        value: combo[optionIndex],
      }));
      const auto = buildVariantAutoFields(selections);
      return {
        title: auto.title,
        sku: auto.sku,
        price: '', // empty means inherit base product price
        comparePrice: '',
        stock: formData.stock || 0,
        image: '',
        images: [],
        isActive: true,
        order: index + 1,
        selections,
      };
    });

    setError('');
    setFormData({
      ...formData,
      variants,
    });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...(formData.variants || []),
        {
          title: '',
          sku: '',
          price: '',
          comparePrice: '',
          stock: 0,
          image: '',
          images: [],
          isActive: true,
          order: (formData.variants?.length || 0) + 1,
          selections: getDefaultSelections(),
        },
      ],
    });
  };

  const removeVariant = (variantIndex: number) => {
    setFormData({
      ...formData,
      variants: (formData.variants || []).filter((_, index) => index !== variantIndex),
    });
  };

  const updateVariant = (
    variantIndex: number,
    patch: Partial<ProductVariantInput>,
  ) => {
    const nextVariants = [...(formData.variants || [])];
    nextVariants[variantIndex] = { ...nextVariants[variantIndex], ...patch };
    setFormData({ ...formData, variants: nextVariants });
  };

  const upsertVariantSelection = (
    variantIndex: number,
    optionName: string,
    value: string,
  ) => {
    const nextVariants = [...(formData.variants || [])];
    const variant = nextVariants[variantIndex];
    const selectionIndex = variant.selections.findIndex(
      (selection) => selection.optionName === optionName,
    );

    if (selectionIndex >= 0) {
      variant.selections[selectionIndex] = { optionName, value };
    } else {
      variant.selections.push({ optionName, value });
    }

    const auto = buildVariantAutoFields(variant.selections);
    variant.title = auto.title;
    variant.sku = auto.sku;

    setFormData({ ...formData, variants: nextVariants });
  };

  const uploadVariantImage = async (variantIndex: number, file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    setUploadingVariantIndex(variantIndex);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      updateVariant(variantIndex, { image: data.url });
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingVariantIndex(null);
    }
  };

  const uploadVariantGalleryImage = async (variantIndex: number, file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    setUploadingVariantGalleryIndex(variantIndex);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const current = (formData.variants || [])[variantIndex]?.images || [];
      if (!current.includes(data.url)) {
        updateVariant(variantIndex, { images: [...current, data.url] });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingVariantGalleryIndex(null);
    }
  };

  const addVariantGalleryImageByUrl = (variantIndex: number) => {
    const url = (variantGalleryInputs[variantIndex] || '').trim();
    if (!url) return;

    const current = (formData.variants || [])[variantIndex]?.images || [];
    if (current.includes(url)) return;

    updateVariant(variantIndex, { images: [...current, url] });
    setVariantGalleryInputs((prev) => ({ ...prev, [variantIndex]: '' }));
  };

  const removeVariantGalleryImage = (variantIndex: number, imageToRemove: string) => {
    const current = (formData.variants || [])[variantIndex]?.images || [];
    updateVariant(variantIndex, {
      images: current.filter((img) => img !== imageToRemove),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Product Slug *</label>
            <button
              type="button"
              onClick={() => setIsSlugManual(!isSlugManual)}
              className="text-xs text-primary hover:underline"
            >
              {isSlugManual ? 'Switch to Auto' : 'Edit Manually'}
            </button>
          </div>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: slugify(e.target.value) })
            }
            required
            disabled={!isSlugManual}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The URL friendly name for the product.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Pricing & Stock</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Price *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Compare Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.comparePrice}
              onChange={(e) =>
                setFormData({ ...formData, comparePrice: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stock *</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: parseInt(e.target.value) || 0,
                })
              }
              required
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Display Order
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lower numbers appear first
          </p>
        </div>
      </div>

      {/* Product Options */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Product Options</h2>
        <p className="text-sm text-muted-foreground">
          Add options like Size or Color.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            placeholder="Option Name (e.g. Size, Color)"
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addOption}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Add Option
          </button>
        </div>

        {formData.options &&
          formData.options.map((option, index) => (
            <div key={index} className="rounded-lg border bg-background p-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOptionName(index, e.target.value)}
                  className="font-medium bg-transparent border-b border-transparent hover:border-border focus:border-foreground focus:outline-none px-1 py-0.5 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-destructive hover:text-destructive/80 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                {/* Option Values Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Add value for ${option.name} (e.g. S, Red)`}
                    className="flex-1 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOptionValue(index, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>

                {/* Values List */}
                <div className="flex flex-wrap gap-2">
                  {option.values.map((val, vIndex) => (
                    <span
                      key={vIndex}
                      className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => removeOptionValue(index, val)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Variants */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Variants</h2>
            <p className="text-sm text-muted-foreground">
              Set separate stock, price, and image for each variant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateVariantsFromOptions}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Generate All Variants
            </button>
            <button
              type="button"
              onClick={addVariant}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Add Variant
            </button>
          </div>
        </div>

        {(formData.variants || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No variants yet. Add one to override base stock/price/image.
          </p>
        ) : (
          <div className="space-y-4">
            {(formData.variants || []).map((variant, variantIndex) => (
              <div key={variantIndex} className="rounded-lg border bg-background p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Variant #{variantIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>

                {(formData.options || []).length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(formData.options || []).map((option) => {
                      const matchedSelection = variant.selections.find(
                        (selection) => selection.optionName === option.name,
                      );
                      return (
                        <div key={option.name}>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            {option.name}
                          </label>
                          <select
                            value={matchedSelection?.value || ''}
                            onChange={(e) =>
                              upsertVariantSelection(
                                variantIndex,
                                option.name,
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select {option.name}</option>
                            {option.values.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Variant Name (Auto)
                    </label>
                    <input
                      type="text"
                      value={variant.title || ''}
                      readOnly
                      disabled
                      className="w-full rounded-lg border bg-muted/60 px-4 py-2 text-sm text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Variant SKU (Auto)
                    </label>
                    <input
                      type="text"
                      value={variant.sku || ''}
                      readOnly
                      disabled
                      className="w-full rounded-lg border bg-muted/60 px-4 py-2 text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    {(() => {
                      const isInheritingBasePrice = !variant.price;
                      return (
                        <>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.price || ''}
                      onChange={(e) => updateVariant(variantIndex, { price: e.target.value })}
                      disabled={isInheritingBasePrice}
                      placeholder="Price"
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm disabled:bg-muted/60 disabled:text-muted-foreground"
                    />
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isInheritingBasePrice}
                        onChange={(e) =>
                          updateVariant(variantIndex, {
                            price: e.target.checked ? '' : formData.price || '',
                            comparePrice: e.target.checked
                              ? ''
                              : formData.comparePrice || '',
                          })
                        }
                        className="h-3.5 w-3.5 rounded"
                      />
                      Inherit base product price & compare price
                    </label>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Compare Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.comparePrice || ''}
                      onChange={(e) =>
                        updateVariant(variantIndex, { comparePrice: e.target.value })
                      }
                      disabled={!variant.price}
                      placeholder="Compare price"
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm disabled:bg-muted/60 disabled:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(variantIndex, { stock: parseInt(e.target.value) || 0 })
                      }
                      placeholder="Stock"
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Order
                    </label>
                    <input
                      type="number"
                      value={variant.order}
                      onChange={(e) =>
                        updateVariant(variantIndex, { order: parseInt(e.target.value) || 0 })
                      }
                      placeholder="Order"
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Variant Image URL
                    </label>
                    {variant.image && (
                      <div className="relative mb-3 aspect-3/4 w-full max-w-[180px] overflow-hidden rounded-lg border bg-muted">
                        <Image
                          src={variant.image}
                          alt={`Variant ${variantIndex + 1} preview`}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                        <button
                          type="button"
                          onClick={() => updateVariant(variantIndex, { image: '' })}
                          className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-white hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <input
                      type="url"
                      value={variant.image || ''}
                      onChange={(e) => updateVariant(variantIndex, { image: e.target.value })}
                      placeholder="Variant image URL"
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadVariantImage(variantIndex, file);
                        }}
                        className="hidden"
                        disabled={uploadingVariantIndex === variantIndex}
                      />
                      {uploadingVariantIndex === variantIndex ? 'Uploading...' : 'Upload'}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(e) =>
                          updateVariant(variantIndex, { isActive: e.target.checked })
                        }
                        className="h-4 w-4 rounded"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Variant Gallery Images
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={variantGalleryInputs[variantIndex] || ''}
                      onChange={(e) =>
                        setVariantGalleryInputs((prev) => ({
                          ...prev,
                          [variantIndex]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addVariantGalleryImageByUrl(variantIndex);
                        }
                      }}
                      placeholder="Add gallery image URL..."
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => addVariantGalleryImageByUrl(variantIndex)}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Add URL
                    </button>
                  </div>

                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadVariantGalleryImage(variantIndex, file);
                      }}
                      className="hidden"
                      disabled={uploadingVariantGalleryIndex === variantIndex}
                    />
                    {uploadingVariantGalleryIndex === variantIndex
                      ? 'Uploading...'
                      : 'Upload Gallery Image'}
                  </label>

                  {(variant.images || []).length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {(variant.images || []).map((galleryImage, galleryIndex) => (
                        <div
                          key={`${galleryImage}-${galleryIndex}`}
                          className="group relative aspect-3/4 overflow-hidden rounded-lg border bg-muted"
                        >
                          <Image
                            src={galleryImage}
                            alt={`Variant gallery image ${galleryIndex + 1}`}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                          <button
                            type="button"
                            onClick={() =>
                              removeVariantGalleryImage(variantIndex, galleryImage)
                            }
                            className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Images</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Featured Image
          </label>
          <div className="space-y-3">
            {/* Preview */}
            {formData.featuredImage && (
              <div className="relative aspect-3/4 w-full max-w-xs overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={formData.featuredImage}
                  alt="Featured image preview"
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, featuredImage: '' })
                  }
                  className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-white hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(e) =>
                  setFormData({ ...formData, featuredImage: e.target.value })
                }
                placeholder="Or paste image URL..."
                className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, 'featured');
                  }}
                  className="hidden"
                  disabled={isUploadingFeatured}
                />
                {isUploadingFeatured ? 'Uploading...' : '📤 Upload Image'}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Images
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addImage())
                }
                placeholder="Or paste image URL..."
                className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addImage}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Add URL
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted w-fit">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, 'additional');
                }}
                className="hidden"
                disabled={isUploadingAdditional}
              />
              {isUploadingAdditional ? 'Uploading...' : '📤 Upload Image'}
            </label>
          </div>

          {formData.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {formData.images.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-3/4 overflow-hidden rounded-lg border bg-muted"
                >
                  <Image
                    src={image}
                    alt={`Additional image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                  <button
                    type="button"
                    onClick={() => removeImage(image)}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Tags</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addTag())
            }
            placeholder="Add a tag..."
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Add
          </button>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Collections */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Collections</h2>

        <div className="space-y-2">
          {collectionOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={formData.collections.includes(
                  option.value as ProductCollection,
                )}
                onChange={() =>
                  toggleCollection(option.value as ProductCollection)
                }
                className="h-4 w-4 rounded"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded"
            />
            Active (visible on site)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData({ ...formData, isFeatured: e.target.checked })
              }
              className="h-4 w-4 rounded"
            />
            Featured (show on homepage)
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50 sm:flex-none"
          >
            {isLoading
              ? 'Saving...'
              : mode === 'edit'
                ? 'Update Product'
                : 'Create Product'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className="flex-1 rounded-lg border px-6 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50 sm:flex-none"
          >
            Cancel
          </button>
        </div>

        {mode === 'edit' && productId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="rounded-lg border border-destructive bg-destructive/10 px-6 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
          >
            Delete Product
          </button>
        )}
      </div>
    </form>
  );
}

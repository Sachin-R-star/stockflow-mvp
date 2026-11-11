"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Trash2,
  X,
  Loader2,
  ArrowUpDown,
  DollarSign,
  Layers,
  Filter,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  costPrice: number | null;
  sellingPrice: number | null;
  lowStockThreshold: number | null;
  effectiveThreshold: number;
  isLowStock: boolean;
  lastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserSession {
  email: string;
  organizationName: string;
  organizationId: string;
}

export default function ProductsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low_stock">("all");
  const [defaultThreshold, setDefaultThreshold] = useState<number>(5);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    quantity: "0",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "",
  });
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustNote, setAdjustNote] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) window.location.href = "/login";
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setSession(data.user);
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL("/api/products", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      if (stockFilter === "low_stock") url.searchParams.set("filter", "low_stock");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setDefaultThreshold(data.defaultLowStockThreshold || 5);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      quantity: "0",
      costPrice: "",
      sellingPrice: "",
      lowStockThreshold: String(defaultThreshold),
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description || "",
      quantity: String(p.quantity),
      costPrice: p.costPrice !== null ? String(p.costPrice) : "",
      sellingPrice: p.sellingPrice !== null ? String(p.sellingPrice) : "",
      lowStockThreshold: p.lowStockThreshold !== null ? String(p.lowStockThreshold) : "",
    });
    setFormError(null);
  };

  // Submit product create/update
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setIsAddModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingProduct(null);
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Stock Adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/products/${adjustingProduct.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta: adjustDelta,
          note: adjustNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Stock adjustment failed");
      }

      setAdjustingProduct(null);
      setAdjustNote("");
      fetchProducts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Adjustment failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Products & Inventory
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Manage your catalog, SKUs, inventory counts, and price points.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Product
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by SKU or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <button
              onClick={() => setStockFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                stockFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setStockFilter("low_stock")}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                stockFilter === "low_stock"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Low Stock Only
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading inventory items...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No products found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || stockFilter !== "all"
                  ? "No inventory matches your current filter or search criteria."
                  : "You haven't added any products yet. Get started by creating your first product."}
              </p>
              {!searchQuery && stockFilter === "all" && (
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Product Name</th>
                    <th scope="col" className="px-6 py-3.5">SKU</th>
                    <th scope="col" className="px-6 py-3.5">Quantity on Hand</th>
                    <th scope="col" className="px-6 py-3.5">Stock Status</th>
                    <th scope="col" className="px-6 py-3.5">Prices (Cost / Sell)</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {products.map((p) => {
                    const threshold = p.lowStockThreshold ?? defaultThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                              {p.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {p.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 text-base">
                              {p.quantity}
                            </span>
                            <span className="text-xs text-slate-400">units</span>
                            <button
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjustDelta(1);
                                setAdjustNote("");
                                setFormError(null);
                              }}
                              title="Quick adjust stock"
                              className="p-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 text-xs transition-colors"
                            >
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-2xs text-slate-400 mt-0.5">
                            Threshold: {threshold} {p.lowStockThreshold === null ? "(org default)" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                              Low Stock ({p.quantity}/{threshold})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <div>
                              <span className="text-slate-400">Sell: </span>
                              <span className="font-medium text-slate-900">
                                {p.sellingPrice !== null ? `$${p.sellingPrice.toFixed(2)}` : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Cost: </span>
                              <span className="text-slate-600">
                                {p.costPrice !== null ? `$${p.costPrice.toFixed(2)}` : "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit product"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              title="Delete product"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Add or Edit Product */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Enter product details and inventory thresholds for your organization.
            </p>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Wireless Ergonomic Mouse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU (Stock Keeping Unit) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MOU-WL-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="w-full font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Quantity on Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Default: ${defaultThreshold}`}
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="12.50"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.99"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short item details or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center"
                >
                  {isSubmitting && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />}
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Adjust Stock (FR-5) */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setAdjustingProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Adjust Stock: {adjustingProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current stock: <strong className="text-slate-800">{adjustingProduct.quantity} units</strong> (SKU: {adjustingProduct.sku})
            </p>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Delta (+/-)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((d) => d - 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    required
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                    className="w-full text-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((d) => d + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-sm"
                  >
                    +
                  </button>
                </div>
                <p className="text-2xs text-slate-400 mt-1 text-center">
                  Resulting quantity: {adjustingProduct.quantity + adjustDelta}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment, returned unit"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adjustDelta === 0}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center"
                >
                  {isSubmitting && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete <strong>{deletingProduct.name}</strong> ({deletingProduct.sku})? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg flex items-center"
              >
                {isSubmitting && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

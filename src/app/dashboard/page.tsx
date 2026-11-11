"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Package,
  Layers,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Plus,
  CheckCircle2,
  TrendingDown,
  Loader2,
  Settings,
  ArrowUpDown,
  Building,
} from "lucide-react";

interface DashboardData {
  organization: {
    name: string;
    defaultLowStockThreshold: number;
  };
  summary: {
    totalProducts: number;
    totalQuantity: number;
    lowStockCount: number;
    totalCostValue: number;
    totalRetailValue: number;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    effectiveThreshold: number;
    costPrice: number | null;
    sellingPrice: number | null;
    lastUpdatedBy: string | null;
    updatedAt: string;
  }>;
  recentItems: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    effectiveThreshold: number;
    isLowStock: boolean;
    sellingPrice: number | null;
    updatedAt: string;
  }>;
}

interface UserSession {
  email: string;
  organizationName: string;
  organizationId: string;
}

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Restock State
  const [restockProduct, setRestockProduct] = useState<{ id: string; name: string; sku: string; quantity: number } | null>(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [isRestocking, setIsRestocking] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) window.location.href = "/login";
        return res.json();
      })
      .then((json) => {
        if (json.user) setSession(json.user);
      })
      .catch(() => {
        window.location.href = "/login";
      });

    fetchDashboard();
  }, []);

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    setIsRestocking(true);

    try {
      const res = await fetch(`/api/products/${restockProduct.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta: restockAmount,
          note: "Quick restock from dashboard",
        }),
      });

      if (res.ok) {
        setRestockProduct(null);
        fetchDashboard();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to adjust stock");
      }
    } catch (err) {
      console.error("Restock failed:", err);
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Tenant Dashboard
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center">
                <Building className="h-3 w-3 mr-1 text-slate-400" />
                {session?.organizationName || "Loading..."}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Inventory Overview
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time stock levels, low-inventory alerts, and catalog valuation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Product
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="animate-spin h-9 w-9 text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading dashboard overview...</p>
          </div>
        ) : !data ? (
          <div className="py-24 text-center">
            <p className="text-slate-500">Failed to load inventory summary.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Products */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Products
                  </span>
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-slate-900">
                    {data.summary.totalProducts}
                  </div>
                  <div className="mt-1 flex items-center text-xs text-slate-500">
                    <Link
                      href="/products"
                      className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center"
                    >
                      View catalog &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Units On Hand */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Units on Hand
                  </span>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-slate-900">
                    {data.summary.totalQuantity.toLocaleString()}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Across all SKU inventory
                  </p>
                </div>
              </div>

              {/* Card 3: Low Stock Items */}
              <div
                className={`rounded-xl border p-5 shadow-xs transition-colors ${
                  data.summary.lowStockCount > 0
                    ? "bg-red-50/50 border-red-200 hover:border-red-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      data.summary.lowStockCount > 0 ? "text-red-700" : "text-slate-500"
                    }`}
                  >
                    Low-Stock Items
                  </span>
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                      data.summary.lowStockCount > 0
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {data.summary.lowStockCount > 0 ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div
                    className={`text-3xl font-bold ${
                      data.summary.lowStockCount > 0 ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {data.summary.lowStockCount}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {data.summary.lowStockCount > 0
                      ? "Requires immediate restocking"
                      : "All items properly stocked"}
                  </p>
                </div>
              </div>

              {/* Card 4: Inventory Valuation */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Retail Valuation
                  </span>
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-slate-900">
                    ${data.summary.totalRetailValue.toLocaleString()}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Cost value: ${data.summary.totalCostValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* FR-6 Dedicated Section: Low-Stock Items Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Low-Stock Items
                    </h2>
                    <p className="text-xs text-slate-500">
                      Items where Quantity on Hand &le; Low Stock Threshold (Org default: {data.organization.defaultLowStockThreshold})
                    </p>
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center"
                >
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Adjust default threshold
                </Link>
              </div>

              {data.lowStockItems.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    No low stock items!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    All your inventory products currently have quantities exceeding their respective low-stock alert thresholds.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-wider">
                      <tr>
                        <th scope="col" className="px-6 py-3.5">Product Name</th>
                        <th scope="col" className="px-6 py-3.5">SKU</th>
                        <th scope="col" className="px-6 py-3.5">Quantity on Hand</th>
                        <th scope="col" className="px-6 py-3.5">Low Stock Threshold</th>
                        <th scope="col" className="px-6 py-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.lowStockItems.map((item) => (
                        <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">{item.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
                              {item.quantity} units
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs">
                            {item.effectiveThreshold} units
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setRestockProduct(item);
                                setRestockAmount(10);
                              }}
                              className="inline-flex items-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition-colors border border-indigo-200"
                            >
                              <ArrowUpDown className="h-3 w-3 mr-1" />
                              Quick Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Inventory Additions */}
            {data.recentItems.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Products
                  </h2>
                  <Link
                    href="/products"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center"
                  >
                    View all {data.summary.totalProducts} products
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-wider">
                      <tr>
                        <th scope="col" className="px-6 py-3">Product</th>
                        <th scope="col" className="px-6 py-3">SKU</th>
                        <th scope="col" className="px-6 py-3">Quantity</th>
                        <th scope="col" className="px-6 py-3">Selling Price</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.recentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                            {item.sku}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-900 text-xs">
                            {item.quantity} units
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-700">
                            {item.sellingPrice !== null ? `$${item.sellingPrice.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            {item.isLowStock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Restock Item
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add units to <strong>{restockProduct.name}</strong> ({restockProduct.sku}).
              Current: {restockProduct.quantity} units.
            </p>

            <form onSubmit={handleQuickRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units to Add
                </label>
                <div className="flex items-center space-x-2">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockAmount(amt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                        restockAmount === amt
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)}
                  className="mt-2 w-full text-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRestocking}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center"
                >
                  {isRestocking && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                  Confirm Restock (+{restockAmount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

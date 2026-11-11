"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Settings,
  Building,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

interface OrganizationSettings {
  id: string;
  name: string;
  defaultLowStockThreshold: number;
  totalProducts: number;
  totalUsers: number;
  createdAt: string;
}

interface UserSession {
  email: string;
  organizationName: string;
  organizationId: string;
}

export default function SettingsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [threshold, setThreshold] = useState<string>("5");
  const [orgName, setOrgName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.organization);
        setThreshold(String(data.organization.defaultLowStockThreshold));
        setOrgName(data.organization.name);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const parsedThreshold = parseInt(threshold, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setErrorMessage("Default low stock threshold must be a non-negative integer (0 or greater).");
      return;
    }

    if (!orgName.trim()) {
      setErrorMessage("Organization name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultLowStockThreshold: parsedThreshold,
          name: orgName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccessMessage("Settings successfully saved. All dashboard alerts and product calculations now reflect your updated threshold.");
      if (session) {
        setSession({ ...session, organizationName: orgName.trim() });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-pink-50/30 flex flex-col">
      <Navbar user={session} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Organization Settings
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage global inventory defaults, stock alert rules, and tenant preferences.
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin h-8 w-8 text-rose-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {successMessage && (
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 flex items-start space-x-3 shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800 font-medium">{successMessage}</div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl bg-red-50 p-4 border border-red-200 flex items-start space-x-3 shadow-xs">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSave} className="bg-white/95 backdrop-blur-md rounded-3xl border border-rose-100 shadow-xl shadow-rose-950/5 p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-rose-100">
                <Sliders className="h-5 w-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Global Inventory Rules (FR-7)
                </h2>
              </div>

              <div>
                <label
                  htmlFor="threshold"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Default Low Stock Threshold (units) *
                </label>
                <div className="max-w-xs">
                  <input
                    id="threshold"
                    type="number"
                    min="0"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold shadow-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-start space-x-1.5">
                  <Info className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>
                    When a product does not have its own specific low-stock threshold defined, this default will automatically determine when that product appears as <strong>Low Stock</strong> on the Dashboard. (Default: 5 units).
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-100">
                <label
                  htmlFor="orgName"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Organization / Brand Name
                </label>
                <div className="max-w-md">
                  <input
                    id="orgName"
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-rose-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Global Settings
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Tenant Boundary Diagnostic Card */}
            {settings && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-rose-100 shadow-xl shadow-rose-950/5 p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-rose-100">
                  <Shield className="h-5 w-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Tenant Boundary & Security Scope
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-rose-500/80 font-medium block mb-0.5">Tenant Organization ID</span>
                    <span className="font-mono font-medium text-slate-800">{settings.id}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-rose-500/80 font-medium block mb-0.5">Account Owner</span>
                    <span className="font-medium text-slate-800">{session?.email}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-rose-500/80 font-medium block mb-0.5">Total Products Managed</span>
                    <span className="font-bold text-slate-900 text-sm">{settings.totalProducts}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-rose-500/80 font-medium block mb-0.5">Created At</span>
                    <span className="text-slate-800 font-medium">{new Date(settings.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

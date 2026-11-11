import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Boxes, ArrowRight, ShieldCheck, Zap, Layers } from "lucide-react";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Boxes className="h-9 w-9" />
          </div>
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Phase 1 • 6-Hour MVP
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Stock<span className="text-indigo-600">Flow</span> MVP
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            Lightweight, multi-tenant inventory management system for small sellers and growing teams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          <Link
            href="/signup"
            className="flex items-center justify-center py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors text-sm"
          >
            Create Organization
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center py-3 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-medium border border-slate-200 shadow-sm transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-indigo-600 mb-2" />
            <h2 className="font-semibold text-slate-900 text-sm">Tenant Isolated</h2>
            <p className="text-xs text-slate-500 mt-1">
              Strict per-organization data boundary. No cross-tenant data leaks.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Zap className="h-5 w-5 text-indigo-600 mb-2" />
            <h2 className="font-semibold text-slate-900 text-sm">Instant Stock Tracking</h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time low stock indicators, threshold warnings, and inventory summaries.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Layers className="h-5 w-5 text-indigo-600 mb-2" />
            <h2 className="font-semibold text-slate-900 text-sm">Streamlined CRUD</h2>
            <p className="text-xs text-slate-500 mt-1">
              Effortless product entry, SKU deduplication, and quick stock adjustments.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

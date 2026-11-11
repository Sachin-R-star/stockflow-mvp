import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { Building2, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={{ email: session.email, organizationName: session.organizationName }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome to {session.organizationName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tenant session active: {session.email} (Org ID: {session.organizationId})
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-600 mb-4">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-lg font-semibold text-slate-900">
              Tenant Authentication Verified
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Your organization workspace is isolated and ready. All products and inventory data created will strictly belong to your tenant.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs font-mono text-slate-700">
            <div>User ID: {session.userId}</div>
            <div>Organization: {session.organizationName}</div>
            <div>Organization ID: {session.organizationId}</div>
            <div>Role: {session.role}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

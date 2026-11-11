import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Fetch organization default threshold
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { name: true, defaultLowStockThreshold: true },
    });

    const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

    // Fetch all products for the tenant organization
    const products = await prisma.product.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { updatedAt: "desc" },
    });

    const totalProducts = products.length;
    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    const enrichedProducts = products.map((p) => {
      const threshold = p.lowStockThreshold ?? defaultThreshold;
      const isLowStock = p.quantity <= threshold;

      totalQuantity += p.quantity;
      if (p.costPrice !== null) totalCostValue += p.costPrice * p.quantity;
      if (p.sellingPrice !== null) totalRetailValue += p.sellingPrice * p.quantity;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        description: p.description,
        quantity: p.quantity,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        lowStockThreshold: p.lowStockThreshold,
        effectiveThreshold: threshold,
        isLowStock,
        lastUpdatedBy: p.lastUpdatedBy,
        updatedAt: p.updatedAt,
      };
    });

    const lowStockItems = enrichedProducts.filter((p) => p.isLowStock);
    const recentItems = enrichedProducts.slice(0, 5);

    return NextResponse.json({
      organization: {
        name: org?.name || session.organizationName,
        defaultLowStockThreshold: defaultThreshold,
      },
      summary: {
        totalProducts,
        totalQuantity,
        lowStockCount: lowStockItems.length,
        totalCostValue: Number(totalCostValue.toFixed(2)),
        totalRetailValue: Number(totalRetailValue.toFixed(2)),
      },
      lowStockItems,
      recentItems,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve dashboard data" },
      { status: 500 }
    );
  }
}

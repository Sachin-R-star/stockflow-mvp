import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "all"; // all | low_stock

    // Fetch organization settings for default low stock threshold
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { defaultLowStockThreshold: true },
    });

    const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

    // Build query conditions
    const whereCondition: any = {
      organizationId: session.organizationId,
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    const enrichedProducts = products.map((product) => {
      const threshold = product.lowStockThreshold ?? defaultThreshold;
      const isLowStock = product.quantity <= threshold;
      return {
        ...product,
        effectiveThreshold: threshold,
        isLowStock,
      };
    });

    const filtered =
      filter === "low_stock"
        ? enrichedProducts.filter((p) => p.isLowStock)
        : enrichedProducts;

    return NextResponse.json({
      products: filtered,
      defaultLowStockThreshold: defaultThreshold,
      totalCount: enrichedProducts.length,
      lowStockCount: enrichedProducts.filter((p) => p.isLowStock).length,
    });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve inventory products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      description,
      quantity,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    } = body;

    // Strict validation as per PRD FR-3 & FR-4
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!sku || typeof sku !== "string" || sku.trim().length === 0) {
      return NextResponse.json(
        { error: "SKU is required" },
        { status: 400 }
      );
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check SKU uniqueness within the organization
    const existingSku = await prisma.product.findUnique({
      where: {
        organizationId_sku: {
          organizationId: session.organizationId,
          sku: cleanSku,
        },
      },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: `SKU "${cleanSku}" already exists in your organization` },
        { status: 409 }
      );
    }

    // Parse and sanitize fields
    const parsedQuantity = Math.max(0, parseInt(String(quantity ?? 0), 10) || 0);
    const parsedCostPrice =
      costPrice !== undefined && costPrice !== null && costPrice !== ""
        ? parseFloat(String(costPrice))
        : null;
    const parsedSellingPrice =
      sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ""
        ? parseFloat(String(sellingPrice))
        : null;
    const parsedThreshold =
      lowStockThreshold !== undefined &&
      lowStockThreshold !== null &&
      lowStockThreshold !== ""
        ? parseInt(String(lowStockThreshold), 10)
        : null;

    if (parsedCostPrice !== null && isNaN(parsedCostPrice)) {
      return NextResponse.json({ error: "Cost price must be a valid number" }, { status: 400 });
    }
    if (parsedSellingPrice !== null && isNaN(parsedSellingPrice)) {
      return NextResponse.json({ error: "Selling price must be a valid number" }, { status: 400 });
    }
    if (parsedThreshold !== null && isNaN(parsedThreshold)) {
      return NextResponse.json({ error: "Low stock threshold must be an integer" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        organizationId: session.organizationId,
        name: name.trim(),
        sku: cleanSku,
        description: description?.trim() || null,
        quantity: parsedQuantity,
        costPrice: parsedCostPrice,
        sellingPrice: parsedSellingPrice,
        lowStockThreshold: parsedThreshold,
        lastUpdatedBy: session.email,
      },
    });

    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

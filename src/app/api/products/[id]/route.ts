import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Fetch single product error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve product details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (!sku || typeof sku !== "string" || sku.trim().length === 0) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    const cleanSku = sku.trim().toUpperCase();

    // If SKU changed, check uniqueness
    if (cleanSku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId: session.organizationId,
            sku: cleanSku,
          },
        },
      });

      if (duplicateSku && duplicateSku.id !== existingProduct.id) {
        return NextResponse.json(
          { error: `SKU "${cleanSku}" already exists in your organization` },
          { status: 409 }
        );
      }
    }

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

    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
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

    return NextResponse.json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Verify ownership
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: existingProduct.id },
    });

    return NextResponse.json({
      message: `Product "${existingProduct.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

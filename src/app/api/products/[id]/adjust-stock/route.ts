import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
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
    const { delta, note } = body;

    const parsedDelta = parseInt(String(delta), 10);
    if (isNaN(parsedDelta) || parsedDelta === 0) {
      return NextResponse.json(
        { error: "A non-zero adjustment delta is required (e.g., +5 or -2)" },
        { status: 400 }
      );
    }

    const newQuantity = existingProduct.quantity + parsedDelta;
    if (newQuantity < 0) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Current quantity is ${existingProduct.quantity}, cannot reduce by ${Math.abs(
            parsedDelta
          )}`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        quantity: newQuantity,
        lastUpdatedBy: session.email + (note ? ` (${note.trim()})` : ""),
      },
    });

    return NextResponse.json({
      message: `Stock adjusted by ${parsedDelta > 0 ? "+" + parsedDelta : parsedDelta} units`,
      product: updated,
    });
  } catch (error) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to adjust product stock" },
      { status: 500 }
    );
  }
}

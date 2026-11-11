import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: {
        id: true,
        name: true,
        defaultLowStockThreshold: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true, users: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        defaultLowStockThreshold: org.defaultLowStockThreshold,
        totalProducts: org._count.products,
        totalUsers: org._count.users,
        createdAt: org.createdAt,
      },
      user: {
        email: session.email,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve organization settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { defaultLowStockThreshold, name } = body;

    const dataToUpdate: any = {};

    // Validate and update Default Low Stock Threshold (FR-7)
    if (defaultLowStockThreshold !== undefined && defaultLowStockThreshold !== null) {
      const parsedThreshold = parseInt(String(defaultLowStockThreshold), 10);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return NextResponse.json(
          { error: "Default low stock threshold must be a non-negative integer (0 or greater)" },
          { status: 400 }
        );
      }
      dataToUpdate.defaultLowStockThreshold = parsedThreshold;
    }

    // Optional update to organization name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Organization name cannot be empty" },
          { status: 400 }
        );
      }
      dataToUpdate.name = name.trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No valid settings fields provided to update" },
        { status: 400 }
      );
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: session.organizationId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        defaultLowStockThreshold: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Organization settings updated successfully",
      organization: updatedOrg,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update organization settings" },
      { status: 500 }
    );
  }
}

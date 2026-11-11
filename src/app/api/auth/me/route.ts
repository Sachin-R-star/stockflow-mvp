import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Refresh org details to get latest settings
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { id: true, name: true, defaultLowStockThreshold: true },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        organizationName: org?.name || session.organizationName,
        defaultLowStockThreshold: org?.defaultLowStockThreshold ?? 5,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

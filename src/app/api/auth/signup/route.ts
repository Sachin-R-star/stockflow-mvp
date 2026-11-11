import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, organizationName } = body;

    // Validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!organizationName || typeof organizationName !== "string" || organizationName.trim().length === 0) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          defaultLowStockThreshold: 5,
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: organizationName.trim() + " Admin",
          role: "OWNER",
          organizationId: org.id,
        },
      });

      return { org, user };
    });

    const sessionPayload = {
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.org.id,
      organizationName: result.org.name,
      role: result.user.role,
    };

    const token = signToken(sessionPayload);
    const response = NextResponse.json(
      {
        message: "Organization and account created successfully",
        user: sessionPayload,
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating account" },
      { status: 500 }
    );
  }
}

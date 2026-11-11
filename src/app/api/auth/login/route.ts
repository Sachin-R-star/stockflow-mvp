import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user along with their organization context
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization.id,
      organizationName: user.organization.name,
      role: user.role,
    };

    const token = signToken(sessionPayload);
    const response = NextResponse.json({
      message: "Login successful",
      user: sessionPayload,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while logging in" },
      { status: 500 }
    );
  }
}

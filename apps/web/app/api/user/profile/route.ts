import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();
    const { name: newName } = requestBody;

    if (!newName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const modifiedUser = await prisma.user.update({
      where: { email: userSession.user.email },
      data: { name: newName },
    });

    return NextResponse.json({ success: true, user: modifiedUser });
  } catch (err: any) {
    console.error("[Profile Route API PUT Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

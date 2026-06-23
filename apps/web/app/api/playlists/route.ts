import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const playlists = await prisma.playlist.findMany({
    include: {
      user: true,
    },
  });

  return Response.json(playlists);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    const playlist = await prisma.playlist.create({
      data: {
        name: body.name,
        description: body.description,
        userId: user.id,
      },
    });

    return Response.json(playlist);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
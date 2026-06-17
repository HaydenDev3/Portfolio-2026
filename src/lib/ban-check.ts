import { prisma } from "./db";

export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true },
    });
    return user?.banned === true;
  } catch {
    return false;
  }
}

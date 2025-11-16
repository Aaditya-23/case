"use server";

import { db } from "@/db";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const getAuthStatus = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Invalid user data");
  }

  // Try to retrieve user email from Clerk
  let email: string | undefined = undefined;
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    email =
      (clerkUser?.primaryEmailAddress as any)?.emailAddress ||
      (clerkUser?.emailAddresses &&
        clerkUser.emailAddresses[0]?.emailAddress) ||
      undefined;
  } catch (e) {
    // ignore
  }

  const existingUser = await db.user.findFirst({
    where: { id: userId },
  });

  if (!existingUser) {
    await db.user.create({
      data: {
        id: userId,
        email: email ?? "",
      },
    });
  }

  return { success: true };
};

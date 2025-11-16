"use server";

import { db } from "@/db";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const getPaymentStatus = async ({ orderId }: { orderId: string }) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You need to be logged in to view this page.");
  }

  // Attempt to fetch the user's email from Clerk
  let email: string | undefined = undefined;
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    email =
      // primaryEmailAddress may be available on the user object
      (clerkUser?.primaryEmailAddress as any)?.emailAddress ||
      // fallback to emailAddresses array
      (clerkUser?.emailAddresses &&
        clerkUser.emailAddresses[0]?.emailAddress) ||
      undefined;
  } catch (e) {
    // ignore and proceed with userId
  }

  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      billingAddress: true,
      configuration: true,
      shippingAddress: true,
      user: true,
    },
  });

  if (!order) throw new Error("This order does not exist.");

  if (order.isPaid) {
    return order;
  } else {
    return false;
  }
};

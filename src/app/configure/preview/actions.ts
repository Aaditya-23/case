"use server";

import { BASE_PRICE, PRODUCT_PRICES } from "@/config/products";
import { db } from "@/db";
// Stripe removed for local testing — simulate payment instead
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Order } from "@prisma/client";

export const createCheckoutSession = async (configId: string) => {
  console.log(configId, typeof configId);
  const configuration = await db.configuration.findUnique({
    where: { id: configId },
  });

  if (!configuration) {
    throw new Error("No such configuration found");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("You need to be logged in");
  }

  // Attempt to get the user's email from Clerk
  let email: string | undefined = undefined;
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    email =
      (clerkUser?.primaryEmailAddress as any)?.emailAddress ||
      (clerkUser?.emailAddresses &&
        clerkUser.emailAddresses[0]?.emailAddress) ||
      undefined;
  } catch (e) {
    // ignore and continue with unknown email
  }

  // Ensure the authenticated user exists in our local database.
  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, email: email ?? "" },
    update: { email: email ?? "" },
  });

  const { finish, material } = configuration;

  let price = BASE_PRICE;
  if (finish === "textured") price += PRODUCT_PRICES.finish.textured;
  if (material === "polycarbonate")
    price += PRODUCT_PRICES.material.polycarbonate;

  let order: Order | undefined = undefined;

  const existingOrder = await db.order.findFirst({
    where: {
      userId: userId,
      configurationId: configuration.id,
    },
  });

  if (existingOrder) {
    order = existingOrder;
  } else {
    order = await db.order.create({
      data: {
        amount: price / 100,
        userId,
        configurationId: configuration.id,
      },
    });
  }

  // Simulate a successful payment for easier local testing.
  // Mark the order as paid and return the thank-you page URL.
  await db.order.update({
    where: { id: order.id },
    data: { isPaid: true, status: "fulfilled" },
  });

  return {
    url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
  };
};

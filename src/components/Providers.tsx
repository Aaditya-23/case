"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

const client = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={client}>
      <ClerkProvider>{children}</ClerkProvider>
    </QueryClientProvider>
  );
};

export default Providers;

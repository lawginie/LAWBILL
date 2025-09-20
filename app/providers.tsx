"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers(props: { children: ReactNode }) {
  return (
    <AuthProvider>
      {props.children}
    </AuthProvider>
  );
}

"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { DictationProvider } from "@/components/dictation/DictationProvider";

export function Providers(props: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DictationProvider language="en-ZA">
        {props.children}
      </DictationProvider>
    </AuthProvider>
  );
}

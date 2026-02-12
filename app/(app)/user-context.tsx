"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "@/lib/types";

type UserData = {
  id: string;
  email: string;
  profile: Profile;
};

const UserContext = createContext<UserData | null>(null);

export function useUser(): UserData {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function UserProvider({
  user,
  children,
}: {
  user: UserData;
  children: ReactNode;
}) {
  return <UserContext value={user}>{children}</UserContext>;
}

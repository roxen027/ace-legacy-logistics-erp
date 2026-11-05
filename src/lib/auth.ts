import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { AuthSession } from "@/types";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "ace-legacy-services-ultra-secure-session-key-32chars-minimum",
  cookieName: "ace_legacy_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<AuthSession>> {
  const cookieStore = await cookies();
  const session = await getIronSession<AuthSession>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session.user || null;
}

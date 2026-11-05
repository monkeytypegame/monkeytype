// Signs out the current session; no-op when there is no session.
export async function signOut(): Promise<void> {
  // lazy: auth reads firebase on import, and the debug handle loads eagerly
  const { signOut } = await import("../auth");
  signOut();
}

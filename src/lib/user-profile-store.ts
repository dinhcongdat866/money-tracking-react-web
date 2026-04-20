/**
 * Demo in-memory profile store (per authenticated user id).
 * Production apps typically persist this in a database.
 */

export type UserProfileFields = {
  displayName: string;
  timezone: string;
  marketingOptIn: boolean;
};

const store = new Map<string, UserProfileFields>();

function defaultsFor(userId: string): UserProfileFields {
  return {
    displayName: userId === "1" ? "Demo User" : "User",
    timezone: "Europe/London",
    marketingOptIn: false,
  };
}

export function getProfileFields(userId: string): UserProfileFields {
  if (!store.has(userId)) {
    store.set(userId, defaultsFor(userId));
  }
  const row = store.get(userId);
  if (!row) {
    const created = defaultsFor(userId);
    store.set(userId, created);
    return created;
  }
  return row;
}

export function patchProfileFields(
  userId: string,
  patch: Partial<UserProfileFields>,
): UserProfileFields {
  const current = getProfileFields(userId);
  const next: UserProfileFields = {
    ...current,
    ...patch,
  };
  store.set(userId, next);
  return next;
}

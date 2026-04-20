export type AccountProfile = {
  email: string;
  displayName: string;
  timezone: string;
  marketingOptIn: boolean;
};

export type AccountProfilePatch = Partial<
  Pick<AccountProfile, "displayName" | "timezone" | "marketingOptIn">
>;

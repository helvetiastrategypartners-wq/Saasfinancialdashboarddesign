export interface AdminAccount {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  isBlocked: boolean;
  fullName: string;
  companyId: string | null;
  companyName: string | null;
  currency: string | null;
  mustChangePassword: boolean;
}

export interface CreatedAccount {
  companyId: string;
  userId: string;
  email: string;
  temporaryPassword: string;
}

export interface CreateAccountInput {
  companyName: string;
  currency: string;
  fullName: string;
  email: string;
  password: string;
  emailConfirm: boolean;
}

export type ConfirmationAction = "block" | "unblock" | "delete";

export interface ConfirmationState {
  action: ConfirmationAction;
  account: AdminAccount;
}


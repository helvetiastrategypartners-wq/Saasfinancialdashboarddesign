import type { AdminAccount, CreateAccountInput } from "./types";

const apiUrl = import.meta.env.VITE_ADMIN_API_URL?.trim() || "http://127.0.0.1:3001";

async function adminFetch(path: string, accessToken: string | undefined, init: RequestInit = {}) {
  if (!accessToken) {
    throw new Error("Session super-admin introuvable.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Action impossible.");
  }

  return payload;
}

export async function listAdminAccounts(accessToken: string | undefined): Promise<AdminAccount[]> {
  const payload = await adminFetch("/api/admin/accounts", accessToken);
  return payload.accounts ?? [];
}

export async function createAdminAccount(accessToken: string | undefined, input: CreateAccountInput) {
  return adminFetch("/api/admin/accounts", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setAdminAccountBlocked(accessToken: string | undefined, account: AdminAccount) {
  const payload = await adminFetch(`/api/admin/accounts/${account.id}/block`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ blocked: !account.isBlocked }),
  });

  return payload.account as AdminAccount;
}

export async function resetAdminAccountPassword(accessToken: string | undefined, account: AdminAccount, password: string) {
  const payload = await adminFetch(`/api/admin/accounts/${account.id}/password`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });

  return payload.account as AdminAccount;
}

export async function deleteAdminAccount(accessToken: string | undefined, account: AdminAccount) {
  await adminFetch(`/api/admin/accounts/${account.id}`, accessToken, { method: "DELETE" });
}


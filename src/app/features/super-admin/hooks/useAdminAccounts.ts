import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createAdminAccount,
  deleteAdminAccount,
  listAdminAccounts,
  resetAdminAccountPassword,
  setAdminAccountBlocked,
} from "../api";
import type { AdminAccount, CreateAccountInput, CreatedAccount } from "../types";

export function useAdminAccounts(accessToken: string | undefined) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!accessToken) return;
    setAccountsLoading(true);
    try {
      setAccounts(await listAdminAccounts(accessToken));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setAccountsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  function replaceAccount(account: AdminAccount) {
    setAccounts((current) => current.map((item) => (item.id === account.id ? account : item)));
  }

  async function createAccount(input: CreateAccountInput) {
    setCreated(null);
    setCreating(true);

    try {
      const payload = await createAdminAccount(accessToken, input);
      const nextCreated = {
        companyId: payload.company.id,
        userId: payload.user.id,
        email: payload.user.email,
        temporaryPassword: input.password,
      };
      setCreated(nextCreated);
      toast.success("Compte entreprise cree.");
      await loadAccounts();
      return nextCreated;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Creation impossible.");
      return null;
    } finally {
      setCreating(false);
    }
  }

  async function toggleBlock(account: AdminAccount) {
    setActionUserId(account.id);
    try {
      replaceAccount(await setAdminAccountBlocked(accessToken, account));
      toast.success(account.isBlocked ? "Compte debloque." : "Compte bloque.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Modification impossible.");
    } finally {
      setActionUserId(null);
    }
  }

  async function resetPassword(account: AdminAccount, password: string) {
    setActionUserId(account.id);
    try {
      const updated = await resetAdminAccountPassword(accessToken, account, password);
      replaceAccount(updated);
      toast.success("Mot de passe temporaire mis a jour.");
      setCreated({
        companyId: updated.companyId ?? "",
        userId: updated.id,
        email: updated.email,
        temporaryPassword: password,
      });
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset impossible.");
      return false;
    } finally {
      setActionUserId(null);
    }
  }

  async function deleteAccount(account: AdminAccount) {
    setActionUserId(account.id);
    try {
      await deleteAdminAccount(accessToken, account);
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      toast.success("Compte supprime.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    } finally {
      setActionUserId(null);
    }
  }

  return {
    accounts,
    accountsLoading,
    creating,
    actionUserId,
    created,
    loadAccounts,
    createAccount,
    toggleBlock,
    resetPassword,
    deleteAccount,
  };
}


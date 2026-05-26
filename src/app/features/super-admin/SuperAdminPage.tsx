import { useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../contexts/AuthContext";
import {
  AccountsTable,
  ConfirmAccountActionDialog,
  CreateAccountForm,
  CreatedCredentialsCard,
  ResetPasswordDialog,
  SessionCard,
} from "./components";
import { useAdminAccounts } from "./hooks/useAdminAccounts";
import type { AdminAccount, ConfirmationAction, ConfirmationState, CreateAccountInput } from "./types";

export function SuperAdmin() {
  const { session, user } = useAuth();
  const {
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
  } = useAdminAccounts(session?.access_token);
  const [resetAccount, setResetAccount] = useState<AdminAccount | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  async function handleCreate(input: CreateAccountInput) {
    return Boolean(await createAccount(input));
  }

  function openConfirmation(action: ConfirmationAction, account: AdminAccount) {
    setConfirmation({ action, account });
  }

  async function submitConfirmation() {
    if (!confirmation) return;

    const { action, account } = confirmation;
    setConfirmation(null);

    if (action === "delete") {
      await deleteAccount(account);
      return;
    }

    await toggleBlock(account);
  }

  async function submitResetPassword(password: string) {
    if (!resetAccount) return false;
    const updated = await resetPassword(resetAccount, password);
    if (updated) {
      setResetAccount(null);
    }
    return updated;
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Super Admin" subtitle="Creer, consulter et gerer les comptes entreprises" />

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.35fr] gap-6">
        <div className="space-y-6">
          <CreateAccountForm loading={creating} onCreate={handleCreate} />
          <SessionCard email={user?.email} />
        </div>

        <div className="space-y-6">
          <AccountsTable
            accounts={accounts}
            accountsLoading={accountsLoading}
            actionUserId={actionUserId}
            currentUserId={user?.id}
            onRefresh={() => void loadAccounts()}
            onResetPassword={setResetAccount}
            onConfirmAction={openConfirmation}
          />

          {created && <CreatedCredentialsCard created={created} />}
        </div>
      </div>

      {resetAccount && (
        <ResetPasswordDialog
          account={resetAccount}
          busy={actionUserId === resetAccount.id}
          onCancel={() => setResetAccount(null)}
          onSubmit={submitResetPassword}
        />
      )}

      {confirmation && (
        <ConfirmAccountActionDialog
          confirmation={confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={submitConfirmation}
        />
      )}
    </div>
  );
}


import { useCallback, useEffect, useState } from "react";
import {
  createUserAccount,
  getUserAccounts,
  updateUserAccount,
} from "../services/userAccountsService";
import type {
  UserAccount,
  UserAccountPayload,
  UserAccountUpdatePayload,
} from "../types/userAccount.types";

export function useUserAccounts(token: string) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserAccounts(token);
      setUsers(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el listado.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const addUser = async (payload: UserAccountPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createUserAccount(token, payload);
      await loadUsers();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el usuario.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editUser = async (id: number, payload: UserAccountUpdatePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateUserAccount(token, id, payload);
      await loadUsers();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el usuario.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addUser,
    editUser,
    error,
    isLoading,
    isSaving,
    reload: loadUsers,
    users,
  };
}

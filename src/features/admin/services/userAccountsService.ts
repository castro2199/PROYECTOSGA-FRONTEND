import { authFetch } from "../../auth/services/authService";
import type {
  UserAccount,
  UserAccountPayload,
  UserAccountUpdatePayload,
} from "../types/userAccount.types";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";

const USER_ACCOUNTS_URL = "/api/usuarios/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getUserAccounts(token: string): Promise<UserAccount[]> {
  return fetchAllPages<UserAccount>(USER_ACCOUNTS_URL, token, readError);
}

export async function createUserAccount(
  token: string,
  payload: UserAccountPayload,
): Promise<UserAccount> {
  const response = await authFetch(USER_ACCOUNTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as UserAccount;
}

export async function updateUserAccount(
  token: string,
  id: number,
  payload: UserAccountUpdatePayload,
): Promise<UserAccount> {
  const response = await authFetch(`${USER_ACCOUNTS_URL}${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as UserAccount;
}

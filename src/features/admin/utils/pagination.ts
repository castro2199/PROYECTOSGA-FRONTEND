import { authFetch } from "../../auth/services/authService";

type PaginatedResponse<T> = {
  next?: string | null;
  results?: T[];
};

function localApiPath(url: string) {
  if (!/^https?:\/\//i.test(url)) return url;

  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export async function fetchAllPages<T>(
  initialPath: string,
  token: string,
  readError: (response: Response) => Promise<string>,
): Promise<T[]> {
  let nextPath: string | null = initialPath;
  const results: T[] = [];
  const visited = new Set<string>();

  while (nextPath && !visited.has(nextPath)) {
    visited.add(nextPath);
    const response = await authFetch(localApiPath(nextPath), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(await readError(response));

    const data = (await response.json()) as PaginatedResponse<T> | T[];
    if (Array.isArray(data)) return [...results, ...data];

    results.push(...(data.results ?? []));
    nextPath = data.next ?? null;
  }

  return results;
}

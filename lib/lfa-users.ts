export type LFAUserId = 'JZL' | 'AVO' | 'AGL' | 'JSE';

export type LFAUser = {
  id: LFAUserId;
  username: string;
  password: string;
  teamName: string;
  clubId: string;
  planId: string;
};

export const LFA_USERS: readonly LFAUser[] = [
  {
    id: 'JZL',
    username: 'JZL',
    password: 'heslo',
    teamName: 'FK Zlamy',
    clubId: 'FK_ZLAMY',
    planId: 'plan-fk-zlamy'
  },
  {
    id: 'AVO',
    username: 'AVO',
    password: 'heslo',
    teamName: 'FK Adam',
    clubId: 'FK_ADAM',
    planId: 'plan-fk-adam'
  },
  {
    id: 'AGL',
    username: 'AGL',
    password: 'heslo',
    teamName: 'FK Adelka',
    clubId: 'FK_ADELKA',
    planId: 'plan-fk-adelka'
  },
  {
    id: 'JSE',
    username: 'JSE',
    password: 'heslo',
    teamName: 'FK Jirkovo',
    clubId: 'FK_JIRKOVO',
    planId: 'plan-fk-jirkovo'
  }
] as const;

export function findLfaUser(username: string, password?: string) {
  const normalizedUsername = username.trim().toUpperCase();
  return (
    LFA_USERS.find((user) => {
      const usernameMatches = user.username === normalizedUsername;
      if (!usernameMatches) return false;
      if (typeof password === 'string') return user.password === password;
      return true;
    }) ?? null
  );
}

export function getLfaUserById(id: string) {
  return LFA_USERS.find((user) => user.id === id) ?? null;
}

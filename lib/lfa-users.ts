export type LFAUserId = 'JZL' | 'AVO' | 'AGL' | 'JSE';

export type LFAUser = {
  id: LFAUserId;
  username: string;
  password: string;
  displayName: string;
  teamName: string;
  clubId: string;
  planId: string;
  isAdmin?: boolean;
  accessibleUserIds?: LFAUserId[];
};

export const LFA_USERS: readonly LFAUser[] = [
  {
    id: 'JZL',
    username: 'JZL',
    password: 'heslo',
    displayName: 'Jan Zlámal',
    teamName: 'FK Zlamy',
    clubId: 'FK_ZLAMY',
    planId: 'plan-fk-zlamy'
  },
  {
    id: 'AVO',
    username: 'AVO',
    password: 'heslo',
    displayName: 'Adam Vokoun',
    teamName: 'FK Adam',
    clubId: 'FK_ADAM',
    planId: 'plan-fk-adam'
  },
  {
    id: 'AGL',
    username: 'AGL',
    password: 'heslo',
    displayName: 'Adélka Glosová',
    teamName: 'FK Adelka',
    clubId: 'FK_ADELKA',
    planId: 'plan-fk-adelka'
  },
  {
    id: 'JSE',
    username: 'JSE',
    password: 'heslo',
    displayName: 'Jiří Severa',
    teamName: 'FK Jirkovo',
    clubId: 'FK_JIRKOVO',
    planId: 'plan-fk-jirkovo',
    isAdmin: true,
    accessibleUserIds: ['JSE', 'JZL', 'AVO', 'AGL']
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

export function getAccessibleUsers(user: LFAUser) {
  const ids = user.isAdmin ? user.accessibleUserIds ?? [user.id] : [user.id];
  return ids
    .map((id) => getLfaUserById(id))
    .filter((item): item is LFAUser => Boolean(item));
}

export function canUserAccessTeam(user: LFAUser, teamUserId: string) {
  return getAccessibleUsers(user).some((item) => item.id === teamUserId);
}

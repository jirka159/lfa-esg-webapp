"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { switchActiveTeam, type AuthenticatedUser } from '@/lib/auth-client';

type Props = {
  currentUser: AuthenticatedUser;
  activeTeam: AuthenticatedUser;
  availableTeams: AuthenticatedUser[];
};

export function TeamSwitcher({ currentUser, activeTeam, availableTeams }: Props) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(activeTeam.id);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!currentUser.isAdmin || availableTeams.length <= 1) {
    return null;
  }

  function handleChange(nextTeamId: string) {
    setSelectedTeamId(nextTeamId);
    setError('');

    startTransition(async () => {
      try {
        await switchActiveTeam(nextTeamId);
        router.refresh();
      } catch (err) {
        setSelectedTeamId(activeTeam.id);
        setError(err instanceof Error ? err.message : 'Nepodařilo se přepnout tým.');
      }
    });
  }

  return (
    <div className="teamSwitcherCard">
      <span className="eyebrow">Admin přepínač týmů</span>
      <label className="field">
        <span>Aktivní tým</span>
        <select value={selectedTeamId} onChange={(event) => handleChange(event.target.value)} disabled={isPending}>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.teamName} — {team.displayName}
            </option>
          ))}
        </select>
      </label>
      <small>
        Přihlášen jako {currentUser.displayName}. {isPending ? 'Přepínám tým…' : 'Zobrazená roadmapa a detaily odpovídají vybranému týmu.'}
      </small>
      {error ? <p className="switchError">{error}</p> : null}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { switchActiveTeam } from '@/lib/auth-client';

type TeamUser = {
  id: string;
  username: string;
  displayName: string;
  teamName: string;
  clubId: string;
  planId: string;
  isAdmin?: boolean;
};

type Props = {
  currentUser: TeamUser;
  activeTeam: TeamUser;
  availableTeams: TeamUser[];
};

export function TeamSwitcher({ currentUser, activeTeam, availableTeams }: Props) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(activeTeam.id);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedTeamId(activeTeam.id);
    setError('');
  }, [activeTeam.id]);

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

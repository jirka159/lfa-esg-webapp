"use client";

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { ESGActivity } from '@/lib/types';
import { ActivityCard } from '@/components/activity-card';
import { logout } from '@/lib/auth-client';

type Props = {
  initialActivities: ESGActivity[];
};

type BoardZone = 'planned' | 'catalog';

const STORAGE_KEY = 'lfa-esg-planner-items';

export function PlannerBoard({ initialActivities }: Props) {
  const [items, setItems] = useState(initialActivities);
  const [activeZone, setActiveZone] = useState<BoardZone | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as ESGActivity[];
      if (Array.isArray(parsed) && parsed.length) {
        setItems(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const plannedItems = useMemo(() => items.filter((activity) => activity.planned), [items]);
  const catalogItems = useMemo(() => items.filter((activity) => !activity.planned), [items]);

  function moveItem(id: string, target: BoardZone) {
    setItems((current) =>
      current.map((activity) =>
        activity.id === id ? { ...activity, planned: target === 'planned' } : activity
      )
    );
  }

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  function resetBoard() {
    setItems(initialActivities);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function zoneProps(zone: BoardZone) {
    return {
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setActiveZone(zone);
      },
      onDragLeave: () => setActiveZone((current) => (current === zone ? null : current)),
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        moveItem(id, zone);
        setActiveZone(null);
      }
    };
  }

  return (
    <>
      <div className="boardActions" style={{ display: 'flex', gap: 12, marginBottom: 18, justifyContent: 'flex-end' }}>
        <button className="secondaryButton" type="button" onClick={resetBoard}>
          Reset board
        </button>
        <button className="secondaryButton" type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="plannerShell">
        <section
          className={`panel panelPlanned ${activeZone === 'planned' ? 'panelActive' : ''}`}
          {...zoneProps('planned')}
        >
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Planned activities</span>
              <h2>MVP roadmap</h2>
            </div>
            <div className="panelStat">{plannedItems.length} active</div>
          </div>
          <div className="panelGrid">
            {plannedItems.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onMove={(id) => moveItem(id, 'catalog')}
                actionLabel="Move back to catalog"
              />
            ))}
          </div>
        </section>

        <section className={`panel ${activeZone === 'catalog' ? 'panelActive' : ''}`} {...zoneProps('catalog')}>
          <div className="panelHeader">
            <div>
              <span className="eyebrow">ESG activity catalog</span>
              <h2>Candidate initiatives</h2>
            </div>
            <div className="panelStat">{catalogItems.length} available</div>
          </div>
          <div className="panelGrid">
            {catalogItems.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onMove={(id) => moveItem(id, 'planned')}
                actionLabel="Add to plan"
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

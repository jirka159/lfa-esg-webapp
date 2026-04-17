"use client";

import { ESGActivity } from '@/lib/types';

type Props = {
  activity: ESGActivity;
  onMove?: (id: string) => void;
  actionLabel?: string;
};

const pillarColors = {
  E: '#28c98b',
  S: '#6ea8ff',
  G: '#b18cff'
} as const;

export function ActivityCard({ activity, onMove, actionLabel }: Props) {
  return (
    <article
      className="activityCard"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', activity.id);
      }}
    >
      <div className="activityMetaRow">
        <span className="pillarBadge" style={{ background: pillarColors[activity.pillar] }}>
          {activity.pillar}
        </span>
        <span>{activity.category}</span>
        <span>{activity.effort}</span>
      </div>
      <h3>{activity.title}</h3>
      <p>{activity.description}</p>
      <div className="activityFooter">
        <div>
          <strong>Vlastník:</strong> {activity.owner}
        </div>
        <div>
          <strong>Termín:</strong> {activity.dueDate}
        </div>
      </div>
      <div className="impactBox">{activity.impact}</div>
      {onMove ? (
        <button className="moveButton" onClick={() => onMove(activity.id)} type="button">
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

import type { BoardAgentAction } from '@/types';

export interface BoardAgentStarterIntent {
  id: string;
  label: string;
  prompt: string;
  description: string;
}

export interface BoardAgentActionPresentation {
  title: string;
  summary: string;
  risk: 'INFO' | 'LOW' | 'MATERIAL';
  expectedWrites: string[];
  receipt: string;
  queuedFollowUpPrompt?: string;
}

const AUTO_SELECTED_ACTION_TYPES = new Set<BoardAgentAction['type']>([
  'MESSAGE',
  'THINK',
  'UPDATE_TODO',
  'REVIEW_REGION',
  'SCHEDULE_FOLLOW_UP',
]);

const LOW_RISK_ORGANIZATION_ACTION_TYPES = new Set<BoardAgentAction['type']>([
  'SET_VIEWPORT',
  'MOVE_SHAPES',
  'ALIGN_SHAPES',
  'DISTRIBUTE_SHAPES',
  'GROUP_SELECTION',
  'CREATE_CONNECTOR',
]);

const MATERIAL_ACTION_TYPES = new Set<BoardAgentAction['type']>([
  'PLACE_LINKED_CARD',
  'CREATE_BOARD_NOTE',
  'CREATE_WORKSPACE_NOTE',
  'PROMOTE_EXCERPT',
  'ATTACH_ARTIFACT_SUMMARY',
  'CREATE_ARTIFACT_DRAFT',
  'APPEND_NOTE_TO_ARTIFACT',
  'CREATE_FOLLOW_UP_RUN',
]);

export const BOARD_AGENT_STARTER_INTENTS: BoardAgentStarterIntent[] = [
  {
    id: 'organize-evidence',
    label: 'Organize evidence',
    description: 'Group related records, clean the layout, and leave the board easier to scan.',
    prompt:
      'Organize the visible evidence into clear clusters, tighten the layout, and call out any obvious gaps or unsupported groupings.',
  },
  {
    id: 'cluster-sources',
    label: 'Cluster sources',
    description: 'Pull source-heavy regions into clearer groupings and note overlaps.',
    prompt:
      'Cluster the visible sources by theme or provenance, connect obviously related records, and point out duplicate or weakly supported source groups.',
  },
  {
    id: 'find-contradictions',
    label: 'Find contradictions',
    description: 'Scan the current board for claims that conflict or need stronger support.',
    prompt:
      'Review the selected board region for contradictions, unsupported claims, and places where the evidence trail looks thin. Leave a concise action plan.',
  },
  {
    id: 'draft-note',
    label: 'Draft note',
    description: 'Turn the current cluster into a reusable workspace note or excerpt.',
    prompt:
      'Draft a concise board note from the current selection that captures the strongest findings, the open questions, and the next verification step.',
  },
  {
    id: 'prep-briefing',
    label: 'Prep briefing',
    description: 'Prepare a briefing-oriented summary and next-action list from the current board.',
    prompt:
      'Prepare a briefing-oriented summary from the visible board context, highlight the most decision-relevant findings, and suggest the next concrete follow-up actions.',
  },
];

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const toCount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const titleCaseType = (type: BoardAgentAction['type']) =>
  type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildExpectedWrites = (action: BoardAgentAction, payload: Record<string, unknown>) => {
  switch (action.type) {
    case 'PLACE_LINKED_CARD':
    case 'ATTACH_ARTIFACT_SUMMARY':
      return ['Adds a linked card to the active board canvas.'];
    case 'MOVE_SHAPES':
      return ['Repositions existing board shapes.'];
    case 'ALIGN_SHAPES':
      return ['Aligns the current board selection.'];
    case 'DISTRIBUTE_SHAPES':
      return ['Redistributes the current board selection along one axis.'];
    case 'GROUP_SELECTION':
      return ['Creates a board group from the selected shapes.'];
    case 'CREATE_CONNECTOR':
      return ['Adds a connector between existing board shapes.'];
    case 'CREATE_BOARD_NOTE':
      return ['Creates a canonical workspace note and places it on the board.'];
    case 'CREATE_WORKSPACE_NOTE':
      return [
        payload.placeOnBoard === false
          ? 'Creates a canonical workspace note without placing it on the board.'
          : 'Creates a canonical workspace note and may place it on the board.',
      ];
    case 'PROMOTE_EXCERPT':
      return ['Promotes board context into a canonical workspace excerpt.'];
    case 'CREATE_ARTIFACT_DRAFT':
      return ['Creates a saved Artifact draft from board context.'];
    case 'APPEND_NOTE_TO_ARTIFACT':
      return ['Appends a new section into an existing Artifact.'];
    case 'CREATE_FOLLOW_UP_RUN':
      return ['Launches a follow-up Run from the current workspace context.'];
    case 'REVIEW_REGION':
      return ['Queues a follow-up review pass over the selected board region.'];
    case 'SCHEDULE_FOLLOW_UP':
      return ['Queues a follow-up board-agent prompt for a later pass in this session.'];
    case 'SET_VIEWPORT':
      return ['Changes the visible board viewport without modifying canon.'];
    case 'UPDATE_TODO':
      return ['Updates the session todo list shown in the board-agent rail.'];
    default:
      return [];
  }
};

const buildSummary = (action: BoardAgentAction, payload: Record<string, unknown>) => {
  switch (action.type) {
    case 'MESSAGE':
    case 'THINK':
      return normalizeText(payload.text ?? payload.message ?? payload.thought) || 'No inline message provided.';
    case 'UPDATE_TODO': {
      const items = Array.isArray(payload.items) ? payload.items.length : 0;
      return items > 0 ? `Updates ${items} todo item${items === 1 ? '' : 's'}.` : 'Updates the current todo list.';
    }
    case 'SET_VIEWPORT':
      return payload.shapeIds ? 'Focuses the current view on the selected region.' : 'Adjusts the board viewport.';
    case 'PLACE_LINKED_CARD':
    case 'ATTACH_ARTIFACT_SUMMARY':
      return normalizeText(payload.refId)
        ? `Places linked record ${normalizeText(payload.refKind)}:${normalizeText(payload.refId)} on the board.`
        : 'Places a linked record on the board.';
    case 'MOVE_SHAPES': {
      const dx = toCount(payload.dx) ?? 0;
      const dy = toCount(payload.dy) ?? 0;
      return `Moves selected shapes by ${dx}, ${dy}.`;
    }
    case 'ALIGN_SHAPES':
      return normalizeText(payload.operation)
        ? `Aligns shapes using ${normalizeText(payload.operation)}.`
        : 'Aligns the selected shapes.';
    case 'DISTRIBUTE_SHAPES':
      return normalizeText(payload.operation)
        ? `Distributes shapes along the ${normalizeText(payload.operation)} axis.`
        : 'Distributes the selected shapes.';
    case 'GROUP_SELECTION':
      return 'Groups the current board selection.';
    case 'CREATE_CONNECTOR':
      return normalizeText(payload.label)
        ? `Creates a labeled connector: ${normalizeText(payload.label)}.`
        : 'Creates a connector between selected shapes.';
    case 'CREATE_BOARD_NOTE':
    case 'CREATE_WORKSPACE_NOTE':
      return normalizeText(payload.title)
        ? `Creates note "${normalizeText(payload.title)}".`
        : 'Creates a canonical workspace note.';
    case 'PROMOTE_EXCERPT':
      return normalizeText(payload.title)
        ? `Promotes excerpt "${normalizeText(payload.title)}".`
        : 'Promotes the selected text into a canonical excerpt.';
    case 'CREATE_ARTIFACT_DRAFT':
      return normalizeText(payload.title)
        ? `Creates artifact draft "${normalizeText(payload.title)}".`
        : 'Creates a saved artifact draft.';
    case 'APPEND_NOTE_TO_ARTIFACT':
      return normalizeText(payload.title)
        ? `Appends "${normalizeText(payload.title)}" to an artifact.`
        : 'Appends a new note section to an artifact.';
    case 'CREATE_FOLLOW_UP_RUN':
      return normalizeText(payload.topic)
        ? `Launches follow-up run "${normalizeText(payload.topic)}".`
        : 'Launches a follow-up run.';
    case 'SCHEDULE_FOLLOW_UP':
    case 'REVIEW_REGION':
      return normalizeText(payload.prompt)
        ? normalizeText(payload.prompt)
        : 'Queues a follow-up prompt.';
    default:
      return 'Planned board-agent action.';
  }
};

const buildReceipt = (action: BoardAgentAction) => {
  if (action.status === 'FAILED' || action.status === 'REJECTED') {
    return action.error || 'Execution failed.';
  }
  if (action.status === 'SKIPPED') {
    return 'Skipped during review.';
  }
  if (action.status === 'AWAITING_APPROVAL') {
    return 'Waiting for review before execution.';
  }
  if (action.status === 'RUNNING') {
    return 'Executing now.';
  }

  const result = action.result || {};
  switch (action.type) {
    case 'PLACE_LINKED_CARD':
    case 'ATTACH_ARTIFACT_SUMMARY':
      return normalizeText(result.title)
        ? `Placed linked card for "${normalizeText(result.title)}".`
        : 'Placed a linked card on the board.';
    case 'MOVE_SHAPES': {
      const movedCount = toCount(result.movedCount);
      return movedCount ? `Moved ${movedCount} board shape${movedCount === 1 ? '' : 's'}.` : 'Moved board shapes.';
    }
    case 'ALIGN_SHAPES': {
      const alignedCount = toCount(result.alignedCount);
      return alignedCount
        ? `Aligned ${alignedCount} board shape${alignedCount === 1 ? '' : 's'}.`
        : 'Aligned board shapes.';
    }
    case 'DISTRIBUTE_SHAPES': {
      const distributedCount = toCount(result.distributedCount);
      return distributedCount
        ? `Distributed ${distributedCount} board shape${distributedCount === 1 ? '' : 's'}.`
        : 'Distributed board shapes.';
    }
    case 'GROUP_SELECTION':
      return normalizeText(result.groupId)
        ? `Created group ${normalizeText(result.groupId)}.`
        : 'Created a new board group.';
    case 'CREATE_CONNECTOR':
      return normalizeText(result.connectorShapeId)
        ? `Created connector ${normalizeText(result.connectorShapeId)}.`
        : 'Created a board connector.';
    case 'CREATE_BOARD_NOTE':
    case 'CREATE_WORKSPACE_NOTE':
    case 'PROMOTE_EXCERPT':
      return normalizeText(result.workspaceItemId)
        ? `Created workspace item ${normalizeText(result.workspaceItemId)}.`
        : 'Created a canonical workspace item.';
    case 'CREATE_ARTIFACT_DRAFT':
      return normalizeText(result.artifactId)
        ? `Saved artifact ${normalizeText(result.artifactId)}.`
        : 'Saved an artifact draft.';
    case 'APPEND_NOTE_TO_ARTIFACT':
      return normalizeText(result.sectionId)
        ? `Appended section ${normalizeText(result.sectionId)} to the artifact.`
        : 'Appended a section to the artifact.';
    case 'CREATE_FOLLOW_UP_RUN':
      return normalizeText(result.topic)
        ? `Queued follow-up run "${normalizeText(result.topic)}".`
        : 'Queued a follow-up run.';
    case 'REVIEW_REGION':
    case 'SCHEDULE_FOLLOW_UP': {
      const prompt = normalizeText(result.queuedFollowUpPrompt);
      return prompt ? `Queued next action: ${prompt}` : 'Queued a follow-up action.';
    }
    case 'UPDATE_TODO': {
      const count = toCount(result.count);
      return count ? `Updated ${count} todo item${count === 1 ? '' : 's'}.` : 'Updated the todo list.';
    }
    default:
      return action.status === 'COMPLETED' ? 'Completed.' : 'Pending execution.';
  }
};

export const isBoardAgentLowRiskOrganizationActionType = (type: BoardAgentAction['type']) =>
  LOW_RISK_ORGANIZATION_ACTION_TYPES.has(type);

export const isBoardAgentMaterialActionType = (type: BoardAgentAction['type']) =>
  MATERIAL_ACTION_TYPES.has(type);

export const getBoardAgentReviewDefaultSelection = (
  type: BoardAgentAction['type'],
  autoApproveOrganizationActions: boolean
) => {
  if (AUTO_SELECTED_ACTION_TYPES.has(type)) {
    return true;
  }

  if (LOW_RISK_ORGANIZATION_ACTION_TYPES.has(type)) {
    return autoApproveOrganizationActions;
  }

  return false;
};

export const buildBoardAgentActionPresentation = (
  action: Pick<BoardAgentAction, 'type' | 'status' | 'input' | 'normalizedInput' | 'result' | 'error'>
): BoardAgentActionPresentation => {
  const payload = (action.normalizedInput || action.input || {}) as Record<string, unknown>;
  const queuedFollowUpPrompt =
    normalizeText((action.result as Record<string, unknown> | undefined)?.queuedFollowUpPrompt) ||
    undefined;

  return {
    title: titleCaseType(action.type),
    summary: buildSummary(action as BoardAgentAction, payload),
    risk: isBoardAgentMaterialActionType(action.type)
      ? 'MATERIAL'
      : isBoardAgentLowRiskOrganizationActionType(action.type)
        ? 'LOW'
        : 'INFO',
    expectedWrites: buildExpectedWrites(action as BoardAgentAction, payload),
    receipt: buildReceipt(action as BoardAgentAction),
    queuedFollowUpPrompt,
  };
};

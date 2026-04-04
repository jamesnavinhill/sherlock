import { describe, expect, it } from 'vitest';
import { resolveLaunchLineage } from './relationships';

describe('resolveLaunchLineage', () => {
    it('derives parent run and source signal from a parent artifact', () => {
        const lineage = resolveLaunchLineage({
            request: {
                topic: 'Child run',
                parentArtifactId: 'rep-1',
            },
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Parent Artifact',
                    summary: 'Summary',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                    config: {
                        sourceRunId: 'run-1',
                        sourceSignalId: 'sig-1',
                    },
                },
            ],
            runs: [
                {
                    id: 'run-1',
                    workspaceId: 'case-1',
                    topic: 'Parent Artifact',
                    status: 'COMPLETED',
                    startTime: 1,
                    endTime: 2,
                    config: {
                        producedArtifactId: 'rep-1',
                    },
                },
            ],
        });

        expect(lineage).toEqual({
            parentArtifactId: 'rep-1',
            parentRunId: 'run-1',
            sourceSignalId: 'sig-1',
        });
    });

    it('derives the parent artifact from an explicit parent run', () => {
        const lineage = resolveLaunchLineage({
            request: {
                topic: 'Child run',
                parentRunId: 'run-1',
            },
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Parent Artifact',
                    summary: 'Summary',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                },
            ],
            runs: [
                {
                    id: 'run-1',
                    workspaceId: 'case-1',
                    topic: 'Parent Artifact',
                    status: 'COMPLETED',
                    startTime: 1,
                    endTime: 2,
                    config: {
                        producedArtifactId: 'rep-1',
                        sourceSignalId: 'sig-1',
                    },
                },
            ],
        });

        expect(lineage).toEqual({
            parentArtifactId: 'rep-1',
            parentRunId: 'run-1',
            sourceSignalId: 'sig-1',
        });
    });
});


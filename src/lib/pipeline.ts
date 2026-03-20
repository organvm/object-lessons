import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export interface PipelineObject {
  name: string;
  status: string;
  research_films: number;
  outline: string;
  narration: string;
  edit: string;
  target_release: string;
  notes: string;
}

export interface PipelineStatus {
  current_sprint: string;
  last_updated: string;
  objects: PipelineObject[];
  submissions_pending: {
    objects: number;
    films: number;
    clips: number;
  };
}

export function getPipelineStatus(): PipelineStatus {
  const raw = readFileSync(new URL('../data/pipeline-status.yaml', import.meta.url), 'utf-8');
  return parse(raw) as PipelineStatus;
}

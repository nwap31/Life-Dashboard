/**
 * School — reading list + assignment tracker. Assignments are logged manually
 * for now; once a school-year Todoist list exists, the mentor can pull it in
 * the same way Today's calendar/todo sync works (see lib/data/today.ts).
 */
import { tileStore } from '@/lib/tiles/tileStore'

export type ReadingStatus = 'to-read' | 'reading' | 'done'

export interface ReadingItem {
  id: string
  title: string
  status: ReadingStatus
  notes?: string
}

export interface Assignment {
  id: string
  title: string
  course?: string
  dueDate?: string // ISO date
  done: boolean
}

export interface SchoolData {
  reading: ReadingItem[]
  assignments: Assignment[]
}

export const SLOT = 'school'
const USER_ID = 'me'

const DEFAULT_DATA: SchoolData = { reading: [], assignments: [] }

export async function loadSchool(): Promise<SchoolData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    Array.isArray((raw as SchoolData).reading) &&
    Array.isArray((raw as SchoolData).assignments)
  ) {
    return raw as SchoolData
  }
  return DEFAULT_DATA
}

export async function saveSchool(data: SchoolData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, data)
}

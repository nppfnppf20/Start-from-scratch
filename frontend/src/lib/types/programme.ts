export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  color: string;
  type: 'manual' | 'log' | 'log-custom';
  projectId: string;
  quoteId?: string;
  customDateId?: string;
}

export interface SurveyorRowData {
  quote: any; // import concrete types where used to avoid circular
  log: any | undefined;
  itemsByWeek: Record<string, TimelineItem[]>;
  isCompleted: boolean;
}


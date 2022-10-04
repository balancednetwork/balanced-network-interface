export type LockedPeriod = {
  name: string;
  weeks: number;
};

export type DateOptions = {
  month: 'numeric' | 'short' | '2-digit' | 'long' | 'narrow' | undefined;
  day: any;
  year?: any;
};

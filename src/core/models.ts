export enum ServiceType {
  LEKTURA = "LEKTURA",
  KOREKTURA = "KOREKTURA",
  BOTH = "BOTH",
}

export enum JobStatus {
  CREATED = "CREATED",
  READY = "READY",
  PROCESSING = "PROCESSING",
  DONE = "DONE",
  ERROR = "ERROR",
}

export type TextType = string;
export type Language = "crnogorski" | "srpski" | "hrvatski" | "bosanski";

export interface Job {
  id: string;
  rawText: string;
  serviceType: ServiceType;
  textType: TextType;
  language: Language;
  cardCount: number;
  status: JobStatus;
  createdAt: string;
}

export interface TextCard {
  index: number;
  content: string;
  charCount: number;
}

export type ChangeStatus = "active" | "reverted";

export interface ReversibleChange {
  id: string;
  original: string;
  modified: string;
  startIndex: number;
  endIndex: number;
  groupKey: string;
  status: ChangeStatus;
}

export type TokenStatus = "static" | ChangeStatus;

export interface ReversibleToken {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  changeId?: string;
  groupKey?: string;
  status: TokenStatus;
}

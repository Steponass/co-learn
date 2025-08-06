export interface PronunciationSound {
  audio: string;
}

export interface Pronunciation {
  ipa?: string;
  sound?: PronunciationSound;
}

export interface HeadwordInfo {
  hw: string;
  prs?: Pronunciation[];
}

export interface VisualExample {
  t: string;
}

export interface UsageNote {
  0: Array<Array<string>>;
  1: VisualExample[];
}

export interface SenseData {
  sn?: string;
  sgram?: string;
  sls?: string[];
  dt?: Array<
    | ["text", string]
    | ["vis", VisualExample[]]
    | ["uns", UsageNote[]]
    | ["wsgram", string]
    | ["snote", Array<["t", string] | ["vis", VisualExample[]]>]
  >;
}

export interface SenseEntry {
  0: "sense" | "sen";
  1: SenseData;
}

export interface SubSenseSequence {
  0: SenseEntry;
  1?: SenseEntry;
  2?: SenseEntry;
}

export interface DefinitionStructure {
  sseq: SubSenseSequence[];
}

export interface PhraseDefinition {
  drp: string;
  def: DefinitionStructure[];
}

export interface DictionaryEntry {
  meta: {
    id: string;
  };
  hwi: HeadwordInfo;
  fl?: string;
  shortdef?: string[];
  def?: DefinitionStructure[];
  dros?: PhraseDefinition[];
}

export type DictionaryApiResponse = DictionaryEntry[] | string[];

export interface ProcessedSense {
  number: string;
  definition: string;
  examples: string[];
  usagePatterns?: string[];
  subSenses?: Array<{
    letter: string;
    definition: string;
    examples: string[];
    usagePatterns?: string[];
  }>;
}

export interface ProcessedEntry {
  word: string;
  partOfSpeech: string;
  pronunciations: Pronunciation[];
  audioUrl?: string;
  senses: ProcessedSense[];
}

export interface ProcessedPhrase {
  phrase: string;
  definition: string;
  example: string;
}

export interface ProcessedDictionaryData {
  entries: ProcessedEntry[];
  phrases?: ProcessedPhrase[];
  synonyms: string[];
}

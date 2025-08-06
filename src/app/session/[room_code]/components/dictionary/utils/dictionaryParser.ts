import { stripHtml, extractSynonyms } from "./textUtils";
import type {
  DictionaryEntry,
  PhraseDefinition,
  ProcessedDictionaryData,
  ProcessedEntry,
  ProcessedPhrase,
  ProcessedSense,
  SenseData,
  SubSenseSequence,
  UsageNote,
  VisualExample,
} from "../types";

/*
 * Constructs audio URL for pronunciation file
 */
export const constructAudioUrl = (audioFilename: string): string => {
  const baseUrl = "https://media.merriam-webster.com/audio/prons/en/us/mp3";

  let subdirectory: string;
  if (audioFilename.startsWith("bix")) {
    subdirectory = "bix";
  } else if (audioFilename.startsWith("gg")) {
    subdirectory = "gg";
  } else if (/^\d/.test(audioFilename)) {
    subdirectory = "number";
  } else {
    subdirectory = audioFilename.charAt(0);
  }

  return `${baseUrl}/${subdirectory}/${audioFilename}.mp3`;
};

/*
 * Extracts usage patterns from dictionary data
 */
export const extractUsagePatterns = (dtArray: SenseData["dt"]): string[] => {
  if (!dtArray) return [];

  const patterns: string[] = [];

  dtArray.forEach((item) => {
    if (item[0] === "uns") {
      const usageNotes = item[1] as UsageNote[];
      usageNotes.forEach((note: UsageNote) => {
        if (note[0] && Array.isArray(note[0])) {
          note[0].forEach((subItem: string[]) => {
            if (Array.isArray(subItem) && subItem[0] === "text" && subItem[1]) {
              patterns.push(stripHtml(subItem[1]).trim());
            }
          });
        }
      });
    }
  });

  return patterns;
};

/*
 * Extracts examples and synonyms
 */
export const extractExamplesFromDt = (
  dtArray: SenseData["dt"]
): { examples: string[]; synonyms: string[] } => {
  if (!dtArray) return { examples: [], synonyms: [] };

  const examples: string[] = [];
  const synonyms: string[] = [];

  dtArray.forEach((item) => {
    if (item[0] === "vis") {
      const visualExamples = item[1] as VisualExample[];
      visualExamples.forEach((vis: VisualExample) => {
        const cleanExample = stripHtml(vis.t);
        examples.push(cleanExample);
        synonyms.push(...extractSynonyms(vis.t));
      });
    }
  });

  return { examples, synonyms };
};

/*
 * Extracts phrases and idioms
 */
export const extractPhrases = (dros: PhraseDefinition[]): ProcessedPhrase[] => {
  const phrases: ProcessedPhrase[] = [];

  dros.forEach((dro) => {
    if (dro.drp && dro.def && dro.def[0]?.sseq) {
      const phrase = stripHtml(dro.drp);
      let definition = "";
      let example = "";

      dro.def[0].sseq.forEach((subSeq: SubSenseSequence) => {
        const senseEntry = subSeq[0];
        if (senseEntry[0] === "sense" && senseEntry[1]?.dt) {
          senseEntry[1].dt.forEach((dtItem) => {
            if (dtItem[0] === "snote") {
              const snoteData = dtItem[1] as Array<
                ["t", string] | ["vis", VisualExample[]]
              >;
              snoteData.forEach((snoteItem) => {
                if (snoteItem[0] === "t") {
                  definition = stripHtml(snoteItem[1]);
                } else if (snoteItem[0] === "vis") {
                  const visArray = snoteItem[1] as VisualExample[];
                  if (visArray[0]?.t) {
                    example = stripHtml(visArray[0].t);
                  }
                }
              });
            }
          });
        }
      });

      if (phrase && definition) {
        phrases.push({ phrase, definition, example });
      }
    }
  });

  return phrases;
};

/*
 * Parses sense data from dictionary entry
 */
export const parseSenseData = (
  senseData: SenseData
): {
  definition: string;
  examples: string[];
  synonyms: string[];
  usagePatterns: string[];
} => {
  let definition = "";
  let examples: string[] = [];
  let synonyms: string[] = [];
  let usagePatterns: string[] = [];

  if (senseData.dt) {
    senseData.dt.forEach((dtItem) => {
      if (dtItem[0] === "text") {
        definition = stripHtml(dtItem[1])
          .replace(/^\{bc\}/, "")
          .trim();
      }
    });

    const extractedData = extractExamplesFromDt(senseData.dt);
    examples = extractedData.examples;
    synonyms = extractedData.synonyms;
    usagePatterns = extractUsagePatterns(senseData.dt);
  }

  return { definition, examples, synonyms, usagePatterns };
};

/*
 * Main parser function that processes the entire dictionary API response
 */
export const parseDictionaryResponse = (
  entries: DictionaryEntry[]
): ProcessedDictionaryData => {
  const processedEntries: ProcessedEntry[] = [];
  const allSynonyms: string[] = [];
  const phrases: ProcessedPhrase[] = [];

  entries.forEach((entry) => {
    const audioUrl = entry.hwi.prs?.[0]?.sound?.audio
      ? constructAudioUrl(entry.hwi.prs[0].sound.audio)
      : undefined;

    const senses: ProcessedSense[] = [];

    if (entry.def?.[0]?.sseq) {
      entry.def[0].sseq.forEach((subSeq) => {
        const mainSenseEntry = subSeq[0];
        if (mainSenseEntry[0] === "sense" && mainSenseEntry[1]) {
          const senseNumber = mainSenseEntry[1].sn || String(senses.length + 1);
          const parsedData = parseSenseData(mainSenseEntry[1]);

          allSynonyms.push(...parsedData.synonyms);

          senses.push({
            number: senseNumber,
            definition: parsedData.definition,
            examples: parsedData.examples,
            usagePatterns:
              parsedData.usagePatterns.length > 0
                ? parsedData.usagePatterns
                : undefined,
          });
        }
      });
    }

    processedEntries.push({
      word: entry.hwi.hw.replace(/\*/g, ""),
      partOfSpeech: entry.fl || "",
      pronunciations: entry.hwi.prs || [],
      audioUrl,
      senses,
    });

    if (entry.dros) {
      phrases.push(...extractPhrases(entry.dros));
    }
  });

  return {
    entries: processedEntries,
    phrases: phrases.length > 0 ? phrases : undefined,
    synonyms: [...new Set(allSynonyms)],
  };
};

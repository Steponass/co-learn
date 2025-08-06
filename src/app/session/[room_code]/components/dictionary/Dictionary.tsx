"use client";

import { useState, useRef } from "react";
import MessageDisplay from "@/app/(main)/components/MessageDisplay";
import classes from "./Dictionary.module.css";
import { PlayAudioIcon } from "@/app/components/Icon";

// Types (same as before)
interface PronunciationSound {
  audio: string;
}

interface Pronunciation {
  ipa?: string;
  sound?: PronunciationSound;
}

interface HeadwordInfo {
  hw: string;
  prs?: Pronunciation[];
}

interface VisualExample {
  t: string;
}

interface UsageNote {
  0: Array<Array<string>>;
  1: VisualExample[];
}

interface SenseData {
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

interface SenseEntry {
  0: "sense" | "sen";
  1: SenseData;
}

interface SubSenseSequence {
  0: SenseEntry;
  1?: SenseEntry;
  2?: SenseEntry;
}

interface DefinitionStructure {
  sseq: SubSenseSequence[];
}

interface PhraseDefinition {
  drp: string;
  def: DefinitionStructure[];
}

interface DictionaryEntry {
  meta: {
    id: string;
  };
  hwi: HeadwordInfo;
  fl?: string;
  shortdef?: string[];
  def?: DefinitionStructure[];
  dros?: PhraseDefinition[];
}

type DictionaryApiResponse = DictionaryEntry[] | string[];

interface ProcessedSense {
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

interface ProcessedEntry {
  word: string;
  partOfSpeech: string;
  pronunciations: Pronunciation[];
  audioUrl?: string;
  senses: ProcessedSense[];
}

interface ProcessedPhrase {
  phrase: string;
  definition: string;
  example: string;
}

interface ProcessedDictionaryData {
  entries: ProcessedEntry[];
  phrases?: ProcessedPhrase[];
  synonyms: string[];
}

export default function Dictionary() {
  const [input, setInput] = useState("");
  const [dictionaryData, setDictionaryData] = useState<ProcessedDictionaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_MERRIAM_WEBSTER_API_KEY;

  // Enhanced text cleaning function
  const stripHtml = (html: string): string => {
    try {
      let cleaned = html;
      
      // Handle Merriam-Webster specific markup
      cleaned = cleaned
        // Remove bullet character markers
        .replace(/\{bc\}/g, '')
        // Handle italic text - keep the text, remove markup
        .replace(/\{it\}([^}]+)\{\/it\}/g, '$1')
        // Handle phrases - keep the text, remove markup
        .replace(/\{phrase\}([^}]+)\{\/phrase\}/g, '$1')
        // Handle cross-references - extract the main word
        .replace(/\{dx\}[^{]*\{dxt\|([^|]+)\|\|\}\{\/dx\}/g, '(opposite: $1)')
        // Handle synonyms - extract the word
        .replace(/\{sx\|([^|]+)\|\|\}/g, '($1)')
        // Handle definition cross-references
        .replace(/\{d_link\|([^|]+)\|([^}]+)\}/g, '$1')
        // Handle subscript
        .replace(/\{sub\}([^}]+)\{\/sub\}/g, '$1')
        // Handle superscript
        .replace(/\{sup\}([^}]+)\{\/sup\}/g, '$1')
        // Handle bold text
        .replace(/\{b\}([^}]+)\{\/b\}/g, '$1')
        // Handle small caps
        .replace(/\{sc\}([^}]+)\{\/sc\}/g, '$1')
        // Handle Latin text
        .replace(/\{lat\}([^}]+)\{\/lat\}/g, '$1')
        // Handle foreign text
        .replace(/\{foreign\}([^}]+)\{\/foreign\}/g, '$1')
        // Remove any remaining curly brace markup
        .replace(/\{[^}]*\}/g, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();

      // Now handle regular HTML tags if any
      const doc = new DOMParser().parseFromString(cleaned, "text/html");
      return doc.body.textContent || cleaned;
    } catch {
      // Fallback: remove all markup manually
      return html
        .replace(/\{bc\}/g, '')
        .replace(/\{it\}([^}]+)\{\/it\}/g, '$1')
        .replace(/\{phrase\}([^}]+)\{\/phrase\}/g, '$1')
        .replace(/\{dx\}[^{]*\{dxt\|([^|]+)\|\|\}\{\/dx\}/g, '(opposite: $1)')
        .replace(/\{sx\|([^|]+)\|\|\}/g, '($1)')
        .replace(/\{[^}]*\}/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  };

  const constructAudioUrl = (audioFilename: string): string => {
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

  const extractSynonyms = (text: string): string[] => {
    const synonyms: string[] = [];
    
    // Extract from [=word] format
    const synonymRegex1 = /\[=\{it\}([^}]+)\{\/it\}\]/g;
    let match;
    while ((match = synonymRegex1.exec(text)) !== null) {
      synonyms.push(match[1]);
    }
    
    // Extract from {sx|word||} format
    const synonymRegex2 = /\{sx\|([^|]+)\|\|\}/g;
    while ((match = synonymRegex2.exec(text)) !== null) {
      synonyms.push(match[1]);
    }

    return synonyms;
  };

  const extractUsagePatterns = (dtArray: SenseData['dt']): string[] => {
    if (!dtArray) return [];

    const patterns: string[] = [];

    dtArray.forEach(item => {
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

  const extractExamplesFromDt = (dtArray: SenseData['dt']): { examples: string[], synonyms: string[] } => {
    if (!dtArray) return { examples: [], synonyms: [] };

    const examples: string[] = [];
    const synonyms: string[] = [];

    dtArray.forEach(item => {
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

  const extractPhrases = (dros: PhraseDefinition[]): ProcessedPhrase[] => {
    const phrases: ProcessedPhrase[] = [];

    dros.forEach(dro => {
      if (dro.drp && dro.def && dro.def[0]?.sseq) {
        const phrase = stripHtml(dro.drp);
        let definition = "";
        let example = "";

        dro.def[0].sseq.forEach((subSeq: SubSenseSequence) => {
          const senseEntry = subSeq[0];
          if (senseEntry[0] === "sense" && senseEntry[1]?.dt) {
            senseEntry[1].dt.forEach(dtItem => {
              if (dtItem[0] === "snote") {
                const snoteData = dtItem[1] as Array<["t", string] | ["vis", VisualExample[]]>;
                snoteData.forEach(snoteItem => {
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

  const parseSenseData = (senseData: SenseData): { definition: string, examples: string[], synonyms: string[], usagePatterns: string[] } => {
    let definition = "";
    let examples: string[] = [];
    let synonyms: string[] = [];
    let usagePatterns: string[] = [];

    if (senseData.dt) {
      senseData.dt.forEach(dtItem => {
        if (dtItem[0] === "text") {
          definition = stripHtml(dtItem[1]).replace(/^\{bc\}/, "").trim();
        }
      });

      const extractedData = extractExamplesFromDt(senseData.dt);
      examples = extractedData.examples;
      synonyms = extractedData.synonyms;
      usagePatterns = extractUsagePatterns(senseData.dt);
    }

    return { definition, examples, synonyms, usagePatterns };
  };

  const parseDictionaryResponse = (entries: DictionaryEntry[]): ProcessedDictionaryData => {
    const processedEntries: ProcessedEntry[] = [];
    const allSynonyms: string[] = [];
    const phrases: ProcessedPhrase[] = [];

    entries.forEach(entry => {
      const audioUrl = entry.hwi.prs?.[0]?.sound?.audio
        ? constructAudioUrl(entry.hwi.prs[0].sound.audio)
        : undefined;

      const senses: ProcessedSense[] = [];

      if (entry.def?.[0]?.sseq) {
        entry.def[0].sseq.forEach(subSeq => {
          const mainSenseEntry = subSeq[0];
          if (mainSenseEntry[0] === "sense" && mainSenseEntry[1]) {
            const senseNumber = mainSenseEntry[1].sn || String(senses.length + 1);
            const parsedData = parseSenseData(mainSenseEntry[1]);

            allSynonyms.push(...parsedData.synonyms);

            senses.push({
              number: senseNumber,
              definition: parsedData.definition,
              examples: parsedData.examples,
              usagePatterns: parsedData.usagePatterns.length > 0 ? parsedData.usagePatterns : undefined
            });
          }
        });
      }

      processedEntries.push({
        word: entry.hwi.hw.replace(/\*/g, ""),
        partOfSpeech: entry.fl || "",
        pronunciations: entry.hwi.prs || [],
        audioUrl,
        senses
      });

      if (entry.dros) {
        phrases.push(...extractPhrases(entry.dros));
      }
    });

    return {
      entries: processedEntries,
      phrases: phrases.length > 0 ? phrases : undefined,
      synonyms: [...new Set(allSynonyms)]
    };
  };

  const searchWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) {
      setError(apiKey ? "Enter a word to search" : "API key not configured");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDictionaryData(null);

    try {
      const response = await fetch(
        `https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(
          input.trim()
        )}?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: DictionaryApiResponse = await response.json();

      // Handle case where no exact matches found
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
        setError(`No exact match found. Did you mean: ${data.slice(0, 5).join(", ")}?`);
        return;
      }

      // Handle successful dictionary entry response
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
        const processedData = parseDictionaryResponse(data as DictionaryEntry[]);
        setDictionaryData(processedData);
      } else {
        setError("No definition found for this word.");
      }
    } catch (err) {
      console.error("Dictionary search error:", err);
      setError("Failed to fetch definition. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed:", err);
        setError("Audio playbook failed");
      });
    }
  };

  return (
    <div className={classes.dictionary_wrapper + " stack"}>
      <h5>Dictionary</h5>

      <form className={classes.search_container} onSubmit={searchWord}>
        <input
          className={classes.search_input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="…"
          disabled={isLoading}
          aria-label="Enter word to search in dictionary"
        />
        <button
          className="primary_button"
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Search dictionary"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      <div
        className={classes.results_window}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading && (
          <div className={classes.loading_message}>
            <p>Looking up definition…</p>
          </div>
        )}

        {error && (
          <MessageDisplay message={error} type="error" isPermanent={true} />
        )}

        {dictionaryData && !isLoading && (
          <div className={classes.definition_content}>
            {/* Multiple Entries (noun, verb, etc.) */}
            {dictionaryData.entries.map((entry, entryIndex) => (
              <div key={`${entry.word}-${entry.partOfSpeech}-${entryIndex}`}>
                {/* Word Header */}
                <div className={classes.word_header}>
                  <h5 className={classes.word_title}>{entry.word}</h5>
                  {entry.partOfSpeech && (
                    <span className={classes.part_of_speech}>
                      {entry.partOfSpeech}
                    </span>
                  )}
                </div>

                {/* Pronunciation Section */}
                {entry.pronunciations.length > 0 && (
                  <div className={classes.pronunciation_section}>
                    {entry.pronunciations[0].ipa && (
                      <span className={classes.pronunciation_text}>
                        /{entry.pronunciations[0].ipa}/
                      </span>
                    )}
                    {entry.audioUrl && (
                      <button
                        className={classes.audio_button}
                        onClick={() => playAudio(entry.audioUrl!)}
                        aria-label={`Play pronunciation of ${entry.word}`}
                      >
                        <PlayAudioIcon size="sm" />
                      </button>
                    )}
                  </div>
                )}

                <div className={classes.definitions_section}>
                  <h6>Definitions:</h6>
                  <ol className={classes.definitions_list}>
                    {entry.senses.map((sense, senseIndex) => (
                      <li key={`${sense.number}-${senseIndex}`} className={classes.definition_item}>
                        <div>
                          <strong>{sense.definition}</strong>

                          {sense.usagePatterns && sense.usagePatterns.length > 0 && (
                            <div className={classes.usage_patterns}>
                              <em>({sense.usagePatterns.join(", ")})</em>
                            </div>
                          )}

                          {sense.examples && sense.examples.length > 0 && (
                            <div className={classes.examples}>
                              {sense.examples.map((example, exampleIndex) => (
                                <div key={exampleIndex} className={classes.example_item}>
                                  <em>&quot;{example}&quot;</em>
                                </div>
                              ))}
                            </div>
                          )}

                          {sense.subSenses && sense.subSenses.length > 0 && (
                            <ol className={classes.sub_senses}>
                              {sense.subSenses.map((subSense, subIndex) => (
                                <li key={`${subSense.letter}-${subIndex}`} className={classes.sub_sense_item}>
                                  <strong>{subSense.letter}. {subSense.definition}</strong>

                                  {subSense.usagePatterns && subSense.usagePatterns.length > 0 && (
                                    <div className={classes.usage_patterns}>
                                      <em>({subSense.usagePatterns.join(", ")})</em>
                                    </div>
                                  )}

                                  {subSense.examples && subSense.examples.length > 0 && (
                                    <div className={classes.examples}>
                                      {subSense.examples.map((example, exampleIndex) => (
                                        <div key={exampleIndex} className={classes.example_item}>
                                          <em>&quot;{example}&quot;</em>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Separator between entries */}
                {entryIndex < dictionaryData.entries.length - 1 && (
                  <hr className={classes.entry_separator} />
                )}
              </div>
            ))}

            {/* Phrases & Idioms */}
            {dictionaryData.phrases && dictionaryData.phrases.length > 0 && (
              <div className={classes.phrases_section}>
                <h6>Phrases & Idioms:</h6>
                <ul className={classes.phrases_list}>
                  {dictionaryData.phrases.map((phrase, index) => (
                    <li key={index} className={classes.phrase_item}>
                      <strong>{phrase.phrase}</strong>: {phrase.definition}
                      {phrase.example && (
                        <div className={classes.phrase_example}>
                          <em>&quot;{phrase.example}&quot;</em>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Synonyms */}
            {dictionaryData.synonyms && dictionaryData.synonyms.length > 0 && (
              <div className={classes.synonyms_section}>
                <h6>Synonyms:</h6>
                <p className={classes.synonyms_list}>
                  {dictionaryData.synonyms.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}

        {!dictionaryData && !error && !isLoading && (
          <div className={classes.empty_state}>
            <p>Enter a word above to see its definition</p>
          </div>
        )}
      </div>

      {/* Hidden audio element for pronunciation */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}
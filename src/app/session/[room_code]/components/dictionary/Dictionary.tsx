"use client";

import { useState, useRef } from "react";
import MessageDisplay from "@/app/(main)/components/MessageDisplay";
import classes from "./Dictionary.module.css";
import { PlayAudioIcon } from "@/app/components/Icon";

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

interface Definition {
  sseq: Array<Array<Array<string | { dt: Array<Array<string>> }>>>;
}

interface DictionaryEntry {
  meta: {
    id: string;
  };
  hwi: HeadwordInfo;
  fl?: string; // Function label (part of speech)
  shortdef?: string[];
  def?: Definition[];
}

type DictionaryResponse = DictionaryEntry[] | string[];

interface DictionaryData {
  word: string;
  pronunciations: Pronunciation[];
  partOfSpeech?: string;
  definitions: string[];
  audioUrl?: string;
}

// Utility function to clean HTML tags from text
const stripHtml = (html: string): string => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  } catch {
    // Fallback regex if DOMParser fails
    return html.replace(/<[^>]*>/g, "");
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

export default function Dictionary() {
  const [input, setInput] = useState("");
  const [dictionaryData, setDictionaryData] = useState<DictionaryData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_MERRIAM_WEBSTER_API_KEY;

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

      const data: DictionaryResponse = await response.json();

      // Handle case where no exact matches found
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        typeof data[0] === "string"
      ) {
        setError(
          `No exact match found. Did you mean: ${data.slice(0, 5).join(", ")}?`
        );
        return;
      }

      // Handle successful dictionary entry response
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        typeof data[0] === "object"
      ) {
        const entry = data[0] as DictionaryEntry;

        const definitions: string[] = [];

        // Try shortdef first (simpler)
        if (entry.shortdef && entry.shortdef.length > 0) {
          definitions.push(...entry.shortdef.map((def) => stripHtml(def)));
        }

        // If no shortdef, try to extract from full definitions
        if (definitions.length === 0 && entry.def && entry.def.length > 0) {
          entry.def.forEach((defGroup) => {
            defGroup.sseq.forEach((senseSeq) => {
              senseSeq.forEach((sense) => {
                if (
                  Array.isArray(sense) &&
                  sense.length > 1 &&
                  typeof sense[1] === "object"
                ) {
                  const senseObj = sense[1] as { dt?: Array<Array<string>> };
                  if (senseObj.dt) {
                    senseObj.dt.forEach((dtItem) => {
                      if (dtItem[0] === "text" && dtItem[1]) {
                        const cleanDef = stripHtml(dtItem[1])
                          .replace(/^\{bc\}/, "")
                          .trim();
                        if (cleanDef) {
                          definitions.push(cleanDef);
                        }
                      }
                    });
                  }
                }
              });
            });
          });
        }

        // Construct audio URL if available
        let audioUrl: string | undefined;
        if (entry.hwi.prs && entry.hwi.prs[0]?.sound?.audio) {
          audioUrl = constructAudioUrl(entry.hwi.prs[0].sound.audio);
        }

        setDictionaryData({
          word: entry.hwi.hw.replace(/\*/g, ""), // Replace asterisks with nothingnessss
          pronunciations: entry.hwi.prs || [],
          partOfSpeech: entry.fl,
          definitions:
            definitions.length > 0 ? definitions : ["No definition available"],
          audioUrl,
        });
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

  const playAudio = () => {
    if (dictionaryData?.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = dictionaryData.audioUrl;
        audioRef.current.play().catch((err) => {
          console.error("Audio playback failed:", err);
          setError("Audio playback failed");
        });
      }
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
            {/* Word and Pronunciation */}
            <div className={classes.word_header}>
              <h5 className={classes.word_title}>{dictionaryData.word}</h5>
              {dictionaryData.partOfSpeech && (
                <span className={classes.part_of_speech}>
                  {dictionaryData.partOfSpeech}
                </span>
              )}
            </div>

            {dictionaryData.pronunciations.length > 0 && (
              <div className={classes.pronunciation_section}>
                {dictionaryData.pronunciations[0].ipa && (
                  <span className={classes.pronunciation_text}>
                    /{dictionaryData.pronunciations[0].ipa}/
                  </span>
                )}
                {dictionaryData.audioUrl && (
                  <button
                    className={classes.audio_button}
                    onClick={playAudio}
                    aria-label={`Play pronunciation of ${dictionaryData.word}`}
                  >
                    {" "}
                    <PlayAudioIcon size="sm" />
                  </button>
                )}
              </div>
            )}

            <div className={classes.definitions_section}>
              <h6>Definitions:</h6>
              <ol className={classes.definitions_list}>
                {dictionaryData.definitions.map((definition, index) => (
                  <li key={index} className={classes.definition_item}>
                    {definition}
                  </li>
                ))}
              </ol>
            </div>
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

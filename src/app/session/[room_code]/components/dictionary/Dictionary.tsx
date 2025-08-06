"use client";

import { useState, useRef } from "react";
import MessageDisplay from "@/app/(main)/components/MessageDisplay";
import classes from "./Dictionary.module.css";
import { PlayAudioIcon } from "@/app/components/Icon";
import { parseDictionaryResponse } from "./utils/dictionaryParser";

import type {
  DictionaryApiResponse,
  DictionaryEntry,
  ProcessedDictionaryData,
} from "./types";

export default function Dictionary() {
  const [input, setInput] = useState("");
  const [dictionaryData, setDictionaryData] =
    useState<ProcessedDictionaryData | null>(null);
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

      const data: DictionaryApiResponse = await response.json();

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

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        typeof data[0] === "object"
      ) {
        const processedData = parseDictionaryResponse(
          data as DictionaryEntry[]
        );
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
            {dictionaryData.entries.map((entry, entryIndex) => (
              <div key={`${entry.word}-${entry.partOfSpeech}-${entryIndex}`}>
                <div className={classes.word_header}>
                  <h5>{entry.word}</h5>
                  {entry.partOfSpeech && (
                    <span className={classes.part_of_speech}>
                      {entry.partOfSpeech}
                    </span>
                  )}
                </div>

                {entry.pronunciations.length > 0 && (
                  <div className={classes.pronunciation_section}>
                    {entry.pronunciations[0].ipa && (
                      <span>/{entry.pronunciations[0].ipa}/</span>
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
                      <li
                        key={`${sense.number}-${senseIndex}`}
                        className={classes.definition_item}
                      >
                        <div>
                          <p>{sense.definition}</p>

                          {sense.usagePatterns &&
                            sense.usagePatterns.length > 0 && (
                              <div>
                                <span>({sense.usagePatterns.join(", ")})</span>
                              </div>
                            )}

                          {sense.examples && sense.examples.length > 0 && (
                            <div className={classes.examples}>
                              {sense.examples.map((example, exampleIndex) => (
                                <div
                                  key={exampleIndex}
                                  className={classes.example_item}
                                >
                                  <span>&quot;{example}&quot;</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {sense.subSenses && sense.subSenses.length > 0 && (
                            <ol className={classes.sub_senses}>
                              {sense.subSenses.map((subSense, subIndex) => (
                                <li
                                  key={`${subSense.letter}-${subIndex}`}
                                  className={classes.sub_sense_item}
                                >
                                  <strong>
                                    {subSense.letter}. {subSense.definition}
                                  </strong>

                                  {subSense.usagePatterns &&
                                    subSense.usagePatterns.length > 0 && (
                                      <div className={classes.usage_patterns}>
                                        <span>
                                          ({subSense.usagePatterns.join(", ")})
                                        </span>
                                      </div>
                                    )}

                                  {subSense.examples &&
                                    subSense.examples.length > 0 && (
                                      <div className={classes.examples}>
                                        {subSense.examples.map(
                                          (example, exampleIndex) => (
                                            <div
                                              key={exampleIndex}
                                              className={classes.example_item}
                                            >
                                              <span>&quot;{example}&quot;</span>
                                            </div>
                                          )
                                        )}
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

                {entryIndex < dictionaryData.entries.length - 1 && (
                  <hr className={classes.entry_separator} />
                )}
              </div>
            ))}

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
            <span>Enter a word above to see its definition</span>
          </div>
        )}
      </div>

      {/* Hidden audio element for pronunciation */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}

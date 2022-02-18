import * as React from "react";
import { useEffect, useState } from "react";
import Suggestion from "./Suggestion";

import { retext } from "retext";
import retextIndefiniteArticle from "retext-indefinite-article";
import retextRepeatedWords from "retext-repeated-words";
import retextStringify from "retext-stringify";
import retextReadability from "retext-readability";
import retextSentenceSpacing from "retext-sentence-spacing";
import retextPassive from "retext-passive";
import retextContractions from "retext-contractions";
import retextEquality from "retext-equality";
import retextSpell from "retext-spell";
// @ts-ignore
import retextUseContractions from "retext-use-contractions";
// @ts-ignore
import retextCapitalization from "retext-capitalization";
// @ts-ignore
import retextNoEmojis from "retext-no-emojis";
import en_us_aff from "./en_aff.js";
import en_us_dic from "./en_dic.js";
import { dictionaryContents as personalDictionary } from "./personalDictionary";
// @ts-ignore
import spinner from "./images/tail-spin.svg"
import type * as types from "../custom-types"

import "./Components.css";

console.log('Im a blessing');

export function lintMyText(textToBeLinted: string, customLocalDictionary: string[]) {
  let customDictionary = personalDictionary

  if (!customLocalDictionary) {
    if (window?.localStorage?.languageLinterCustomDictionary) {
      customLocalDictionary = JSON.parse(window.localStorage?.languageLinterCustomDictionary)
    } else {
      customLocalDictionary = []
    }
  }
    
  customDictionary.push(...customLocalDictionary)

  const retextSpellOptions = {
    dictionary: (callback: any) => {
      callback(null, {
        aff: en_us_aff,
        dic: en_us_dic,
      });
    },
    personal: customDictionary.join('\n'),
    max: 5,
  };

  return retext()
    .use(retextContractions)
    .use(retextSpell, retextSpellOptions)
    // It's important to use retextRepeatedWords _before_
    // retextIndefiniteArticle. See why:
    // https://github.com/newrelic/new-relic-language-linter/issues/2
    .use(retextRepeatedWords)
    .use(retextIndefiniteArticle)
    .use(retextEquality)
    .use(retextUseContractions)
    .use(retextCapitalization)
    .use(retextNoEmojis)
    .use(retextReadability, { age: 19 })
    .use(retextSentenceSpacing)
    .use(retextPassive)
    .use(retextStringify)
    .process(textToBeLinted)
    .then((report) => {
      console.log(report);
      return(report)
    });
}

export interface props {
  sampleText: string,
  placeholder: string,
  setSampleText: () => void,
  updateTimer: number,
  customDictionary: string[],
  addToDictionary: () => string[]
}

function LanguageLinter(props: props) {
  const [report, setReport] = useState<types.report>();
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Array<string>>(['']);
  const [textareaChangeTimer, setTextareaChangeTimer] = useState(0);
  const [loadingResultsTimer, setLoadingResultsTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const { 
    sampleText, 
    setSampleText, 
    updateTimer = 300,
    placeholder = 'Provide some text to get started',
    customDictionary, 
    addToDictionary,
  } = props;

  useEffect(() => {
    setTextareaChangeTimer(
      window.setTimeout(async () => {
        setReport(await lintMyText(sampleText, customDictionary) as any)
      }, updateTimer)
    );

    return () => clearTimeout(textareaChangeTimer);
  }, [sampleText]);

  useEffect(() => {
    setIsLoading(true)

    setLoadingResultsTimer(
      window.setTimeout(async () => {
        setIsLoading(false)
      }, 4000)
    );

    return () => clearTimeout(loadingResultsTimer);
  }, [sampleText]);

  const renderReport = () => {
    if (suggestionsAvailable()) {
      return report?.messages.map((suggestion, index) => {
        return (
          <Suggestion
            key={index}
            suggestion={suggestion}
            sourceText={report?.value}
            sampleText={sampleText}
            setSampleText={setSampleText}
            removeSuggestion={removeSuggestion}
            dismissedSuggestions={dismissedSuggestions}
            isActive={index === activeSuggestionIndex}
            onClick={() => handleSuggestionClick(index)}
            addToDictionary={addToDictionary ?? defaultAddToDictionary}
          />
        );
      });
    } else {
      return <h4>No suggestions to show...</h4>
    }
  };

  const removeSuggestion = (suggestionId: string) => {
    let newReport = { ...report };
    // remove it from the report
    newReport.messages = report?.messages.filter(
      (suggestion) => suggestion.name !== suggestionId
    );

    setReport(newReport as types.report);
    let newDismissedSuggestions: string[] = [...dismissedSuggestions];
    newDismissedSuggestions.push(suggestionId);

    // This way it stays hidden even after relint
    setDismissedSuggestions(newDismissedSuggestions);
  };

  const handleSuggestionClick = (index: number) => {
    setActiveSuggestionIndex(index)
  }

  const availableSuggestionsHidden = () => {
    let output = false

    if (suggestionsAvailable()) {
      // for every suggestion
      report?.messages.forEach((message) => {
        // does it's id match any of the dismissed suggestions
        dismissedSuggestions.some(dismissedSuggestion => {
          dismissedSuggestion !== message.name
          output = true
        })
      })

      return output
    }
  }

  const defaultAddToDictionary = (wordToAdd: string, suggestionId: string) => {
    let languageLinterCustomDictionary = window.localStorage?.languageLinterCustomDictionary

    // if the local storage variable already exists
    if (languageLinterCustomDictionary) {
      let tempDictionaryStorage = JSON.parse(window.localStorage.languageLinterCustomDictionary)

      tempDictionaryStorage.push(wordToAdd)
      window.localStorage.setItem('languageLinterCustomDictionary', JSON.stringify(tempDictionaryStorage))
    } else {
      // if not
      window.localStorage.setItem('languageLinterCustomDictionary', JSON.stringify([wordToAdd]))
    }

    removeSuggestion(suggestionId)
  }

  const renderPlaceholder = () => {
    const sampleTextProvided = sampleText !== ''

    if (!sampleTextProvided) {
      return(
        <h3 className="empty-state-heading">
         {placeholder}
        </h3>
      )
    } else if (isLoading) {
      return(<img className="loading-spinner" src={spinner} alt="loading..." />)
    } else if ((sampleTextProvided && !suggestionsAvailable()) || (availableSuggestionsHidden() && sampleTextProvided)) {
      return(
        <>
          <h3 className="empty-state-heading">
           No issues found
          </h3>
          <p className="empty-state-description">
            We ran several checks on your text and found no writing issues.
            Think we missed something? {` `}
            <a href="https://newrelic.slack.com/archives/C01A76P3DPU">Let us know</a>.
          </p>
        </>
      )
    }
  }

  const suggestionsAvailable = ():boolean => {
    const suggestionsCount = report?.messages?.length ?? 0
    return suggestionsCount > 0
  }

  return (
    <>
      {availableSuggestionsHidden()}
      {suggestionsAvailable() ? (
        <ul className="suggestion-list">{renderReport()}</ul>
      ) : (
        <div className="suggestions-empty-state">
          {renderPlaceholder()}
        </div>
      )}
    </>
  );
}

export default LanguageLinter;

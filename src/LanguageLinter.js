import * as React from "react";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
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
import retextUseContractions from "retext-use-contractions";
import retextPos from "retext-pos";
import retextCapitalization from "retext-capitalization";
import retextNoEmojis from "retext-no-emojis";
import en_us_aff from "./en_aff.js";
import en_us_dic from "./en_dic.js";
import { dictionaryContents as personalDictionary } from "./personalDictionary";
import spinner from "./images/tail-spin.svg";

import "./Components.css";

export function lintMyText(textToBeLinted, customLocalDictionary) {
  let customDictionary = personalDictionary;

  if (!customLocalDictionary) {
    if (window?.localStorage?.languageLinterCustomDictionary) {
      customLocalDictionary = JSON.parse(
        window.localStorage?.languageLinterCustomDictionary
      );
    } else {
      customLocalDictionary = [];
    }
  }

  customDictionary.push(...customLocalDictionary);

  const retextSpellOptions = {
    dictionary: (callback) => {
      callback(null, {
        aff: en_us_aff,
        dic: en_us_dic,
      });
    },
    personal: customDictionary.join("\n"),
    max: 5,
    ignoreDigits: true
  };

  const retextEqualityOptions = {
    ignore: ["disabled", "host", "hosts", "invalid", "just", "special"],
  };

  let output = "untouched";

  return (
    retext()
    .use(retextSpell, retextSpellOptions)
    // It's important to use retextRepeatedWords _before_
    // retextIndefiniteArticle. See why:
    // https://github.com/newrelic/new-relic-language-linter/issues/2
    .use(retextRepeatedWords)
    .use(retextIndefiniteArticle)
    .use(retextEquality, retextEqualityOptions)
    .use(retextUseContractions)
    .use(retextPos)
    .use(retextCapitalization)
    .use(retextNoEmojis)
    .use(retextReadability, { age: 16 })
    .use(retextSentenceSpacing)
    .use(retextPassive)
    .use(retextContractions)
    .use(retextStringify)
      .process(textToBeLinted)
      .then((report) => {
        output = report;
        return report;
      })
  );
}

function LanguageLinter(props) {
  const [report, setReport] = useState({});
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);
  const [textareaChangeTimer, setTextareaChangeTimer] = useState();
  const [loadingResultsTimer, setLoadingResultsTimer] = useState();
  const [isLoading, setIsLoading] = useState();
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const {
    sampleText,
    setSampleText,
    updateTimer = 300,
    placeholder = "Provide some text to get started",
    customDictionary,
    addToDictionary,
    openLinksInNewTab = false,
    loadingStateListener,
  } = props;

  useEffect(() => {
    setTextareaChangeTimer(
      setTimeout(async () => {
        setReport(await lintMyText(sampleText, customDictionary));
      }, updateTimer)
    );

    return () => clearTimeout(textareaChangeTimer);
  }, [sampleText]);

  useEffect(() => {
    if (report?.messages?.length > 0) {
      const suggestionCount = report.messages.length

      function handleKeyDown(e) {
        if (e.key === "ArrowDown") {
          setActiveSuggestionIndex((prevState) => {
            if (prevState < suggestionCount - 1) {
              return prevState + 1
            }
            
            return prevState;
          })
        } else if (e.key === 'ArrowUp') {
          setActiveSuggestionIndex((prevState) => {
            if (prevState > 0) {
              return prevState - 1
            }
  
            return prevState;
          })
        }
      }
  
      document.addEventListener('keydown', handleKeyDown);
  
      // Don't forget to clean up
      return function cleanup() {
        document.removeEventListener('keydown', handleKeyDown);
      }
    }
  }, [report]);

  useEffect(() => {
    setIsLoading(true);
    if (loadingStateListener) loadingStateListener(true);

    setLoadingResultsTimer(
      setTimeout(async () => {
        setIsLoading(false);
        if (loadingStateListener) loadingStateListener(false);
      }, 4000)
    );

    return () => clearTimeout(loadingResultsTimer);
  }, [sampleText]);

  const renderReport = () => {
    if (report?.messages?.length > 0) {
      if (loadingStateListener) loadingStateListener(false);
      return report.messages.map((suggestion, index) => {
        return (
          <Suggestion
            key={index}
            suggestion={suggestion}
            sourceText={report.value}
            sampleText={sampleText}
            setSampleText={setSampleText}
            removeSuggestion={removeSuggestion}
            dismissedSuggestions={dismissedSuggestions}
            isActive={index === activeSuggestionIndex}
            onClick={() => handleSuggestionClick(index)}
            addToDictionary={
              addToDictionary ? addToDictionary : defaultAddToDictionary
            }
            openLinksInNewTab={openLinksInNewTab}
          />
        );
      });
    } else {
      return <h4>No suggestions to show...</h4>;
    }
  };

  const removeSuggestion = (suggestionId) => {
    let newReport = { ...report };
    // remove it from the report
    newReport.messages = report.messages.filter(
      (suggestion) => suggestion.name !== suggestionId
    );

    setReport(newReport);
    let newDismissedSuggestions = [...dismissedSuggestions];
    newDismissedSuggestions.push(suggestionId);

    // This way it stays hidden even after relint
    setDismissedSuggestions(newDismissedSuggestions);
  };

  const handleSuggestionClick = (index) => {
    setActiveSuggestionIndex(index);
  };

  const availableSuggestionsHidden = () => {
    const suggestionsAvailable = report?.messages?.length > 0;
    let output = false;

    if (suggestionsAvailable) {
      // for every suggestion
      report.messages.forEach((message) => {
        // does it's id match any of the dismissed suggestions
        dismissedSuggestions.some((dismissedSuggestion) => {
          dismissedSuggestion !== message.name;
          output = true;
        });
      });

      return output;
    }
  };

  const defaultAddToDictionary = (wordToAdd, suggestionId) => {
    let languageLinterCustomDictionary =
      window.localStorage?.languageLinterCustomDictionary;

    // if the local storage variable already exists
    if (languageLinterCustomDictionary) {
      let tempDictionaryStorage = JSON.parse(
        window.localStorage.languageLinterCustomDictionary
      );

      tempDictionaryStorage.push(wordToAdd);
      window.localStorage.setItem(
        "languageLinterCustomDictionary",
        JSON.stringify(tempDictionaryStorage)
      );
    } else {
      // if not
      window.localStorage.setItem(
        "languageLinterCustomDictionary",
        JSON.stringify([wordToAdd])
      );
    }

    removeSuggestion(suggestionId);
  };

  const renderPlaceholder = () => {
    const sampleTextProvided = sampleText !== "";
    const suggestionsAvailable = report?.messages?.length > 0;

    if (!sampleTextProvided) {
      return <h3 className="empty-state-heading">{placeholder}</h3>;
    } else if (isLoading) {
      return <img className="loading-spinner" src={spinner} alt="loading..." />;
    } else if (
      (sampleTextProvided && !suggestionsAvailable) ||
      (availableSuggestionsHidden() && sampleTextProvided)
    ) {
      return (
        <>
          <h3 className="empty-state-heading">No issues found</h3>
          <p className="empty-state-description">
            We ran several checks on your text and found no writing issues.
            Think we missed something? {` `}
            <a
              href="https://newrelic.slack.com/archives/C01A76P3DPU"
              target={openLinksInNewTab ? "_blank" : "_self"}
            >
              Let us know
            </a>
            .
          </p>
        </>
      );
    }
  };

  return (
    <>
      {availableSuggestionsHidden()}
      {report?.messages?.length > 0 ? (
        <ul
          className="suggestion-list"
        >
          {renderReport()}
        </ul>
      ) : (
        <div className="suggestions-empty-state">{renderPlaceholder()}</div>
      )}
    </>
  );
}

LanguageLinter.propTypes = {
  sampleText: PropTypes.string,
  placeholder: PropTypes.string,
  setSampleText: PropTypes.func,
  updateTimer: PropTypes.number,
  customDictionary: PropTypes.array,
  addToDictionary: PropTypes.func,
  openLinksInNewTab: PropTypes.bool,
  loadingStateListener: PropTypes.func,
};

export default LanguageLinter;

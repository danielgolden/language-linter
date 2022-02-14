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
import retextCapitalization from "retext-capitalization";
import retextNoEmojis from "retext-no-emojis";
import en_us_aff from "./en_aff.js";
import en_us_dic from "./en_dic.js";
import { dictionaryContents as personalDictionary } from "./personalDictionary";

import "./Components.css";

export function lintMyText(textToBeLinted) {
  const retextSpellOptions = {
    dictionary: (callback) => {
      callback(null, {
        aff: en_us_aff,
        dic: en_us_dic,
      });
    },
    personal: personalDictionary.join("\n"),
    max: 5,
  };

  let output = 'untouched'

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
      output = report
      return(report)
    });
}

function LanguageLinter(props) {
  const [report, setReport] = useState({});
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);
  const [textareaChangeTimer, setTextareaChangeTimer] = useState();
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const { 
    sampleText, 
    setSampleText, 
    updateTimer = 300,
    placeholder = 'Provide some text to get started'
  } = props;

  useEffect(() => {
    setTextareaChangeTimer(
      setTimeout(async () => {
        setReport(await lintMyText(sampleText))
      }, updateTimer)
    );

    return () => clearTimeout(textareaChangeTimer);
  }, [sampleText]);

  const renderReport = () => {
    if (report?.messages?.length > 0) {
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
          />
        );
      });
    } else {
      return <h4>No suggestions to show...</h4>
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
    setActiveSuggestionIndex(index)
  }

  const renderPlaceholder = () => {
    const sampleTextProvided = sampleText !== ''
    const suggestionsAvailable = report?.messages?.length > 0

    if (!sampleTextProvided) {
      return(
        <h3 className="empty-state-heading">
         {placeholder}
        </h3>
      )
    } else if (sampleTextProvided && !suggestionsAvailable) {
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

  return (
    <>
      {report?.messages?.length > 0 ? (
        <ul className="suggestion-list">{renderReport()}</ul>
      ) : (
        <div className="suggestions-empty-state">
          {renderPlaceholder()}
        </div>
      )}
    </>
  );
}

LanguageLinter.propTypes = {
  sampleText: PropTypes.string,
  placeholder: PropTypes.string,
  setSampleText: PropTypes.func,
  updateTimer: PropTypes.number,
};

export default LanguageLinter;

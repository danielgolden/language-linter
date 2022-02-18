import { useState } from 'react'
import logo from './logo.svg'
import LanguageLinter, { lintMyText } from 'new-relic-language-linter/lib/LanguageLinter.js'
import './App.css'

function App() {
  const [sampleText, setSampleText] = useState('This is the greatest I am I dog New Relic I/O');
  const [blessed, setBlessed] = useState('');

  const handleTextAreaOnChange = (event) => {
    setSampleText(event.target.value);
  };

  const asyncFilter = async (arr, callback) => {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
  }

  const getTextLayersWithSuggestions = async () => {
    const results = await asyncFilter(sampleTextExamples, async item => {
      let report = 'untouched'
      await Promise.resolve(lintMyText(item)).then(result => report = result)
      return !!report.messages[0]?.message
    })

    console.log(results);
  }

  const myAddToDictionary = (wordToAdd, suggestionId) => {
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
  }

  const customDictionary = () => {
    if (window?.localStorage?.languageLinterCustomDictionary) {
      return JSON.parse(window.localStorage?.languageLinterCustomDictionary)
    } else {
      return []
    }
  }

  return (
    <div className="App">
      <textarea 
        onChange={(e) => handleTextAreaOnChange(e)}  
        value={sampleText}
      />

      <LanguageLinter 
        sampleText={sampleText} 
        setSampleText={setSampleText} 
        placeholder={"Enter some text to get started"}
        // addToDictionary={myAddToDictionary}
      />
    </div>
  )
}

export default App

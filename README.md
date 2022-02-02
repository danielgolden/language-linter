# New Relic Language Linter
A natural language linter React component. See it in action in [this project](https://github.com/newrelic/new-relic-language-linter)

### Install
`npm i new-relic-language-linter`

### Props
- `sampleText` (string): The text to be linted. Every time this is updated, the linter will provide feedback on it.
- `setSampleText` (func): A function that will update update your sample text.
- `updateTimer` (number): The amount of time (in milliseconds) that the linter should wait before relinting the `sampleText` after it's been updated.
# New Relic Language Linter
A natural language linter React component. See it in action in [this project](https://github.com/newrelic/new-relic-language-linter).

### Install
```
npm i new-relic-language-linter
```

### Props
- `sampleText` (string): The text to be linted. Every time this is updated, the linter will provide feedback on it.
- `setSampleText` (func): A function that will update update your sample text.
- `updateTimer` (number): The amount of time (in milliseconds) that the linter should wait before relinting the `sampleText` after it's been updated.

### Video preview
A preview of the package in action in a Figma plugin and on the web
https://user-images.githubusercontent.com/812989/182592615-7546f2b0-bd7d-4a6f-9a64-8d6eceb3810d.mp4


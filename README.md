# Algolia Combinatory Match

> An Algolia tool to match and get known entities in your query

## Installation

* `> npm install -S algolia-combinatory-match` OR
* `> yarn add algolia-combinatory-match`

## Usage

```js
import AlgoliaCombinatoryMatch from '../src/index';

const algoliaCombinatoryMatch = new AlgoliaCombinatoryMatch(
  'APP_ID',
  'API_KEY',
  [
    { name: 'indexName1', attribute: 'attributeName1' },
    { name: 'indexName2', attribute: 'attributeName2' },
  ]
);

async function main() {
  const result = await algoliaCombinatoryMatch.run(
    'find an american restaurant in manhattan'
  );
}
``

The `result` will be an object of this format:

```js
{
  results: [ [], [] ],
  matches: [
    { hit: [Object], index: 'cuisines', matchedWords: 'american' },
    { hit: [Object], index: 'boroughs', matchedWords: 'manhattan' }
  ]
}
```

With
* `results` the search results of `indexName1` and `indexName2`
* `matches` the detect entities in the query

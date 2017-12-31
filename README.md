# Algolia Combinatory Match

> An Algolia tool to match and get known entities in your query

## Installation

* `> npm install -S algolia-combinatory-match` OR
* `> yarn add algolia-combinatory-match`

## Usage

```js
import AlgoliaCombinatoryMatch from 'algolia-combinatory-match';

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
```

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

## Documentation

### `AlgoliaCombinatoryMatch(appId: string, apiKey: string, indices: Array<{ name: string, attribute: string }>)`

Create a new `AlgoliaCombinatoryMatch` instance.

All the following methods should be used on this instance.

### `run(query: string, check: ?(string, any) => boolean)`

Run the combinator. `check` is a optional function that will decide whether the combination `string` should match the hit `any`. By default, it will match if `hit._highlightResult[this.attribute].fullyHighlighted` is true.

### `expandStopWords(stopWords: Array<string>)`

Expand the default english language stopwords list.

### `setStopWords(stopWords: Array<string>)`

Set a new stopwords list instead of the default english language one.

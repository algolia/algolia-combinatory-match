/* @flow */

import algoliasearch from 'algoliasearch';
import stopWords from './stopwords';
import AlgoliaCombinator from './combinator';

type Match = {
  hit: any,
  index: string,
  matchedWords: string,
};

type Index = {
  name: string,
  index: algoliasearch.AlgoliaIndex,
  results: Array<any>,
  combinator: AlgoliaCombinator,
};

class AlgoliaCombinatoryMatch {
  indices: Array<Index>;
  matches: Array<Match>;

  constructor(appId: string, apiKey: string, indices: Array<any>) {
    const client = algoliasearch(appId, apiKey);
    this.matches = [];
    this.indices = indices.map(index => ({
      name: index.name,
      index: client.initIndex(index.name),
      combinator: new AlgoliaCombinator(client, index.name, index.attribute),
      results: [],
    }));
  }

  async search(index: algoliasearch.AlgoliaIndex, query: string): Promise<any> {
    const existingMatch = this.matches.find(match => match.index === index);
    if (existingMatch) {
      query = `${existingMatch.value} ${query}`;
    }
    const content = await index.search(query);
    return content.hits;
  }

  async getResults(query: string) {
    for (const index of this.indices) {
      index.results = await this.search(index.index, query);
    }
  }

  async getMatches(query: string) {
    if (query !== '') {
      for (const index of this.indices) {
        const data = await index.combinator.run(query);
        if (data) {
          this.addMatch(data.hit, index.name, data.matchedWords);
        }
      }
    } else {
      this.matches = [];
    }
  }

  async run(
    query: string
  ): Promise<{ results: Array<any>, matches: Array<Match> }> {
    this.matches = [];
    query = query.toLowerCase();
    await this.getMatches(query);
    query = this.removeMatchedWords(query);
    query = this.removeStopWords(query);
    await this.getResults(query);
    return {
      results: this.indices.map(index => index.results),
      matches: this.matches,
    };
  }

  addMatch(hit: any, index: string, matchedWords: string) {
    this.matches.push({
      hit,
      index,
      matchedWords,
    });
  }

  removeStopWords(string: string): string {
    const queryWords = string.split(' ');
    const finalString = [];
    for (let i = 0; i < queryWords.length - 1; ++i) {
      if (stopWords.indexOf(queryWords[i]) !== -1) continue;
      finalString.push(queryWords[i]);
    }
    finalString.push(queryWords[queryWords.length - 1]);
    return finalString.join(' ');
  }

  removeMatchedWords(string: string): string {
    const matchedWordsArray = this.matches.map(match => match.matchedWords);
    let finalString = string;
    for (const matchedWords of matchedWordsArray) {
      finalString = finalString.replace(matchedWords, '');
    }
    return finalString;
  }
}

export default AlgoliaCombinatoryMatch;

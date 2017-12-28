/* @flow */

import algoliasearch from 'algoliasearch';
import stopWords from './stopwords';
import Combinator from './combinator';

type Match = {
  hit: any,
  index: string,
  matchedWords: string,
};

type Index = {
  index: algoliasearch.AlgoliaIndex,
  results: Array<any>,
  combinator: Combinator,
};

class AlgoliaCombinatoryMatch {
  indices: Array<Index>;
  matches: Array<Match>;

  constructor(
    appId: string,
    apiKey: string,
    matches: Array<Match>,
    indices: Array<any>
  ) {
    const client = algoliasearch(appId, apiKey);
    this.matches = matches;
    this.indices = indices.map(index => ({
      index: client.initIndex(index.name),
      combinator: new Combinator(client, index.name, index.attribute),
      results: [],
    }));
  }

  checkExistingMatchs(category: string) {
    return this.matches.some(match => match.category === category);
  }

  computeContext(facet) {
    return this.matches
      .map(match => {
        if (match.context && match.context.length > 0) {
          return match.context.map(code => `${facet}:${code}`).join(' OR ');
        }
      })
      .filter(match => match !== undefined)
      .join(' OR ');
  }

  async searchEtab(query) {
    const context = this.computeContext('rubriques');
    const options = {
      query,
      filters: context,
      aroundRadius: 10000,
    };
    const ouMatch = this.matches.find(match => match.category === 'ou');
    if (ouMatch) {
      const geoloc = ouMatch.hit._geoloc;
      options.aroundLatLng = `${geoloc.lat}, ${geoloc.lng}`;
    } else {
      options.aroundLatLngViaIP = true;
    }
    const content = await this.etabPubIndex.search(options);
    return content.hits;
  }

  async searchOu(query) {
    if (this.checkExistingMatchs('ou')) {
      query = `${this.matches.find(match => match.category === 'ou').value} ${query}`;
    }
    const content = await this.ouIndex.search(query);
    const addresses = this.processAddresses(query, content.hits);
    return addresses;
  }

  async searchQuoi(query) {
    if (this.checkExistingMatchs('quoi')) {
      query = `${
        this.matches.find(match => match.category === 'quoi').value
      } ${query}`;
    }
    const content = await this.quiQuoiIndex.search(query);
    return content.hits;
  }

  async process(query) {
    query = query.toLowerCase();
    const data = await Promise.all([
      this.searchEtab(query),
      this.searchOu(query),
      this.searchQuoi(query),
    ]);
    this.clearResults();
    if (data[0]) {
      fillArray(this.suggestionResults, data[0]);
    }
    if (data[1]) {
      fillArray(this.ouResults, data[1]);
    }
    if (data[2]) {
      fillArray(this.quoiResults, data[2]);
    }
  }

  async analyzeOu(query) {
    const data = await this.ouAnalyzer.analyze(query, this.checkAddress);
    if (data) {
      this.potentialOuMatch = data.hit.libelle.toLowerCase();
    }
    return data;
  }

  checkOuMatch(matchedString) {
    if (this.potentialOuMatch === '') {
      return false;
    } else {
      return (
        matchedString.includes(this.potentialOuMatch) ||
        this.potentialOuMatch.includes(matchedString)
      );
    }
  }

  async analyzeQuoi(query) {
    const data = await this.quoiAnalyzer.analyze(
      query,
      (query, hit) =>
        query
          .split(' ')
          .map(word => !this.checkOuMatch(word))
          .find(elt => elt === false) !== false &&
        hit._highlightResult.search01.fullyHighlighted
    );
    return data;
  }

  async analyze(query) {
    query = query.toLowerCase();
    if (query !== '') {
      const ouData = await this.analyzeOu(query);
      const quoiData = await this.analyzeQuoi(query);
      clearArray(this.matches);
      if (quoiData) {
        this.addMatch(quoiData.matchedWords, quoiData.hit, 'quoi');
      }
      if (ouData) {
        this.addMatch(
          ouData.matchedWords,
          { ...ouData.hit, _rubriques: [] },
          'ou'
        );
      }
    } else {
      clearArray(this.matches);
    }
  }

  async run(query) {
    await this.analyze(query);
    query = this.removeMatchedWords(query);
    query = this.removeStopWords(query);
    this.matches = [];
    await this.process(query);
    return {
      results: this.indices.map(index => index.results),
      matches: this.matches,
    };
  }

  addMatch(hit: any, index: string, matchedWords: string) {
    /* if (category === 'quoi') {
      filterArray(this.matches, 'category', 'quoi');
    }*/
    this.matches.push({
      hit,
      index,
      matchedWords,
    });
  }

  removeStopWords(string: string) {
    const queryWords = string.split(' ');
    const finalString = [];
    for (let i = 0; i < queryWords.length - 1; ++i) {
      if (stopWords.indexOf(queryWords[i]) !== -1) continue;
      finalString.push(queryWords[i]);
    }
    finalString.push(queryWords[queryWords.length - 1]);
    return finalString.join(' ');
  }

  removeMatchedWords(string: string) {
    const matchedWordsArray = this.matches.map(match => match.matchedWords);
    let finalString = string;
    for (const matchedWords of matchedWordsArray) {
      finalString = finalString.replace(matchedWords, '');
    }
    return finalString;
  }
}

export default AlgoliaCombinatoryMatch;

/* @flow */

export default class Combinator {
  client: any;
  indexName: string;
  attribute: string;

  constructor(client: any, indexName: string, attribute: string) {
    this.client = client;
    this.indexName = indexName;
    this.attribute = attribute;
  }

  getCombinations(query: string): Array<string> {
    const tokens = query.split(' ');
    const res = [];
    for (let i = 0; i < tokens.length; ++i) {
      res.push(tokens[i]);
      let accu = tokens[i];
      for (let j = i + 1; j < tokens.length; ++j) {
        accu += ` ${tokens[j]}`;
        res.push(accu);
      }
    }
    return res;
  }

  async run(query: string, check: (string, any) => boolean): Promise<any> {
    const combinations = this.getCombinations(query);
    const potentialMatches = [];
    const queries = combinations.map(combination => ({
      indexName: this.indexName,
      query: combination,
    }));
    const content = await this.client.search(queries);
    for (let i = 0; i < content.results.length; ++i) {
      const hits = content.results[i].hits;
      for (const hit of hits) {
        if (check(combinations[i], hit)) {
          potentialMatches.push({ matchedWords: combinations[i], hit });
        }
      }
    }
    if (potentialMatches.length > 0) {
      return potentialMatches.reduce(
        (prev, current) =>
          prev.hit[this.attribute].length > current.hit[this.attribute].length
            ? prev
            : current
      );
    }
    return undefined;
  }
}

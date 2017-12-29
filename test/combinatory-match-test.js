import AlgoliaCombinatoryMatch from '../src/index';

const algoliaCombinatoryMatch = new AlgoliaCombinatoryMatch(
  'testing4SO9ECO2EL',
  '0bad479262c056fd91e7642000fdeb0b',
  [
    { name: 'cuisines', attribute: 'cuisine' },
    { name: 'boroughs', attribute: 'borough' },
  ]
);

async function main() {
  const data = await algoliaCombinatoryMatch.run(
    'find an american restaurant in manhattan'
  );
  console.log(data)
}

main();

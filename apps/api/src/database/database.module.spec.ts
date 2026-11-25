import { uriHasDbName } from './database.module';

describe('uriHasDbName', () => {
  it.each([
    ['mongodb+srv://u:p@cluster.x.mongodb.net/hec_color_chill?retryWrites=true', true],
    ['mongodb://127.0.0.1:27017/', false],
    ['mongodb://127.0.0.1:27017', false],
    ['mongodb+srv://u:p@cluster.x.mongodb.net/?retryWrites=true', false],
  ])('%s -> %s', (uri, expected) => {
    expect(uriHasDbName(uri)).toBe(expected);
  });
});

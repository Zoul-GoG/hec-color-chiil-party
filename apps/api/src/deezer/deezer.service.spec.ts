import { FakeDeezer } from '../../test/fake-deezer';
import { AppException } from '../common/app.exception';
import { DeezerService } from './deezer.service';

describe('DeezerService', () => {
  let fake: FakeDeezer;
  let service: DeezerService;

  beforeEach(() => {
    fake = new FakeDeezer();
    service = new DeezerService(fake.fetch);
  });
  afterEach(() => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
  });

  const codeOf = async (p: Promise<unknown>) => {
    try {
      await p;
      return 'resolved';
    } catch (e) {
      return e instanceof AppException ? e.code : String(e);
    }
  };

  it('searches, dedupes and asks Deezer for 15 results', async () => {
    const res = await service.search('Bahi');
    expect(res).toHaveLength(22);
    expect(fake.calls).toEqual(['/search?q=bahi&limit=15']);
  });

  it('serves repeated searches from the cache (normalised key)', async () => {
    await service.search('bahi');
    await service.search('  BAHI ');
    expect(fake.count('/search')).toBe(1);
  });

  it('coalesces 2 identical concurrent searches into 1 fetch', async () => {
    fake.delayMs = 20;
    const [a, b] = await Promise.all([service.search('didi b'), service.search('Didi B')]);
    expect(a).toBe(b);
    expect(fake.count('/search')).toBe(1);
  });

  it('gets a track and caches it', async () => {
    const t = await service.getTrack(745229932);
    expect(t.trackKey).toBe('isrc:FR9W11916593');
    await service.getTrack(745229932);
    expect(fake.count('/track/')).toBe(1);
    await service.getTrack(745229932, { fresh: true });
    expect(fake.count('/track/')).toBe(2);
  });

  it('maps Deezer error 800 to TRACK_NOT_FOUND', async () => {
    expect(await codeOf(service.getTrack(1))).toBe('TRACK_NOT_FOUND');
  });

  it('opens the circuit breaker on quota error (code 4), then resumes after the pause', async () => {
    fake.override('/search', () => ({
      error: { type: 'Exception', message: 'Quota limit exceeded', code: 4 },
    }));
    expect(await codeOf(service.search('quota'))).toBe('DEEZER_UNAVAILABLE');
    expect(service.isPaused()).toBe(true);

    // While paused: no call reaches Deezer.
    expect(await codeOf(service.search('other'))).toBe('DEEZER_UNAVAILABLE');
    expect(fake.count('/search')).toBe(1);

    // After the pause, calls reach Deezer again.
    fake.reset();
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 10_001);
    expect(service.isPaused()).toBe(false);
    expect(await service.search('bahi')).toHaveLength(22);
    jest.spyOn(Date, 'now').mockReturnValue(now + 10_002);
    expect(await codeOf(service.search('bahi'))).toBe('resolved');
    expect(fake.count('/search')).toBe(1);
  });

  it('maps HTTP 5xx / invalid JSON to DEEZER_UNAVAILABLE', async () => {
    const svc = new DeezerService(async () => new Response('oops', { status: 502 }));
    expect(await codeOf(svc.search('abc'))).toBe('DEEZER_UNAVAILABLE');
    const svc2 = new DeezerService(async () => new Response('not json', { status: 200 }));
    expect(await codeOf(svc2.getTrack(5))).toBe('DEEZER_UNAVAILABLE');
    svc.onModuleDestroy();
    svc2.onModuleDestroy();
  });

  it('reads the album genre (cached) and never throws', async () => {
    expect(await service.getAlbumGenre(109726692)).toBe('Rap/Hip Hop');
    expect(await service.getAlbumGenre(109726692)).toBe('Rap/Hip Hop');
    expect(fake.count('/album/')).toBe(1);
    fake.override('/album/', () => ({ error: { code: 4 } }));
    expect(await service.getAlbumGenre(1)).toBeNull();
  });
});

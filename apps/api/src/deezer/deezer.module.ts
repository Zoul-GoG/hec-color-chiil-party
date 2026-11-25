import { Global, Module } from '@nestjs/common';
import { DeezerService } from './deezer.service';
import { DEEZER_FETCH, type FetchFn } from './deezer.types';

@Global()
@Module({
  providers: [
    { provide: DEEZER_FETCH, useValue: ((input, init) => fetch(input, init)) satisfies FetchFn },
    DeezerService,
  ],
  exports: [DeezerService],
})
export class DeezerModule {}

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Addition, AdditionSchema } from '../additions/addition.schema';
import { Track, TrackSchema } from '../tracks/track.schema';

const models = MongooseModule.forFeature([
  { name: Track.name, schema: TrackSchema },
  { name: Addition.name, schema: AdditionSchema },
]);

/** Playlist models shared by public and admin modules. */
@Global()
@Module({ imports: [models], exports: [models] })
export class ModelsModule {}

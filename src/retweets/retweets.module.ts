import { Module } from '@nestjs/common';
import { RetweetsService } from './retweets.service';
import { RetweetsController } from './retweets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RetweetsController],
  providers: [RetweetsService],
  exports: [RetweetsService],
})
export class RetweetsModule {}
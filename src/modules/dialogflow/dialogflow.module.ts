import { Module } from '@nestjs/common';
import { DialogflowService } from './dialogflow.service';
import { DialogflowController } from './dialogflow.controller';
import { FacebookService } from './facebook.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [DialogflowService, FacebookService],
  controllers: [DialogflowController],
})
export class DialogflowModule {}

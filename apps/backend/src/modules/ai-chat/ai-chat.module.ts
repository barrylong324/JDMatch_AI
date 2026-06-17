import { Module } from '@nestjs/common'
import { AiChatService } from './ai-chat.service'
import { AiChatController } from './ai-chat.controller'

@Module({
    providers: [AiChatService],
    controllers: [AiChatController],
    exports: [AiChatService],
})
export class AiChatModule {}

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConversationsModule } from '../conversations/conversations.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    forwardRef(() => ConversationsModule),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}

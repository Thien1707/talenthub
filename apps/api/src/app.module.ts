import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CompaniesModule } from './companies/companies.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { ModerationModule } from './moderation/moderation.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ApplicationsModule } from './applications/applications.module';
import { CvsModule } from './cvs/cvs.module';
import { JobsModule } from './jobs/jobs.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PricingModule } from './pricing/pricing.module';
import { ReportsModule } from './reports/reports.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import { SavedJobsModule } from './saved-jobs/saved-jobs.module';
import { StudentsModule } from './students/students.module';
import { WalletModule } from './wallet/wallet.module';
import { PostingModule } from './posting/posting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    MailModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    StudentsModule,
    CompaniesModule,
    CategoriesModule,
    JobsModule,
    PricingModule,
    OrdersModule,
    PaymentsModule,
    CvsModule,
    AiModule,
    ApplicationsModule,
    SavedJobsModule,
    MediaModule,
    NotificationsModule,
    ConversationsModule,
    ReportsModule,
    ModerationModule,
    AdminModule,
    ReviewsModule,
    ChatModule,
    WalletModule,
    PostingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

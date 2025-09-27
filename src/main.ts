import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const firstMessage = Object.values(firstError.constraints as any)[0];
        return new BadRequestException(firstMessage);
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SNS Feed API')
    .setDescription(`SNS Feed API Documentation

🔐 auth 인증 방법: header - Authorization=Bearer {token} 방식으로 인증됩니다.

1. POST /user/register 로 회원가입(try it out 버튼)
2. POST /auth/login 으로 로그인(try it out 버튼)
3. 응답 body의 accessToken을 복사
4. 우측 상단 "Authorize" 버튼 클릭 후 입력
5. 모든 인증이 필요한 API 요청 시 자동으로 헤더에 포함됨
`)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '로그인 API에서 받은 accessToken을 입력하세요',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.APP_PORT ?? 5656);
}
bootstrap();

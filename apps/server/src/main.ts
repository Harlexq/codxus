import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import swaggerSetup from './config/swagger.config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

const PORT = process.env.SERVER_PORT ?? 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  swaggerSetup(app);

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `The app is now live at http://localhost:${PORT}/api.`,
      `The application documentation is now available at http://localhost:${PORT}/api/docs.`,
    );
  })
  .catch((err) => {
    console.log(`An error occurred while the app was launching: ${err}`);
  });

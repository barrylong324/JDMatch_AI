// Load environment variables BEFORE any other imports
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
dotenv.config({ path: resolve(__dirname, '../../../.env') })

// Dynamically locate the Prisma engine binary in dist folder
const fs = require('fs')
const engineFiles = fs.readdirSync(__dirname).filter((f) => f.endsWith('.node'))
const engineFile = engineFiles.find(
    (f) => f.includes('query_engine') || f.includes('libquery_engine'),
)
if (engineFile) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = resolve(__dirname, engineFile)
    console.log(`✓ Using Prisma engine: ${engineFile}`)
} else {
    console.warn('⚠️ Prisma engine binary not found in dist, relying on default resolution')
}

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { config, getPort, isDevelopment } from '@rag-ai/config'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    // Security - configure Helmet to allow Swagger UI in development
    if (isDevelopment) {
        // In development, disable strict CSP for Swagger compatibility
        app.use(
            helmet({
                contentSecurityPolicy: false,
                crossOriginEmbedderPolicy: false,
            }),
        )
    } else {
        // In production, use strict security policies
        app.use(helmet())
    }

    app.enableCors({
        origin: config.NEXT_PUBLIC_APP_URL,
        credentials: true,
    })

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter())

    // Global interceptors
    app.useGlobalInterceptors(new LoggingInterceptor())

    // Swagger documentation
    if (isDevelopment) {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('RAG AI Knowledge Base API')
            .setDescription('API documentation for RAG AI Knowledge Base application')
            .setVersion('0.1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .build()

        const document = SwaggerModule.createDocument(app, swaggerConfig)
        SwaggerModule.setup('api/docs', app, document, {
            explorer: true,
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'list',
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
            },
            customSiteTitle: 'RAG AI API Documentation',
            customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .scheme-container { box-shadow: none; border-bottom: 1px solid #ccc }
      `,
            customJs: '',
        })
    }

    const port = getPort()
    await app.listen(port)

    console.log(`🚀 API server running on http://localhost:${port}`)
    if (isDevelopment) {
        console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`)
    }
}

bootstrap()

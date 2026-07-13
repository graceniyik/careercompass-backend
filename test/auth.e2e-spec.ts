import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30000); // Neon's connection time can vary; give setup room to breathe

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService | undefined;
  const testEmail = `test-e2e-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    // Defensive: only attempt cleanup if setup actually succeeded
    if (prisma) {
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      if (user) {
        await prisma.studentProfile.deleteMany({ where: { userId: user.id } });
        await prisma.authEvent.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('/auth/register (POST) creates a new student account', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'E2E Test Student',
        institution: 'Test University',
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(testEmail);
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('/auth/register (POST) rejects a duplicate email with 409', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'E2E Test Student',
        institution: 'Test University',
      });

    expect(response.status).toBe(409);
  });

  it('/auth/login (POST) succeeds with correct credentials and returns tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.email).toBe(testEmail);
  });

  it('/auth/login (POST) rejects an incorrect password with 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'WrongPassword' });

    expect(response.status).toBe(401);
  });

  it('/auth/me (GET) rejects requests with no token', async () => {
    const response = await request(app.getHttpServer()).get('/auth/me');
    expect(response.status).toBe(401);
  });

  it('/auth/me (GET) succeeds with a valid access token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    const token = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testEmail);
  });
});

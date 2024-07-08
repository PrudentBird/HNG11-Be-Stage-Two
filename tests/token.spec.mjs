import { app, startServer } from "../index";
import request from "supertest";
import prisma from "../config/prisma.mjs";
import jwt from "jsonwebtoken";

const { userOrganisation, organisation, user } = prisma;
const { verify } = jwt;

const port = 5003;
let server;

beforeAll(async () => {
  try {
    server = await startServer(port);
  } catch (error) {
    console.error("Failed to start server:", error);
    throw error;
  }
});

afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe("Token Generation Unit Test", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await userOrganisation.deleteMany({});
    await organisation.deleteMany({});
    await user.deleteMany({});
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Should generate a token that expires at the correct time", async () => {
    const loginResponse = await request(app).post("/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "testuser@example.com",
      password: "password123",
      phone: "1234567890",
    });

    const token = loginResponse.body.data.accessToken;
    const decoded = verify(token, process.env.JWT_SECRET);
    let jwtExpiry;
    if (process.env.JWT_EXPIRY === "1d") {
      jwtExpiry = 86400;
    }

    expect(decoded.exp).toBeDefined();
    expect(decoded.exp - decoded.iat).toBe(jwtExpiry);
  }, 60000);

  it("should contain the correct user details in the token", async () => {
    const loginResponse = await request(app).post("/auth/login").send({
      email: "testuser@example.com",
      password: "password123",
    });

    const token = loginResponse.body.data.accessToken;
    const decoded = verify(token, process.env.JWT_SECRET);

    expect(decoded.email).toBe("testuser@example.com");
  }, 60000);
});

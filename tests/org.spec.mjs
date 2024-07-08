import { app, startServer } from "../index";
import request from "supertest";
import prisma from "../config/prisma.mjs";
import jwt from "jsonwebtoken";

const { userOrganisation, organisation, user } = prisma;
const { verify } = jwt;

const port = 5002;
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

describe("Organisation Access Unit Test", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await userOrganisation.deleteMany({});
    await organisation.deleteMany({});
    await user.deleteMany({});
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let userToken;
  let userOrgId;
  let testUserToken;

  it("Should create test user", async () => {
    const userResponse = await request(app).post("/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "testuser@example.com",
      password: "password123",
      phone: "1234567890",
    });

    userToken = userResponse.body.data.accessToken;
    verify(userToken, process.env.JWT_SECRET);
  }, 60000);

  it("Should allow user to access their own organisation", async () => {
    const response = await request(app)
      .get(`/api/organisations`)
      .set("Authorization", `Bearer ${userToken}`);

    userOrgId = response.body.data.organisations[0].orgId;

    expect(response.status).toBe(200);
    expect(response.body.data.organisations[0].name).toBe(
      "Test's Organisation"
    );
  }, 60000);

  it("Should create test user 2", async () => {
    const testUserResponse = await request(app).post("/auth/register").send({
      firstName: "Test2",
      lastName: "User2",
      email: "testuser2@example.com",
      password: "password123",
      phone: "1234567890",
    });

    testUserToken = testUserResponse.body.data.accessToken;
    verify(testUserToken, process.env.JWT_SECRET);
  }, 60000);

  it("Should not allow user to access an organisation they are not a member of", async () => {
    const response = await request(app)
      .get(`/api/organisations/${userOrgId}`)
      .set("Authorization", `Bearer ${testUserToken}`);

    expect(response.status).toBe(403);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Access denied");
  }, 60000);
});

import { app, startServer } from "../index";
import request from "supertest";
import prisma from "../config/prisma.mjs";
const { userOrganisation, organisation, user } = prisma;

const port = 5001;
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

describe("End to End tests", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await userOrganisation.deleteMany({});
    await organisation.deleteMany({});
    await user.deleteMany({});
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Should Register User Successfully with Default Organisation", async () => {
    const response = await request(app).post("/auth/register").send({
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@example.com",
      password: "password123",
      phone: "1234567890",
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Registration successful");
    expect(response.body.data.user.firstName).toBe("John");
    expect(response.body.data.user.email).toBe("johndoe@example.com");
    expect(response.body.data.accessToken).toBeDefined();
  }, 60000);

  it("Should Fail If Required Fields Are Missing and validate HTTP status code", async () => {
    const response = await request(app).post("/auth/register").send({
      lastName: "Doe",
      email: "johndoe@example.com",
      password: "password123",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toContainEqual({
      field: "firstName",
      message: "First name is required",
    });
  }, 60000);

  it(`Should Fail if there's Duplicate Email or UserID and validate HTTP status code`, async () => {
    await request(app).post("/auth/register").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "janedoe@example.com",
      password: "password123",
      phone: "0987654321",
    });

    const response = await request(app).post("/auth/register").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "janedoe@example.com",
      password: "password123",
      phone: "0987654321",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toContainEqual({
      field: "email",
      message: "Email already exists",
    });
  }, 60000);

  it("Should Log the user in successfully and validate response body", async () => {
    await request(app).post("/auth/register").send({
      firstName: "Sam",
      lastName: "Smith",
      email: "samsmith@example.com",
      password: "password123",
      phone: "1122334455",
    });

    const response = await request(app).post("/auth/login").send({
      email: "samsmith@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Login successful");
    expect(response.body.data.user.firstName).toBe("Sam");
    expect(response.body.data.user.email).toBe("samsmith@example.com");
    expect(response.body.data.accessToken).toBeDefined();
  }, 60000);

  it("Should Fail If Login Credentials Are Incorrect", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "nonexistent@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("Bad request");
    expect(response.body.message).toBe("Authentication failed");
  }, 60000);
});

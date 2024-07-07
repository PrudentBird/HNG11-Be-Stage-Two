const request = require("supertest");
const app = require("../index");
const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");

describe("Token Generation Unit Test", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.userOrganisation.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.user.deleteMany({});
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.email).toBe("testuser@example.com");
  }, 60000);
});

describe("Organisation Access Unit Test", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.userOrganisation.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.user.deleteMany({});
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
    jwt.verify(userToken, process.env.JWT_SECRET);
  }, 60000);

  it("Should allow user to access their own organisation", async () => {
    const response = await request(app)
      .get(`/api/organisations`)
      .set("Authorization", `Bearer ${userToken}`);

    userOrgId = response.body.data.orgId;

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Test's Organisation");
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
    jwt.verify(testUserToken, process.env.JWT_SECRET);
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

describe("End to End tests", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.userOrganisation.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.user.deleteMany({});
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

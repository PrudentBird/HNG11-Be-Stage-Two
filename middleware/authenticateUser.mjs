import jwt from "jsonwebtoken";
const { verify } = jwt;
import prisma from "../config/prisma.mjs";
import dotenv from "dotenv";
dotenv.config();

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(400).json({
      status: "Bad request",
      message: "Client error",
      statusCode: 400,
    });

  verify(token, process.env.JWT_SECRET, async (err, jwt_payload) => {
    if (err)
      return res.status(400).json({
        status: "Bad request",
        message: "Client error",
        statusCode: 400,
      });

    try {
      const user = await prisma.user.findUnique({
        where: {
          email: jwt_payload.email,
        },
      });

      if (!user)
        return res.status(400).json({
          status: "Bad request",
          message: "Client error",
          statusCode: 400,
        });

      req.user = user;

      next();
    } catch (err) {
      res.status(400).json({
        status: "Bad request",
        message: "Client error",
        statusCode: 400,
      });
    }
  });
};

export default authenticateUser;

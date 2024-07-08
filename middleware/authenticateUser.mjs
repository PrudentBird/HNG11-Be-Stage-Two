import jwt from "jsonwebtoken";
const { verify } = jwt;
import prisma from "../config/prisma.mjs";
import dotenv from "dotenv";
dotenv.config();

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({
      message: "Invalid token",
    });

  verify(token, process.env.JWT_SECRET, async (err, jwt_payload) => {
    if (err)
      return res.status(403).json({
        message: "Failed to authenticate token.",
      });

    try {
      const user = await prisma.user.findUnique({
        where: {
          email: jwt_payload.email,
        },
      });

      if (!user)
        return res.status(404).json({
          message: "User not found",
        });
      req.user = user;

      next();
    } catch (err) {
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  });
};

export default authenticateUser;

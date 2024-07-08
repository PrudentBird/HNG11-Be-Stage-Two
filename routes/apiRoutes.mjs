import { Router } from "express";
const router = Router();
import dotenv from "dotenv";
dotenv.config();
import prisma from "../config/prisma.mjs";
import { body, validationResult } from "express-validator";
import authenticateUser from "../middleware/authenticateUser.mjs";

router.get("/users/:id", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: req.params.id,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      message: "User found",
      data: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.get("/organisations", authenticateUser, async (req, res) => {
  try {
    const organisations = await prisma.organisation.findMany({
      where: {
        users: {
          some: {
            userId: req.user.userId,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Organisations retrieved",
      data: { organisations },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.get("/organisations/:orgId", authenticateUser, async (req, res) => {
  try {
    const organisation = await prisma.organisation.findUnique({
      where: {
        orgId: req.params.orgId,
      },
    });

    if (!organisation) {
      return res
        .status(404)
        .json({ status: "error", message: "Organisation not found" });
    }

    const userOrganisation = await prisma.userOrganisation.findUnique({
      where: {
        userId_organisationId: {
          userId: req.user.userId,
          organisationId: req.params.orgId,
        },
      },
    });

    if (!userOrganisation) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    res.status(200).json({
      status: "success",
      message: "Organisation retrieved",
      data: {
        orgId: organisation.orgId,
        name: organisation.name,
        description: organisation.description,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.post(
  "/organisations",
  authenticateUser,
  [body("name").notEmpty().withMessage("Name is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (errors.errors.length > 0) {
      const extractedErrorsArray = errors.errors.map((error) => {
        const { path, msg } = error;
        return { path, msg };
      });

      if (extractedErrorsArray.length > 0) {
        const extractedErrors = extractedErrorsArray.map((error) => ({
          field: error.path,
          message: error.msg,
        }));

        return res.status(422).json({
          errors: extractedErrors,
        });
      }
    }

    const { name, description } = req.body;
    try {
      const organisation = await prisma.organisation.create({
        data: {
          name,
          description,
          users: {
            create: {
              userId: req.user.userId,
            },
          },
        },
      });

      res.status(201).json({
        status: "success",
        message: "Organisation created successfully",
        data: {
          orgId: organisation.orgId,
          name: organisation.name,
          description: organisation.description,
        },
      });
    } catch (error) {
      res.status(400).json({
        status: "Bad request",
        message: "Client error",
        statusCode: 400,
      });
    }
  }
);

router.post(
  "/organisations/:orgId/users",
  authenticateUser,
  [body("userId").notEmpty().withMessage("User ID is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (errors.errors.length > 0) {
      const extractedErrorsArray = errors.errors.map((error) => {
        const { path, msg } = error;
        return { path, msg };
      });

      if (extractedErrorsArray.length > 0) {
        const extractedErrors = extractedErrorsArray.map((error) => ({
          field: error.path,
          message: error.msg,
        }));

        return res.status(422).json({
          errors: extractedErrors,
        });
      }
    }
    const { userId } = req.body;
    try {
      await prisma.userOrganisation.create({
        data: {
          userId,
          organisationId: req.params.orgId,
        },
      });

      res.status(200).json({
        status: "success",
        message: "User added to organisation successfully",
      });
    } catch (error) {
      res.status(400).json({
        status: "Bad request",
        message: "Client error",
        statusCode: 400,
      });
    }
  }
);

export default router;

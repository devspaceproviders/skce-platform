import { Router } from "express";

import {
  getPublicCeoController,
} from "../controllers/ceo.controller";

const ceoRouter = Router();

ceoRouter.get(
  "/",
  getPublicCeoController
);

export default ceoRouter;
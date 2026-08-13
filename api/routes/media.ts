import { Router, type IRouter } from "../http";
import { authenticate } from "../middlewares/auth";
import {
  ImageKitService,
  MediaConfigurationError,
} from "../lib/mediaProvider";

const router: IRouter = Router();

router.get("/media/auth", authenticate, (req, res): void => {
  const purpose =
    req.query.purpose === "profile"
      ? "profile"
      : req.query.purpose === "campaign"
        ? "campaign"
        : req.query.purpose === "project"
          ? "project"
        : "post";
  if ((purpose === "campaign" || purpose === "project") && req.user?.role !== "admin" && req.user?.role !== "super_admin") {
    res.status(403).json({ error: "Only administrators can upload campaign or project images." });
    return;
  }

  try {
    const media = new ImageKitService();
    res.json({
      ...media.getAuthenticationParameters(),
      folder:
        purpose === "profile"
          ? `/profiles/${req.user!.id}`
          : purpose === "campaign"
            ? `/campaigns/${req.user!.id}`
            : purpose === "project"
              ? `/projects/${req.user!.id}`
          : `/posts/${req.user!.id}`,
    });
  } catch (error) {
    if (error instanceof MediaConfigurationError) {
      res.status(503).json({ error: "Media storage is not configured." });
      return;
    }
    throw error;
  }
});

export default router;
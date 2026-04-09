import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith("Bearer")) {
    try {
      token = token.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.userId = decoded.id || decoded._id;
      req.user = decoded;

      next();
    } catch (error) {
      res.status(401).json({ message: "Token invalid" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
};

export default protect;
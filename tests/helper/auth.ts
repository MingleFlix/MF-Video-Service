import jwt from "jsonwebtoken";

const generateUserToken = () => {
  return jwt.sign(
    { userId: 1, email: "foo@bar", username: "foo" },
    process.env.JWT_SECRET || "",
    { expiresIn: "12h" }
  );
};

export default generateUserToken;

require("dotenv").config();
 
const express = require("express");
const cors = require("cors");
 
const app = express();
 
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
}));
 
app.use(express.json());
 
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
 
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
 
const PORT = process.env.PORT || 5000;
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

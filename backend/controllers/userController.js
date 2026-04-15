import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendSMS } from "../services/smsService.js";

// 🧾 Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    // Send welcome SMS if phone number is provided
    if (phoneNumber) {
      const welcomeMessage = `Welcome to Debex! 🎉 Your account has been created successfully. Shop now for quality electrical products and infrastructure solutions.`;
      const smsResult = await sendSMS(phoneNumber, welcomeMessage, 'Debex');
      
      if (smsResult.success) {
        console.log(`[User Registration] Welcome SMS sent to ${phoneNumber}`);
      } else {
        console.warn(`[User Registration] Failed to send welcome SMS: ${smsResult.error}`);
      }
    }

    res.status(201).json({
      message: "User created. Please log in",
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔑 Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  
};
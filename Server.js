const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv=require("dotenv")
const bcrypt=require("bcrypt")
dotenv.config()

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
connectDB();

// ✅ Mongoose schema
const ProfileSchema = new mongoose.Schema({
  user_id: { type: String, unique: true, required: true },
  Name: String,
  DOB: String,
  Age: Number,
  Gender: String,
  Maritial_Status: String,
  Dependents: Number,
  Education: String,
  Employment_Status: String,
  Total_Income: Number,
  Residential_Status: String,
  Rent_Amount: Number,
  Cibil_Score: Number,
  Contact_No: String,
  Address: String,
  Loan_Type: { type: String, default: "" },
  Loan_Amount: { type: Number, default: 0 },
  Loan_Term: { type: Number, default: 0 },
  Existing_EMI: { type: Number, default: 0 },
  Email: { type: String, required: true },
  Password: { type: String, required: true },
  otp:Number,
  otpExpires:Number,

  // documents: {
  //   aadhar: { type: Buffer },
  //   pan: { type: Buffer },
  //   employmentId: { type: Buffer },
  //   salarySlips: { type: Buffer }
  // }

});

const Profile = mongoose.model("Profile", ProfileSchema);


const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,       // ✅ Your email
    pass: process.env.PASS,          // ✅ App-specific password (not your email login pwd)
  },
});


app.post("/profile_completion", async (req, res) => {
  const {
    Name,
    DOB,
    Gender,
    Maritial_Status,
    Dependents,
    Age,
    Education,
    Employment_Status,
    Total_Income,
    Residential_Status,
    Rent_Amount,
    Cibil_Score,
    Contact_No,
    Address,
    Email,
    Password,
  } = req.body.eli_values;

  console.log(
    Name,
    DOB,
    Gender,
    Maritial_Status,
    Dependents,
    Age,
    Education,
    Employment_Status,
    Total_Income,
    Residential_Status,
    Rent_Amount,
    Cibil_Score,
    Contact_No,
    Address,
  );

  try {
    // 1️⃣ Get last profile and generate new ID
    const lastProfile = await Profile.findOne().sort({ user_id: -1 }).exec();
    let newIdNumber = 1;
    if (lastProfile && lastProfile.user_id) {
      const lastId = lastProfile.user_id.replace("LP", "");
      newIdNumber = parseInt(lastId) + 1;
    }
    const user_id = `LP${String(newIdNumber).padStart(3, "0")}`;

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // 3️⃣ Create new profile
    const newProfile = new Profile({
      user_id,
      Name,
      DOB,
      Age,
      Gender,
      Maritial_Status,
      Dependents,
      Education,
      Employment_Status,
      Total_Income,
      Residential_Status,
      Rent_Amount,
      Cibil_Score,
      Contact_No,
      Address,
      Loan_Amount: 0,
      Loan_Term: 0,
      Existing_EMI: 0,
      Email,
      Password: hashedPassword, // 🔒 Secure password
    });

    await newProfile.save();

    // ✅ Send Email with user_id
    const mailOptions = {
      from: process.env.EMAIL,
      to: Email,
      subject: "🎉 Profile Created Successfully!",
      html: `
        <h2>Hello ${Name},</h2>
        <p>Your profile has been successfully created.</p>
        <p><strong>Your User ID:</strong> ${user_id}</p>
        <br/>
        <p>Thanks for registering with us!</p>
        <p><em>LoanPort Team</em></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to", Email);
    console.log("✅ Profile Saved:", newProfile);

    res.status(201).json({ message: "Profile saved successfully" });
  } catch (error) {
    console.error("❌ Error saving profile:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/update_loan", async (req, res) => {
  const { user_id, loan_type, loan_amount, loan_term, existing_emi } = req.body;

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user_id }, // use unique field here ideally (like contact/email)
      {
        $set: {
          Loan_Type: loan_type,
          Loan_Amount: loan_amount,
          Loan_Term: loan_term,
          Existing_EMI: existing_emi,
        },
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    console.log("Updated Profile:", updatedProfile);
    res.status(200).json({ message: "Loan data updated successfully" });
  } catch (error) {
    console.error("Error updating loan data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get_user/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await Profile.findOne({ user_id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user); // send full profile
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/get_user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


app.put("/update_profile", async (req, res) => {
  const updatedProfile = req.body;

  if (!updatedProfile.user_id) {
    return res.status(400).json({ message: "User ID is required for update." });
  }

  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: updatedProfile.user_id },
      { $set: updatedProfile },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});


const multer = require("multer");
const storage = multer.memoryStorage();  // Store files as Buffer
const upload = multer({ storage: storage });

app.post(
  "/upload_documents",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "employmentId", maxCount: 1 },
    { name: "salarySlip", maxCount: 1 },
  ]),
  async (req, res) => {
    const { user_id } = req.body;

    try {
      // 🔹 Fetch the profile first
      const profile = await Profile.findOne({ user_id });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // 🔹 Only after fetching, generate dynamic profile details
      let profileDetailsHtml = "";
      for (const [key, value] of Object.entries(profile.toObject())) {
        if (key !== "password" && typeof value !== "object" && value !== null) {
          profileDetailsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
        }
      }

      // 🔹 Compose the email with attachments
      const mailOptions = {
        from: process.env.EMAIL,
        to: "loaneaseofficial@gmail.com",
        subject: `📄 Document Submission for User ID: ${user_id}`,
        html: `
          <h3>📌 Profile Summary</h3>
          ${profileDetailsHtml}
          <hr/>
          <h3>📎 Attached Documents:</h3>
          <ul>
            <li>Aadhar.pdf</li>
            <li>PAN.pdf</li>
            <li>EmploymentID.pdf</li>
            <li>SalarySlip.pdf</li>
          </ul>
        `,
        attachments: [
          {
            filename: "Aadhar.pdf",
            content: req.files["aadhar"][0].buffer,
          },
          {
            filename: "PAN.pdf",
            content: req.files["pan"][0].buffer,
          },
          {
            filename: "EmploymentID.pdf",
            content: req.files["employmentId"][0].buffer,
          },
          {
            filename: "SalarySlip.pdf",
            content: req.files["salarySlip"][0].buffer,
          },
        ],
      };

      // 🔹 Send the email
      await transporter.sendMail(mailOptions);
      console.log("✅ Documents emailed successfully");

      res.status(200).json({ message: "Documents emailed to verification team" });
    } catch (error) {
      console.error("❌ Error sending documents:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post("/contact-msg", (req, res) => {
  const { name, email, query } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; padding: 30px; background-color: #f4f4f4; border-radius: 8px; text-align: center;">
      <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">New Client Message</h2>
        <p style="font-size: 16px; color: #555;">You’ve received a message from a potential client. Here are the details:</p>

        <table style="width: 100%; margin-top: 20px; font-size: 16px; color: #444;">
          <tr>
            <td style="font-weight: bold; padding: 10px; text-align: right;">Name:</td>
            <td style="padding: 10px; text-align: left;">${name}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px; text-align: right;">Email:</td>
            <td style="padding: 10px; text-align: left;">${email}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 10px; text-align: right; vertical-align: top;">Message:</td>
            <td style="padding: 10px; text-align: left;">${query}</td>
          </tr>
        </table>

        <p style="font-size: 14px; color: #777; margin-top: 30px;">Please reach out to the client using the provided email address.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: 'subramaniyamsvss@gmail.com',
    to: 'subramaniyamsvss@gmail.com',
    subject: 'Client Query',
    html: emailContent
  };

  transporter.sendMail(mailOptions)
    .then(() => {
      console.log('Mail sent successfully');
      res.status(200).json({ message: 'Mail sent successfully' });
    })
    .catch((err) => {
      console.error("Error sending mail:", err);
      res.status(500).json({ message: 'Error sending email' });
    });
});


app.post("/signin", async (req, res) => {
  const { userid, password } = req.body;

  // Validation
  if (!userid || !password) {
    return res.status(400).json({ message: "User ID and Password are required." });
  }

  try {
    // Find user by user_id
    const user = await Profile.findOne({ user_id: userid });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials. Please try again." });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials. Please try again." });
    }

    // Prepare user data to send
    const userData = {
      user_id: user.user_id,
      Name: user.Name,
      Email: user.Email,
      DOB: user.DOB,
    };

    res.status(200).json({
      status: "success",
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});


// Send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  console.log(email,process.env.EMAIL);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    let user = await Profile.findOne({ Email:email });
    console.log(user);
    
    if (!user) user = new Profile({ email });

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}`,
    });

    res.status(200).json({ message: 'OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ error: 'Error sending OTP.' });
  }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await Profile.findOne({ Email: email });
    console.log(user.otp,otp);
    

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.otp == otp ) {   //&& user.otpExpires > Date.now()
      return res.status(200).json({ message: 'OTP verified successfully.' });
    }

    return res.status(400).json({ error: 'Invalid or expired OTP' });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Server error while verifying OTP.' });
  }
});

// Update Password
app.post('/update-password', async (req, res) => {
  const { email, newPassword } = req.body;
  console.log(email, newPassword);
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Hashed:', hashedPassword);
    
    const user = await Profile.findOne({ Email: email });
    console.log('User:', user);
    
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.Password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Error updating password.' });
  }
});




app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

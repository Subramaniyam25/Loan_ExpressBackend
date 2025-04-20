const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/profileDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
    user: "subramaniyamsvss@gmail.com",       // ✅ Your email
    pass: "eaar wunc qvtu ppaf",          // ✅ App-specific password (not your email login pwd)
  },
});


app.post("/profile_completion", async (req, res) => {
  user_name = req.body.eli_values.Name;
  dob = req.body.eli_values.DOB;
  gender = req.body.eli_values.Gender;
  martial_status = req.body.eli_values.Maritial_Status;
  dependents = req.body.eli_values.Dependents;
  age = req.body.eli_values.Age;
  education = req.body.eli_values.Education;
  employment_status = req.body.eli_values.Employment_Status;
  income = req.body.eli_values.Total_Income;
  residential_status = req.body.eli_values.Residential_Status;
  rent_amount = req.body.eli_values.Rent_Amount;
  cibil_score = req.body.eli_values.Cibil_Score;
  contact_no = req.body.eli_values.Contact_No;
  address = req.body.eli_values.Address;
  console.log(
    user_name,
    dob,
    gender,
    martial_status,
    dependents,
    age,
    education,
    employment_status,
    income,
    residential_status,
    rent_amount,
    cibil_score,
    contact_no,
    address,
  );
  try {
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
    } = req.body.eli_values;

    // 1️⃣ Get the last created profile
    const lastProfile = await Profile.findOne().sort({ user_id: -1 }).exec();

    // 2️⃣ Extract the number and increment it
    let newIdNumber = 1; // Default for first user
    if (lastProfile && lastProfile.user_id) {
      const lastId = lastProfile.user_id.replace("LP", ""); // Remove LP
      newIdNumber = parseInt(lastId) + 1;
    }

    // 3️⃣ Format the new ID as LP001, LP002, etc.
    const user_id = `LP${String(newIdNumber).padStart(3, "0")}`;

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
    });

    await newProfile.save();

    // ✅ Send Email with user_id
    const mailOptions = {
      from: "subramaniyamsvss@gmail.com",
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

app.get("/get_user/:user_id/:dob", async (req, res) => {
  const { user_id, dob } = req.params;

  try {
    const profile = await Profile.findOne({ user_id, DOB: dob });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/update_profile", async (req, res) => {
  const { user_id, ...updates } = req.body;

  try {
    const updated = await Profile.findOneAndUpdate(
      { user_id },
      { $set: updates },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Profile not found" });

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err.message);
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
        from: "subramaniyamsvss@gmail.com",
        to: "valarshan2000@gmail.com",
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
      user: 'subramaniyamsvss@gmail.com',
      pass: 'fqkz oibw gxjr whyd'
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



app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

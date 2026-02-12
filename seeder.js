// const connectDB = require("./env/db");
// const Admin = require("./models/admin-model");
// const dotenv = require("dotenv");
// const fs = require("fs");

// dotenv.config({ path: "./env/config.env" });

// // Load admin data from JSON file
// const adminData = JSON.parse(
//   fs.readFileSync("./data/admin-data.json", "utf-8")
// );

// // Connect to database
// connectDB();

// const insertAdmins = async () => {
//   try {
//     // Delete existing admins first (optional, removes duplicates)
//     await Admin.deleteMany({});
//     // console.log("Old admins removed.");

//     // Insert new admin data
//     await Admin.create(adminData);
//     console.log("✅ Admin data inserted successfully!");
//   } catch (error) {
//     console.error("❌ Error inserting admin data:", error.message);
//   } finally {
//     process.exit();
//   }
// };

// const deleteAdmins = async () => {
//   try {
//     await Admin.deleteMany({});
//     console.log("🗑️ All admins deleted!");
//   } catch (error) {
//     console.error("❌ Error deleting admins:", error.message);
//   } finally {
//     process.exit();
//   }
// };

// // Run based on command: node seeder.js -i  (insert)   or   node seeder.js -d  (delete)
// if (process.argv[2] === "-i") {
//   insertAdmins();
// } else if (process.argv[2] === "-d") {
//   deleteAdmins();
// } else {
//   // console.log("Usage:");
//   console.log("  Insert admins: node seeder.js -i");
//   console.log("  Delete admins: node seeder.js -d");
//   process.exit();
// }
//<------------------------------------------------------------------->

//add file
const connectDB = require("./env/db");
const Admin = require("./models/admin-model");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config({ path: "./env/config.env" });

// Load admin data
const adminData = JSON.parse(
  fs.readFileSync("./data/admin-data.json", "utf-8")
);

// Connect DB
connectDB();

const insertAdmins = async () => {
  try {
    for (const admin of adminData) {
      const existingAdmin = await Admin.findOne({ email: admin.email });

      if (existingAdmin) {
        console.log(`⚠️ Admin already exists`);
        continue;
      }

      await Admin.create(admin);
      console.log(`✅ Admin inserted successful!`);
    }
  } catch (error) {
    console.error("❌ Error inserting admin:", error.message);
  } finally {
    process.exit();
  }
};

const deleteAdmins = async () => {
  try {
    await Admin.deleteMany({});
    console.log("🗑️ All admins deleted!");
  } catch (error) {
    console.error("❌ Error deleting admins:", error.message);
  } finally {
    process.exit();
  }
};

// Command handler
if (process.argv[2] === "-i") {
  insertAdmins();
} else if (process.argv[2] === "-d") {
  deleteAdmins();
} else {
  console.log("Usage:");
  console.log("  Insert admins: node seeder.js -i");
  console.log("  Delete admins: node seeder.js -d");
  process.exit();
}

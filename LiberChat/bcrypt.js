// generate-hash.js
const bcrypt = require("bcryptjs");

// ✅ Change this to the password you want to hash
const password = "MyNewAdmin123";

// Salt rounds (10 is a good balance of security & speed)
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log("Password:", password);
console.log("Bcrypt Hash:", hash);


// db.users.insertOne({
//   email: "lojihu@cyclelove.cc",
//   password: "$2b$10$sWR7AojqDxzfb.botogru.cbkEI0Skv2bUAD.OkIsX8UFzqTmgnGq",
//   role: "admin",
//   createdAt: new Date(),
//   updatedAt: new Date()
// })


// db.users.updateOne(
//   { email: "lojihu@cyclelove.cc" },
//   { $set: { verified: true, emailVerified: true, isVerified: true } }
// )

// db.users.findOne({ email: "lojihu@cyclelove.cc" })
import fs from "fs";

const source = ".env.example";
const destination = ".env.local";

if (!fs.existsSync(destination)) {
  fs.copyFileSync(source, destination);
  console.log("✅ Created .env.local from .env.example");
} else {
  console.log("ℹ️ .env.local already exists");
}
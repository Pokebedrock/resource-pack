const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

/**
 * Files/Directories to exclude from build.
 * @type {string[]}
 */
const exclude = [
  ".vscode",
  ".github",
  ".git",
  "node_modules",
  ".gitattributes",
  ".gitignore",
  ".mcattributes",
  "build.js",
  "package-lock.json",
  "package.json",
  "README.json"
];

const manifestData = fs.readFileSync("manifest.json", "utf8");
const manifest = JSON.parse(manifestData);
const version = manifest.header.version.join(".");

try { 
  const fileName = `PokeBedrock_RES_${version}`;

  package(`${fileName}.mcpack`);
  package(`${fileName}.zip`);

} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

/**
 * @param {string} fileName 
 */
function package(fileName) {
  if (fs.existsSync(fileName)) {
    return;
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const output = fs.createWriteStream(fileName);

  output.on("close", () => {
    console.log(archive.pointer() + " total bytes");
    console.log((archive.pointer() / 1024 ** 2).toFixed(2) + "MB");
    console.log(`[${fileName}] Release created for version: ${version}\n`);
  });

  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on("error", (err) => {
    throw err;
  });

  const contents = fs
    .readdirSync(__dirname)
    .filter((v) => !exclude.includes(v));

  for (const content of contents) {
    const contentPath = path.join(__dirname, content);

    if (fs.lstatSync(contentPath).isDirectory()) {
      archive.directory(contentPath, content);
    } else {
      archive.file(content, fs.readFileSync(contentPath));
    }
  }

  archive.pipe(output);
  archive.finalize();
}
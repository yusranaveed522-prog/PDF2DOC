const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------
// SUPABASE
// -----------------------------

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// -----------------------------
// MIDDLEWARE
// -----------------------------

app.use(cors());
app.use(express.json());

// -----------------------------
// DIRECTORIES
// -----------------------------

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// -----------------------------
// MULTER
// -----------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// -----------------------------
// HOME
// -----------------------------

app.get("/", (req, res) => {
  res.json({
    message: "PDF2DOC backend is running!",
  });
});

// -----------------------------
// PDF TO DOCX
// -----------------------------

app.post("/api/convert", upload.single("pdf"), async (req, res) => {
  console.log("--------------------------------");
  console.log("Conversion request received.");

  if (!req.file) {
    console.log("No PDF file received.");

    return res.status(400).json({
      message: "Please upload a PDF file.",
    });
  }

  console.log("PDF received:", req.file.originalname);

  const inputPath = req.file.path;

  const originalName = path.parse(req.file.originalname).name;

  const outputFileName = `${originalName}.docx`;

  const outputPath = path.join(outputDir, outputFileName);

  // -----------------------------
  // UPLOAD PDF TO SUPABASE STORAGE
  // -----------------------------

  try {
    console.log("Uploading PDF to Supabase Storage...");

    const fileBuffer = fs.readFileSync(inputPath);

    const storageFileName = `${Date.now()}-${req.file.originalname}`;

    const { error: storageError } = await supabase.storage
      .from("pdf-files")
      .upload(storageFileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("Supabase Storage error:", storageError);

      fs.unlink(inputPath, () => {});

      return res.status(500).json({
        message: "PDF could not be saved to Supabase Storage.",
        error: storageError.message,
      });
    }

    console.log("PDF uploaded to Supabase Storage.");
    console.log("Storage path:", storageFileName);

    // -----------------------------
    // SAVE CONVERSION RECORD
    // -----------------------------

    const { data: conversion, error: databaseError } = await supabase
      .from("conversions")
      .insert([
        {
          file_name: req.file.originalname,
          file_size: req.file.size,
          status: "processing",
        },
      ])
      .select()
      .single();

    if (databaseError) {
      console.error("Supabase database error:", databaseError);

      fs.unlink(inputPath, () => {});

      return res.status(500).json({
        message: "Conversion record could not be saved.",
        error: databaseError.message,
      });
    }

    console.log("Conversion record created:", conversion.id);

    // -----------------------------
    // PYTHON CONVERTER
    // -----------------------------

    const pythonScript = path.join(
      __dirname,
      "..",
      "converter",
      "convert.py"
    );

    console.log("Python script:", pythonScript);
    console.log("Input:", inputPath);
    console.log("Output:", outputPath);

    const pythonProcess = spawn("python", [
      pythonScript,
      inputPath,
      outputPath,
    ]);

    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log("Python:", data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("error", async (error) => {
      console.error("Failed to start Python:", error);

      await supabase
        .from("conversions")
        .update({
          status: "failed",
        })
        .eq("id", conversion.id);

      fs.unlink(inputPath, () => {});

      return res.status(500).json({
        message: "Could not start Python converter.",
        error: error.message,
      });
    });

    pythonProcess.on("close", async (code) => {
      console.log("Python process finished with code:", code);

      fs.unlink(inputPath, () => {});

      // -----------------------------
      // CONVERSION FAILED
      // -----------------------------

      if (code !== 0) {
        console.error("Conversion failed:", errorOutput);

        await supabase
          .from("conversions")
          .update({
            status: "failed",
          })
          .eq("id", conversion.id);

        return res.status(500).json({
          message: "PDF conversion failed.",
          error: errorOutput,
        });
      }

      // -----------------------------
      // DOCX NOT CREATED
      // -----------------------------

      if (!fs.existsSync(outputPath)) {
        await supabase
          .from("conversions")
          .update({
            status: "failed",
          })
          .eq("id", conversion.id);

        return res.status(500).json({
          message: "Word file was not created.",
        });
      }

      console.log("DOCX created successfully.");

      // -----------------------------
      // UPDATE DATABASE
      // -----------------------------

      const { error: updateError } = await supabase
        .from("conversions")
        .update({
          status: "completed",
        })
        .eq("id", conversion.id);

      if (updateError) {
        console.error(
          "Could not update conversion status:",
          updateError.message
        );
      } else {
        console.log("Conversion status updated to completed.");
      }

      // -----------------------------
      // DOWNLOAD DOCX
      // -----------------------------

      res.download(outputPath, outputFileName, (err) => {
        if (err) {
          console.error("Download error:", err);
        }

        fs.unlink(outputPath, () => {});
      });
    });
  } catch (error) {
    console.error("Unexpected server error:", error);

    if (fs.existsSync(inputPath)) {
      fs.unlink(inputPath, () => {});
    }

    return res.status(500).json({
      message: "Something went wrong.",
      error: error.message,
    });
  }
});

// -----------------------------
// ERROR HANDLER
// -----------------------------

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(400).json({
    message: err.message || "Something went wrong.",
  });
});

// -----------------------------
// START SERVER
// -----------------------------

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
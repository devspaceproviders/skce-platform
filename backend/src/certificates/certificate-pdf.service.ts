import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

export type GenerateCertificatePdfOptions = {
  certificateNumber: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
};

const PAGE_WIDTH = 1536;
const PAGE_HEIGHT = 1024;

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "uploads",
  "certificate-assets",
  "certificate-template.png"
);

const SCRIPT_FONT_PATH = path.join(
  process.cwd(),
  "uploads",
  "certificate-assets",
  "fonts",
  "Z003-MediumItalic.otf"
);

function resolveUploadUrl(
  url: string | null | undefined
) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const cleanUrl = url.replace(/^\/+/, "");

  return path.join(
    process.cwd(),
    cleanUrl
  );
}

function formatIssuedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function drawCenteredText(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  options: {
    font: string;
    size: number;
    color: string;
    x?: number;
    width?: number;
  }
) {
  const x = options.x ?? 0;
  const width =
    options.width ?? PAGE_WIDTH;

  doc
    .font(options.font)
    .fontSize(options.size)
    .fillColor(options.color)
    .text(text, x, y, {
      width,
      align: "center",
      lineBreak: false,
    });
}

function coverArea(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.save();

  doc.rect(
    x,
    y,
    width,
    height
  );

  doc
    .fillColor("#FFFFFF")
    .fill();

  doc.restore();
}

function fitFontSize(
  doc: PDFKit.PDFDocument,
  text: string,
  maxWidth: number,
  startingSize: number,
  minimumSize: number,
  font: string
) {
  let size = startingSize;

  while (size > minimumSize) {
    doc
      .font(font)
      .fontSize(size);

    if (
      doc.widthOfString(text) <=
      maxWidth
    ) {
      break;
    }

    size -= 1;
  }

  return size;
}

export async function generateCertificatePdf(
  options: GenerateCertificatePdfOptions
): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `Certificate template not found: ${TEMPLATE_PATH}`
    );
  }

  const doc = new PDFDocument({
    size: [
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ],
    margin: 0,
    autoFirstPage: true,
    compress: true,
  });

  const chunks: Buffer[] = [];

  const pdfBufferPromise =
    new Promise<Buffer>(
      (resolve, reject) => {
        doc.on(
          "data",
          (chunk: Buffer) =>
            chunks.push(chunk)
        );

        doc.on(
          "end",
          () =>
            resolve(
              Buffer.concat(chunks)
            )
        );

        doc.on(
          "error",
          reject
        );
      }
    );

  // ------------------------------------------------------------
  // Exact reference artwork
  // ------------------------------------------------------------
  // The complete decorative certificate is used as the fixed
  // background. Only the variable certificate fields are redrawn.
  // ------------------------------------------------------------

  doc.image(
    TEMPLATE_PATH,
    0,
    0,
    {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    }
  );

  // ------------------------------------------------------------
  // Recipient name
  // ------------------------------------------------------------
  // Cover only the reference recipient name. The surrounding
  // artwork remains untouched.
  // ------------------------------------------------------------

  coverArea(
    doc,
    470,
    505,
    610,
    105
  );

  const recipientFont =
    fs.existsSync(
      SCRIPT_FONT_PATH
    )
      ? SCRIPT_FONT_PATH
      : "Times-Italic";

  const recipientSize =
    fitFontSize(
      doc,
      options.recipientName,
      600,
      76,
      42,
      recipientFont
    );

  drawCenteredText(
    doc,
    options.recipientName,
    510,
    {
      font: recipientFont,
      size: recipientSize,
      color: "#0B3E91",
      x: 430,
      width: 680,
    }
  );

  // Reference underline below the
  // recipient name.

  doc
    .moveTo(445, 604)
    .lineTo(1090, 604)
    .lineWidth(1.4)
    .strokeColor("#E99A20")
    .stroke();

  // ------------------------------------------------------------
  // Completion text
  // ------------------------------------------------------------
  // The reference template contains the
  // completion text as part of the background.
  // Cover that baked-in text and redraw it
  // exactly as required.

  coverArea(
    doc,
    450,
    625,
    640,
    42
  );

  drawCenteredText(
    doc,
    "HAS SUCCESSFULLY COMPLETED",
    628,
    {
      font: "Helvetica-Bold",
      size: 22,
      color: "#18345F",
      x: 430,
      width: 680,
    }
  );

  // ------------------------------------------------------------
  // Course title
  // ------------------------------------------------------------

  coverArea(
    doc,
    450,
    650,
    640,
    65
  );

  const courseFont =
    "Helvetica-Bold";

  const courseSize =
    fitFontSize(
      doc,
      options.courseTitle,
      620,
      42,
      24,
      courseFont
    );

  drawCenteredText(
    doc,
    options.courseTitle,
    655,
    {
      font: courseFont,
      size: courseSize,
      color: "#0B4FA8",
      x: 430,
      width: 680,
    }
  );

  // ------------------------------------------------------------
  // Certificate number + issue date
  // ------------------------------------------------------------
  // Keep the original rounded panel and icons from the reference.
  // Only the two variable text areas are covered.
  // ------------------------------------------------------------

  coverArea(
    doc,
    405,
    842,
    320,
    70
  );

  coverArea(
    doc,
    790,
    842,
    320,
    70
  );

  doc
    .font("Helvetica")
    .fontSize(18)
    .fillColor("#18345F")
    .text(
      "Certificate No:",
      425,
      850,
      {
        width: 260,
        align: "left",
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#0B3E91")
    .text(
      options.certificateNumber,
      425,
      875,
      {
        width: 300,
        align: "left",
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(18)
    .fillColor("#18345F")
    .text(
      "Issued On:",
      805,
      850,
      {
        width: 240,
        align: "left",
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#0B3E91")
    .text(
      formatIssuedDate(
        options.issuedAt
      ),
      805,
      875,
      {
        width: 290,
        align: "left",
        lineBreak: false,
      }
    );

  // ------------------------------------------------------------
  // Authorized signature
  // ------------------------------------------------------------
  // The reference artwork contains the exact approved handwritten
  // signature and authorization block. Keep it unchanged so the
  // generated certificate matches the approved design exactly.

  doc.end();

  return pdfBufferPromise;
}
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');

const folderPath = './code-files'; // مجلد ملفات الكود
const outputPath = 'AllCode.docx';

const codeFont = 'Courier New';

function processFiles() {
    const files = fs.readdirSync(folderPath).filter(file =>
        ['.js', '.ts', '.py', '.c', '.cpp', '.java', '.html', '.css'].includes(path.extname(file))
    );

    const children = [];

    files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf8');

        children.push(
            new Paragraph({
                children: [new TextRun({ text: `File: ${file}`, bold: true, size: 28 })],
                spacing: { after: 100 },
            })
        );

        content.split('\n').forEach(line => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line,
                            font: codeFont,
                            size: 24,
                        }),
                    ],
                })
            );
        });

        children.push(new Paragraph({ text: '\n\n' }));
    });

    // إنشاء المستند مع قسم يحتوي على الفقرات
    const doc = new Document({
        creator: "User",
        title: "Code Files",
        sections: [{
            children: children,
        }],
    });

    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync(outputPath, buffer);
        console.log(` created success: ${outputPath}`);
    });
}

processFiles();

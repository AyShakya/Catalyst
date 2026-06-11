const { parse } = require("csv-parse");

async function parseCSV(fileBuffer) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    parser.on("readable", function () {
      let record;
      while ((record = parser.read())) {
        records.push(record);
      }
    });

    parser.on("error", (err) => reject(err));
    parser.on("end", () => resolve(records));
    parser.write(fileBuffer);
    parser.end();
  });
}

module.exports = { parseCSV };

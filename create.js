const fs = require('fs');
const { exit } = require('process');
const csv = require('csv-parser')

const tableName = "";
const awsBatchWrite = "aws dynamodb batch-write-item --request-items";

const args = process.argv.slice(2);
if (!args.length) {
    console.error("'command: node create <fileName>'")
    exit(1);
}

main(args[0]);

function main(fileName) {
    const stream = fs.createReadStream("./csv/" + fileName);
    let data = {};
    data[tableName] = [];
    let dataCount = 0;
    stream.pipe(csv()).on("data", (row) => {
        if (dataCount) {
            data[tableName].push(conditionTemplate(fileName, row));
        }
        dataCount++;
        if (dataCount === 25) {
            console.log(awsBatchWrite + " '" + JSON.stringify(data) + "'");
            fs.appendFile(`output/${fileName}.sh`, `\n${awsBatchWrite + " '" + JSON.stringify(data) + "'"}`, function (err) {
                if (err) throw err;
                console.log('Saved!');
            });

            data[tableName] = [];
            dataCount = 1;
        }
    }).on("end", () => {
        if (dataCount != 25) {
            fs.appendFile(`output/${fileName}.sh`, `\n${awsBatchWrite + " '" + JSON.stringify(data) + "'"}`, function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
        }
    })
}

function conditionTemplate(fileName, data) {
    switch (fileName) {
        case "": {
            return template(data)
        }
        default: {
            throw new Error("'fileName not found'");
        }
    }
}

function template(data) {
    return {
        PutRequest: {
            Item: {
                hk: { S: data["hk"] },
                rk: { S: data["rk"] },
            }
        }
    };
}
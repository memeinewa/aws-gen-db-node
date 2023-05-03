const fs = require('fs');
const { exit } = require('process');
const csv = require('csv-parser');

const tableName = "mb-esaving-personal-info-item";
const awsBatchWrite = "aws dynamodb batch-write-item --request-items";

const args = process.argv.slice(2);
if (!args.length) {
    console.error("'command: node create <fileName>'")
    exit(1);
}

main(args[0]);

async function main(fileName) {
    const stream = fs.createReadStream("./csv/" + fileName);
    const filename = fileName.split(".")[0];
    const fileNo = await getNumberOfLine(stream);
    const fileLength = getLength(fileNo);
    let count = 1;
    let num = 0;
    const data = {};
    data[tableName] = [];
    fs.createReadStream("./csv/" + fileName).pipe(csv()).on("data", (row) => {
        let fileNumber = getFileNumber(count, fileLength);
        dataFromTemplate = conditionTemplate(fileName, row);
        if (dataFromTemplate.PutRequest.Item.rk.S != "") {
            if (num != 20) {
                num++;
                data[tableName].push(dataFromTemplate);
            }
            else {
                let dataString = JSON.stringify(data);
                dataString = dataString.replace(/'/g, `'"'"'`);
                fs.appendFileSync(`output/gable.mb.esaving-open-acct.01.${fileNumber}.${filename}.${fileNumber}.sh`, awsBatchWrite + " '" + dataString + "'");
                count++;
                data[tableName] = [];
                data[tableName].push(dataFromTemplate);
                num = 1;
                console.log('Saved!');
            }
        }
    }).on("end", () => {
        let dataString = JSON.stringify(data);
        dataString = dataString.replace(/'/g, `'"'"'`);
        if (num != 20) {
            let fileNumber = getFileNumber(count, fileLength);
            fs.appendFileSync(`output/gable.mb.esaving-open-acct.01.${fileNumber}.${filename}.${fileNumber}.sh`, awsBatchWrite + " '" + dataString + "'");
        }
        console.log('Finish!');
    })
}

function getFileNumber(number, digit) {
    const currentLength = number.toString().length;
    let zero = "";
    if (currentLength !== digit) {
        for (let i = zero.length; i + currentLength < digit; i = zero.length) {
            zero += "0";
        }
        return zero + number.toString();
    }
    return number.toString();
}

function getLength(number) {
    return number.toString().length;
}

function getNumberOfLine(stream) {
    return new Promise(resolve => {
        let i;
        let count = 0;
        stream.on("data", function (chunk) {
            for (i = 0; i < chunk.length; ++i)
                if (chunk[i] == 10) count++;
        }).on("end", function () {
            resolve(count)
        })
    })
}

function conditionTemplate(fileName, data) {
    switch (fileName) {
        case "occupation.csv": {
            return template(data)
        }
        case "type-of-business.csv": {
            return templateType(data)
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
                hk: { S: "OCCUPATION" },
                rk: { S: data["KCPBCD"] },
                labelTh: { S: data["Label TH (Draft)*"] },
                labelEn: { S: data["Label EN (Draft)*"] },
                value: { S: data["KCPBCD"] },
                seq: { N: data["Ordering on Mobile"] === "Alphabetical" ? "0" : data["Ordering on Mobile"] },
                groupLabelTh: { S: data["Group Name TH"] },
                groupLabelEn: { S: data["Group Name EN"] },
                type: { S: "OCCUPATION" },
            }
        }
    };
}

function templateType(data) {
    let level = "";
    if (data["Final Level กรณี Lvl 1 <>90"]) level = data["Final Level กรณี Lvl 1 <>90"];
    else level = data["Final Level กรณี Lvl 1 =90"];
    return {
        PutRequest: {
            Item: {
                hk: { S: "TYPE_OF_BUSINESS" },
                rk: { S: data["BPBTYP"] },
                labelTh: { S: data["Label TH (Draft)*"] },
                labelEn: { S: data["Label EN (Draft)*"] },
                value: { S: data["BPBTYP"] },
                hasChild: { S: data["BPHFLG"] },
                level: { N: level },
                type: { S: "TYPE_OF_BUSINESS" },
                parent: { S: data["Parent"] ?? "" },
            }
        }
    };
}
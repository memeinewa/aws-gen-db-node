# Generate Batch Write Item AWS

## Installation
```
npm install

const tableName = ""; // dynamodb table name

const stream = fs.createReadStream("./csv/" + fileName); // copy file csv to folder csv

function conditionTemplate(fileName, data) {
    switch (fileName) {
        case "": { // add condition filename and template
            return template(data)
        }
        default: {
            throw new Error("'fileName not found'");
        }
    }
}

function template(data) { // write template data
    return {
        PutRequest: {
            Item: {
                hk: { S: data["hk"] },
                rk: { S: data["rk"] },
            }
        }
    };
}
```

## Usage
```
node create <filename>
```
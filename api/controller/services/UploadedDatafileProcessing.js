var request = require('request').defaults({
  encoding: null,
});
let mongoose = require('mongoose');
var fs = require('fs');
let XLSX = require('xlsx');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');

const Inventory = require('./../../models/Inventory');
const InventoryInfo = require('./../../models/InventoryInfo');
const DataFileUpload = require('./../../models/DataFileUpload');
const UtilController = require('./../services/UtilController');
const AwsController = require('./../services/AwsController');

const awsConfig = require('./../../../config/connection');
const AWS = require('aws-sdk');
AWS.config.update({
  secretAccessKey: awsConfig.aws.secretAccessKey,
  accessKeyId: awsConfig.aws.accessKeyId,
  region: awsConfig.aws.region,
});

module.exports = {
  processFile: async (dataFile, filePath, userId) => {
    try {
      console.log('fromProcess', dataFile.operationType);
      // read the excel sheet and pass the data in each method
      fs.readFile(filePath, async function (err, data) {
        if (err) {
          console.error(err);
          console.log(err);
        } else {
          switch (dataFile.operationType) {
            case 'uploadInventoryItems':
              module.exports.updateInventoryItems(
                dataFile,
                filePath,
                userId,
                data
              );
              break;
            case 'uploadInventoryStock':
              module.exports.updateInventoryStock(
                dataFile,
                filePath,
                userId,
                data
              );
              break;
            case 'uploadInventoryPrice':
              module.exports.updateInventoryPrice(
                dataFile,
                filePath,
                userId,
                data
              );
              break;
            case 'writeExcelFile':
              module.exports.writeExcelFile(dataFile);
              break;
            default:
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
  writeExcelFile: async (dataFile) => {
    var ws = XLSX.utils.json_to_sheet([
      {
        A: 'S',
        B: 'h',
        C: 'e',
        D: 'e',
        E: 't',
        F: 'J',
        G: 'S',
      },
      {
        A: 1,
        B: 2,
        C: 3,
        D: 4,
        E: 5,
        F: 6,
        G: 7,
      },
      {
        A: 2,
        B: 3,
        C: 4,
        D: 5,
        E: 6,
        F: 7,
        G: 8,
      },
    ]);
    // console.log("ws");
    var wb = XLSX.utils.book_new();
    var ws_name = 'SheetJS';

    /* make worksheet */
    var ws_data = [
      ['S', 'h', 'e', 'e', 't', 'J', 'S'],
      [1, 2, 3, 4, 5],
    ];
    // var ws = XLSX.utils.aoa_to_sheet(ws_data);

    /* Add the worksheet to the workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    // console.log(ws);
    var wopts = {
      bookType: 'xlsx',
      type: 'base64',
    };

    var wbout = XLSX.write(wb, wopts);

    // base 64 decode
    let bufferObj = Buffer.from(wbout, 'base64');
    // Encode the Buffer as a utf8 string
    let decodedContent = bufferObj.toString('utf8');
    wbout = decodedContent;
    XLSX.writeFile(wb, 'out.xlsx');
    await AwsController.upload2AWS(
      'E:\\Clients\\Myanmar\\Medimall\\_workspace\\medimall-server\\out.xlsx',
      'pimarq/inventory/processed',
      'test111.xlsx'
    ); // this is async call, will not wait until to finish upload
    // XLSX.writeFile(ws, fs || ('SheetJSTableExport.xlsx'));
    // var s3 = new AWS.S3();
    // params = {
    //   ACL: 'public-read', // public-read / authenticated-read
    //   Bucket: 'pimarq/inventory/processed',
    //   Key: "test123.xlsx",
    //   Body: wbout,
    //   ContentEncoding: 'base64',
    //   ContentType:'application/octet-stream',
    //   CacheControl: 'max-age=31536000'
    // };
    // s3.putObject(params, function(err, data) {
    //   if (err) {
    //     console.error(err);
    //     console.log(err);
    //     return false;
    //   } else {
    //     return true;
    //   }
    // });
  },
  updateInventoryItems: async (dataFile, filePath, userId, data) => {
    let uploadStatus = 'processed';
    let processedData = [];
    let errorData = [];
    try {
      console.log('fromuploadInventory', dataFile.uploadedFilePath.toString());

      let workbook = XLSX.read(data, {
        type: 'buffer',
      }); //buffer data convert into workbook data
      let wsname = workbook.SheetNames[0]; // get the workbook sheet name
      let ws = workbook.Sheets[wsname]; //access data from workbook by sheet name
      let excelJSON = XLSX.utils.sheet_to_json(ws); // workbook data convert into json format
      let additionaWsname = workbook.SheetNames[1];
      let additionaWs = workbook.Sheets[additionaWsname];
      //  console.log("additionaWs",additionaWs);
      let additionalInfoJson = XLSX.utils.sheet_to_json(additionaWs); // workbook data convert into json format

      for (let i = 0; i < excelJSON.length; i++) {
        //generate searchableTitle from title
        if (!UtilController.isEmpty(excelJSON[i].title)) {
          excelJSON[i].searchableTitle =
            excelJSON[i].title
              .trim()
              .replace(/[.']/g, '')
              .replace(/[^a-zA-Z0-9]/g, '-')
              .toLowerCase() +
            '-' +
            excelJSON[i].productSku;
        } else {
          excelJSON[i].searchableTitle = '';
        }
        //split images by , and create as a array
        if (
          excelJSON[i].images !== undefined &&
          excelJSON[i].images !== null &&
          excelJSON[i].images !== ''
        ) {
          excelJSON[i].images = excelJSON[i].images.split(',');
        } else {
          excelJSON[i].images = new Array();
        }
        //split substitutes by , and create as a array
        if (
          excelJSON[i].substitutes !== undefined &&
          excelJSON[i].substitutes !== null &&
          excelJSON[i].substitutes !== ''
        ) {
          excelJSON[i].substitutes = excelJSON[i].substitutes.split(',');
        } else {
          excelJSON[i].substitutes = new Array();
        }
        excelJSON[i]['operatedBy'] = userId;

        //generate or set additionalInfo object
        let additionalArray = new Array();
        for (keys in additionalInfoJson[i]) {
          if (
            !UtilController.isEmpty(additionalInfoJson[i]['productSku']) &&
            additionalInfoJson[i]['productSku'] === excelJSON[i]['productSku']
          ) {
            if (keys !== 'productSku') {
              additionalArray.push({
                heading: keys,
                content: new Buffer(additionalInfoJson[i][keys]).toString(
                  'base64'
                ),
                contentType: 'text',
              });
            }
          }
        }
        excelJSON[i]['isCompleted'] = true;

        excelJSON[i]['additionalInfo'] = additionalArray;

        //await Inventory.create(excelJSON[i]);
        if (!UtilController.isEmpty(excelJSON[i].productSku)) {
          module.exports.operateInventoryCollection(excelJSON[i], 'create');
          delete excelJSON[i]['additionalInfo'];
          processedData.push(excelJSON[i]);
        }
      }
    } catch (err) {
      console.error(err);
      uploadStatus = 'error';
    }
    // write a excel sheet which is processed or error and update status
    module.exports.uploadProcessedExcel2Aws(processedData, uploadStatus, {
      _id: dataFile._id,
      fileName: dataFile.fileName,
    });
    if (errorData.length > 0) {
      // if any error then update those records in excel and upload into s3
      module.exports.uploadProcessedExcel2Aws(errorData, uploadStatus, {
        _id: dataFile._id,
        fileName: dataFile.fileName,
      });
    }
  },

  uploadProcessedExcel2Aws: async (jsonData, status, dataFile) => {
    try {
      // status can be processed or error
      var ws_data = XLSX.utils.json_to_sheet(jsonData);

      var wb = XLSX.utils.book_new();
      var ws_name = 'Inventory';
      /* Add the worksheet to the workbook */
      XLSX.utils.book_append_sheet(wb, ws_data, ws_name);

      const wbout = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });

      let fileName = Date.now() + '_' + dataFile.fileName;
      let bucket = awsConfig.aws.inventoryUploadProcessed;
      if (status === 'error') {
        bucket = awsConfig.aws.inventoryUploadError;
      }

      let awsResultUrl = await AwsController.uploadExcel2AwsWithReturn(
        wbout,
        bucket,
        fileName
      );
      let processedFilePath, errorFilePath;
      if (status === 'error') {
        errorFilePath = awsResultUrl;
      } else {
        processedFilePath = awsResultUrl;
      }
      await DataFileUpload.findByIdAndUpdate(dataFile._id, {
        status: status,
        processedFilePath,
        errorFilePath,
        updatedAt: Math.floor(Date.now() / 1000),
      });
    } catch (err) {
      console.error(err);
    }
  },

  operateInventoryCollection: async (inventoryObj, operationType) => {
    try {
      console.log('operateinventory');
      switch (operationType) {
        case 'create':
          let inventoryCnt = await Inventory.countDocuments({
            productSku: inventoryObj.productSku,
          });
          if (inventoryCnt === 0) {
            await Inventory.create(inventoryObj);
            await InventoryInfo.create(inventoryObj);
          } else {
            inventoryObj.updatedAt = Math.floor(Date.now() / 1000);
            await Inventory.findOneAndUpdate(
              {
                productSku: inventoryObj.productSku,
              },
              inventoryObj
            );
            // update in inventoryinfo collection also
            await InventoryInfo.findOneAndUpdate(
              {
                productSku: inventoryObj.productSku,
              },
              inventoryObj
            );
          }
          break;
        case 'update':
          inventoryObj.updatedAt = Math.floor(Date.now() / 1000);
          await Inventory.findOneAndUpdate(
            {
              productSku: inventoryObj.productSku,
            },
            inventoryObj
          );
          break;
        case 'updateStock':
          await Inventory.findOneAndUpdate(
            {
              productSku: inventoryObj.productSku,
            },
            {
              $inc: {
                available: inventoryObj.available,
              },
              operatedBy: inventoryObj.operatedBy,
              updatedAt: Math.floor(Date.now() / 1000),
            }
          );
          break;

        default:
      }
    } catch (err) {
      console.error(err);
    }
  },
  updateInventoryStock: async (dataFile, filePath, userId, data) => {
    let uploadStatus = 'processed';
    let processedData = [];
    let errorData = [];
    try {
      let workbook = XLSX.read(data, {
        type: 'buffer',
      }); //buffer data convert into workbook data
      let wsname = workbook.SheetNames[0]; // get the workbook sheet name
      let ws = workbook.Sheets[wsname]; //access data from workbook by sheet name
      let excelJSON = XLSX.utils.sheet_to_json(ws); // workbook data convert into json format

      for (let i = 0; i < excelJSON.length; i++) {
        //generate searchableTitle from title
        if (
          excelJSON[i].productSku !== undefined &&
          excelJSON[i].productSku !== null &&
          excelJSON[i].productSku !== ''
        ) {
          excelJSON[i].searchableTitle = excelJSON[i].title
            .trim()
            .replace(/[.']/g, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
          excelJSON[i].productSku = excelJSON[i].productSku;
        } else {
          excelJSON[i].searchableTitle = '';
          excelJSON[i].productSku = '';
        }
        console.log(excelJSON[i]);
        excelJSON[i].operatedBy = userId;
        if (!UtilController.isEmpty(excelJSON[i].productSku)) {
          module.exports.operateInventoryCollection(
            excelJSON[i],
            'updateStock'
          );
          processedData.push(excelJSON[i]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    // write a excel sheet which is processed or error and update status
    module.exports.uploadProcessedExcel2Aws(processedData, uploadStatus, {
      _id: dataFile._id,
      fileName: dataFile.fileName,
    });
    if (errorData.length > 0) {
      // if any error then update those records in excel and upload into s3
      module.exports.uploadProcessedExcel2Aws(errorData, uploadStatus, {
        _id: dataFile._id,
        fileName: dataFile.fileName,
      });
    }
  },
  updateInventoryPrice: async (dataFile, filePath, userId, data) => {
    let uploadStatus = 'processed';
    let processedData = [];
    let errorData = [];
    try {
      let workbook = XLSX.read(data, {
        type: 'buffer',
      }); //buffer data convert into workbook data
      let wsname = workbook.SheetNames[0]; // get the workbook sheet name
      let ws = workbook.Sheets[wsname]; //access data from workbook by sheet name
      let excelJSON = XLSX.utils.sheet_to_json(ws); // workbook data convert into json format

      for (let i = 0; i < excelJSON.length; i++) {
        //generate searchableTitle from title
        let pricingList = [];
        if (
          excelJSON[i].productSku !== undefined &&
          excelJSON[i].productSku !== null &&
          excelJSON[i].productSku !== ''
        ) {
          excelJSON[i].productSku = excelJSON[i].productSku;
          pricingList.push({
            provider: '1mg', // like 1mg, netmats
            sourceLink: excelJSON[i].sourceLink, // website link where pricing data is fetching
            price: excelJSON[i].price,
            discount: excelJSON[i].discount,
            tax: excelJSON[i].tax,
            shipping: excelJSON[i].shipping,
            updatedAt: Math.floor(Date.now() / 1000),
          });
          excelJSON[i]['pricingList'] = pricingList;
        } else {
          excelJSON[i].productSku = '';
        }
        excelJSON[i].operatedBy = userId;
        if (!UtilController.isEmpty(excelJSON[i].productSku)) {
          module.exports.operateInventoryCollection(excelJSON[i], 'update'); // even in create parameter, price will update
          processedData.push(excelJSON[i]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    // write a excel sheet which is processed or error and update status
    module.exports.uploadProcessedExcel2Aws(processedData, uploadStatus, {
      _id: dataFile._id,
      fileName: dataFile.fileName,
    });
    if (errorData.length > 0) {
      // if any error then update those records in excel and upload into s3
      module.exports.uploadProcessedExcel2Aws(errorData, uploadStatus, {
        _id: dataFile._id,
        fileName: dataFile.fileName,
      });
    }
  },
};

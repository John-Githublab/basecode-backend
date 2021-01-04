let request = require('request');
let mongoose = require('mongoose');
var Excel = require('exceljs');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Case = require('./../../models/Case');
const Inventory = require('./../../models/Inventory');
const DataFileUpload = require('./../../models/DataFileUpload');
const UploadedDatafileProcessing = require('./../services/UploadedDatafileProcessing');
const Option = require('./../../models/Option');
let XLSX = require('xlsx');
const Tag = require('./../../models/Tag');

const awsConfig = require('../../../config/connection');
const AwsController = require('../services/AwsController');
const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  excelOperationCheck: async (req, res, next) => {
    let response = {
      operationType: 'writeExcelFile',
    };
    UploadedDatafileProcessing.processFile(response);
    UtilController.sendSuccess(req, res, next, {});
  },
  queryInventory: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;

      let queryObj = {
        active: true,
      };

      if (
        !UtilController.isEmpty(req.body.availableQuery) &&
        req.body.availableQuery !== 'all'
      ) {
        queryObj['available'] = { $lt: req.body.availableQuery };
      }

      if (
        !UtilController.isEmpty(req.body.isCompleted) &&
        req.body.isCompleted !== 'all'
      ) {
        queryObj['isCompleted'] = req.body.isCompleted;
      }

      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            title: {
              $regex: searchKey,
              $options: 'i',
            },
          },

          {
            brand: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            company: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }
      let sortOrder = {};
      if (req.body.sortOrder !== '' && req.body.sortField !== '') {
        sortOrder[req.body.sortField] = req.body.sortOrder === 'false' ? -1 : 1;
      } else {
        sortOrder = {
          updatedAt: -1,
        };
      }
      console.log('query', queryObj);
      let result = await Inventory.find(queryObj)
        .sort(sortOrder)
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await Inventory.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / req.body.pageSize),
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  uploadItems: async (req, res, next) => {
    try {
      let fileupload = req.body;
      fileupload['userId'] = req.session.userId;
      fileupload['status'] = 'inprocess';
      fileupload['collectionName'] = 'inventories';
      fileupload['operationType'] = 'uploadInventoryItems';
      fileupload['trackId'] = Math.random().toString(36).slice(-8);
      let storagePath = await UtilController.uploadFilesToStorage(
        awsConfig.aws.inventoryUploadItems,
        req,
        res,
        next
      );
      if (
        storagePath !== undefined &&
        storagePath !== null &&
        storagePath.length > 0
      ) {
        fileupload['uploadedFilePath'] = storagePath[0];
      }
      let response = await DataFileUpload.create(fileupload);
      UploadedDatafileProcessing.processFile(
        response,
        req.files.attachment.path,
        req.session.userId
      );

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  uploadStock: async (req, res, next) => {
    try {
      let fileupload = req.body;
      fileupload['userId'] = req.session.userId;
      fileupload['status'] = 'inprocess';
      fileupload['collectionName'] = 'inventories';
      fileupload['operationType'] = 'uploadInventoryStock';
      fileupload['trackId'] = Math.random().toString(36).slice(-8);
      let storagePath = await UtilController.uploadFilesToStorage(
        awsConfig.aws.inventoryUploadStock,
        req,
        res,
        next
      );
      if (
        storagePath !== undefined &&
        storagePath !== null &&
        storagePath.length > 0
      ) {
        fileupload['uploadedFilePath'] = storagePath[0];
      }
      let response = await DataFileUpload.create(fileupload);
      UploadedDatafileProcessing.processFile(
        response,
        req.files.attachment.path,
        req.session.userId
      );

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  uploadPrice: async (req, res, next) => {
    try {
      let fileupload = req.body;
      fileupload['userId'] = req.session.userId;
      fileupload['status'] = 'inprocess';
      fileupload['collectionName'] = 'inventories';
      fileupload['operationType'] = 'uploadInventoryPrice';
      fileupload['trackId'] = Math.random().toString(36).slice(-8);
      let storagePath = await UtilController.uploadFilesToStorage(
        awsConfig.aws.inventoryUploadStock,
        req,
        res,
        next
      );
      if (
        storagePath !== undefined &&
        storagePath !== null &&
        storagePath.length > 0
      ) {
        fileupload['uploadedFilePath'] = storagePath[0];
      }
      let response = await DataFileUpload.create(fileupload);
      UploadedDatafileProcessing.processFile(
        response,
        req.files.attachment.path,
        req.session.userId
      );

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  createInventoryFromMedication: async (req, res, next) => {
    try {
      let createObj = req.body;

      let result;

      let countedResult = await Inventory.find({
        title: { $regex: createObj.title.trim(), $options: 'i' },
        form: { $regex: createObj.form.trim(), $options: 'i' },
        dosageForm: { $regex: createObj.dosageForm.trim(), $options: 'i' },
      }).select('title form dosageForm');

      if (countedResult.length === 0) {
        createObj['operatedBy'] = req.session.userId;
        createObj['isCompleted'] = false;

        let tagResult = await Tag.findOneAndUpdate(
          {
            active: true,
            tagType: 'manualInventoryUpload',
          },
          { $inc: { sequenceNo: 1 }, updatedAt: Math.floor(Date.now() / 1000) }
        );

        createObj['productSku'] =
          tagResult.prefix + UtilController.pad(tagResult.sequenceNo, 5);

        result = await Inventory.create(createObj);
      } else {
        result = countedResult[0];
      }

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  uploadInventoryImages: async (req, res, next) => {
    try {
      let result = await UtilController.uploadFileWithReturn(
        awsConfig.aws.inventoryUploadImages,
        req,
        res,
        next
      );

      let convertResult = [];
      result.forEach((result) => {
        convertResult.push({
          'File Name': decodeURIComponent(
            result.substring(result.indexOf('_') + 1, result.lastIndexOf('.'))
          ),
          'Inventory Images': result,
        });
      });
      var ws_data = XLSX.utils.json_to_sheet(convertResult);

      var wb = XLSX.utils.book_new();
      var ws_name = 'Inventory Images';

      /* Add the worksheet to the workbook */
      XLSX.utils.book_append_sheet(wb, ws_data, ws_name);

      const wbout = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });

      let fileName = Date.now() + '_' + 'inventoryImages.xlsx';
      let bucket = awsConfig.aws.inventoryUploadExcel;

      let awsResultUrl = await AwsController.uploadExcel2AwsWithReturn(
        wbout,
        bucket,
        fileName
      );

      let data2datafileuploadcollection = {};

      data2datafileuploadcollection['active'] = true;
      data2datafileuploadcollection['userId'] = req.session.userId;
      data2datafileuploadcollection['status'] = 'processed';
      data2datafileuploadcollection['menuName'] = 'inventory';
      data2datafileuploadcollection['message'] = '';
      data2datafileuploadcollection['collectionName'] = 'inventories';
      data2datafileuploadcollection['fileName'] = fileName;
      data2datafileuploadcollection['processedFilePath'] = awsResultUrl;
      data2datafileuploadcollection['operationType'] = 'uploadInventoryImage';
      data2datafileuploadcollection['trackId'] = Math.random()
        .toString(36)
        .slice(-8);

      await DataFileUpload.create(data2datafileuploadcollection);

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      console.log('uploadFiles -catch');
      console.log(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  getOptions: async (req, res, next) => {
    let name = req.body.name;
    let queryObj = {
      name,
    };

    try {
      let options = await Option.find(queryObj);

      UtilController.sendSuccess(req, res, next, {
        options,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  searchInventory: async (req, res, next) => {
    try {
      let result;
      let searchKey = req.body.keyword;
      let queryObj = {
        active: true,
      };

      if (!UtilController.isEmpty(req.body.recordId)) {
        let caseResult = await Case.findById(req.body.recordId)
          .select('medicineList')
          .populate('medicineList', 'itemId');

        let excludeResult = [];

        for (let i = 0; i < caseResult.medicineList.length; i++) {
          excludeResult.push(caseResult.medicineList[i].itemId);
        }

        queryObj['_id'] = {
          $nin: excludeResult,
        };
      }

      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            title: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            dosageForm: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            form: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }

      if (!UtilController.isEmpty(searchKey)) {
        result = await Inventory.fuzzySearch(searchKey, queryObj)
          .limit(40)
          .select(
            'title searchableTitle dosageForm productSku brand form category itemType price discount tax shipping available pricingList'
          )
          .sort({
            title: 1,
          });
      } else {
        result = await Inventory.find(queryObj)
          .limit(40)
          .sort({
            title: 1,
          })
          .select(
            'title searchableTitle productSku brand category itemType price discount tax shipping available pricingList'
          );
      }

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};

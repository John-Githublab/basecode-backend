let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('../../../config/responseCode').returnCode;
const Advertisement = require('../../models/Advertisement');
const NotificationController = require('../services/NotificationController');
const UtilController = require('../services/UtilController');
const Inventory = require('./../../models/Inventory');

module.exports = {
  queryAdvertisement: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let queryObj = { active: req.body.active };

      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            title: {
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
      let planResult = await Advertisement.find(queryObj)

        .sort(sortOrder)
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await Advertisement.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: planResult,
        pages: Math.ceil(pageCount / req.body.pageSize),
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getAdvertisementInfoById: async (req, res, next) => {
    try {
      let AdvId = req.body.AdvId;
      let adv = await Advertisement.findById(AdvId).populate(
        'products',
        'title category '
      );

      UtilController.sendSuccess(req, res, next, {
        adv,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  createAdvertisement: async (req, res, next) => {
    try {
      let createObj = req.body;
      createObj.startAt = Math.floor(
        new Date(createObj.startAt).getTime() / 1000.0
      );
      createObj.endAt = Math.floor(
        new Date(createObj.endAt).getTime() / 1000.0
      );
      createObj.searchKey = createObj.searchKey.toString();

      createObj['createdAt'] = Math.floor(Date.now() / 1000);
      createObj['operatedBy'] = req.session.userId;
      let responseCode = returnCode.duplicate;
      let AdvertisementCount = await Advertisement.countDocuments(createObj);
      if (AdvertisementCount === 0) {
        await Advertisement.create(createObj);
        responseCode = returnCode.validSession;
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getSearch: async (req, res, next) => {
    try {
      let search = await Inventory.find({});
      UtilController.sendSuccess(req, res, next, {
        search,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  // updateAdvertisement: async (req, res, next) => {
  //   console.log(req.body.AdvId);
  //   try {
  //     await Advertisement.findByIdAndUpdate(req.body.AdvId, {
  //       title: req.body.title,
  //       tagline: req.body.tagline,
  //       description: req.body.description,
  //       siteLink: req.body.siteLink,
  //       priority: req.body.priority,
  //       active: req.body.active,
  //     });
  //     UtilController.sendSuccess(req, res, next, {});
  //   } catch (err) {
  //     UtilController.sendError(req, res, next, err);
  //   }
  // },

  deleteAdvertisement: async (req, res, next) => {
    try {
      await Advertisement.findByIdAndUpdate(req.body.AdvId, {
        active: false,
        updatedAt: Math.floor(Date.now() / 1000),
        $push: {
          logs: {
            recordId: req.session.recordId,
            data: {
              active: true,
            },
          },
        },
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateAdvertisement: async (req, res, next) => {
    try {
      let adv = await Advertisement.findById(req.body.AdvId);

      let updateObj = req.body;

      updateObj.startAt = Math.floor(
        new Date(updateObj.startAt).getTime() / 1000.0
      );
      updateObj.endAt = Math.floor(
        new Date(updateObj.endAt).getTime() / 1000.0
      );
      updateObj.searchKey = updateObj.searchKey.toString();

      updateObj['updatedAt'] = Math.floor(Date.now() / 1000);
      updateObj['operatedBy'] = req.session.userId;

      await Advertisement.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.AdvId),
          // operatedBy: mongoose.Types.ObjectId(req.session.userId),
        },
        updateObj
      ).select('-id');

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getOrderFromInventory: async (req, res, next) => {
    let searchableTitle = req.body.itemName;
    let query = {
      searchableTitle,
    };
    try {
      let item = await Inventory.find(query).populate(
        'itemList.itemId',
        'itemType'
      );
      // console.log("update resp", item, itemName);

      UtilController.sendSuccess(req, res, next, {
        item,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },
};

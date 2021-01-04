let request = require("request");
let mongoose = require("mongoose");
const returnCode = require("./../../../config/responseCode").returnCode;
const User = require("./../../models/User");
const Order = require("./../../models/Order");
const Tag = require("./../../models/Tag");

const Inventory = require("./../../models/Inventory");
const Option = require("./../../models/Option");
const AddToCart = require("./../../models/AddToCart");
const NotificationController = require("./../services/NotificationController");
const UtilController = require("./../services/UtilController");

module.exports = {
  queryAllOrder: async (req, res, next) => {
    try {
      console.log(req.body.startDate, req.body.endDate);
      let searchKey = req.body.keyword;

      let queryObj = { active: req.body.active };

      if (
        !UtilController.isEmpty(req.body.orderType) &&
        req.body.orderType !== "all"
      ) {
        queryObj["orderType"] = req.body.orderType;
      }
      if (
        !UtilController.isEmpty(req.body.status) &&
        req.body.status !== "all"
      ) {
        queryObj["status"] = req.body.status;
      }
      if (
        !UtilController.isEmpty(req.body.startDate) &&
        !UtilController.isEmpty(req.body.endDate)
      ) {
        queryObj["createdAt"] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };
      }
      let checkSuperAdmin = await User.findById(req.session.userId);

      if (checkSuperAdmin.isSuperAdmin !== true) {
        queryObj["assignedId"] = req.session.userId;
      }

      console.log("querytest", queryObj);

      if (!UtilController.isEmpty(searchKey)) {
        queryObj["$or"] = [
          {
            mobileNo: {
              $regex: searchKey,
              $options: "i",
            },
          },
          {
            userName: {
              $regex: searchKey,
              $options: "i",
            },
          },
          {
            orderId: {
              $regex: searchKey,
              $options: "i",
            },
          },
        ];
      }
      let sortOrder = {};
      if (req.body.sortOrder !== "" && req.body.sortField !== "") {
        sortOrder[req.body.sortField] = req.body.sortOrder === "false" ? -1 : 1;
      } else {
        sortOrder = {
          updatedAt: -1,
        };
      }

      console.log("query", queryObj);
      let result = await Order.find(queryObj)
        .populate("userId", "name mobileNo email")
        .populate("assignedId", "fname lname")
        .sort(sortOrder)
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await Order.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / req.body.pageSize),
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getOrdersById: async (req, res, next) => {
    try {
      let itemId = req.body.itemId;
      let item = await Order.findById(itemId)
        .populate("itemList.itemId", "itemType")
        .populate("userId", "name")
        .populate("assignedId", "fname lname");
      // console.log("update resp", item, itemId);

      UtilController.sendSuccess(req, res, next, {
        item,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  getOrderFromInventory: async (req, res, next) => {
    console.log("body", req.body);
    if (req.body.itemId) {
      try {
        let item = await Inventory.findById(req.body.itemId);

        // console.log("update resp", item, itemName);

        UtilController.sendSuccess(req, res, next, {
          item,
        });
        console.log("byname", item);
      } catch (err) {
        console.error(err);
        UtilController.sendError(req, res, next, err);
      }
    } else {
      let searchableTitle = req.body.itemName;
      console.log("se", searchableTitle);
      let query = {
        searchableTitle,
      };
      try {
        let item = await Inventory.find(query).populate(
          "itemList.itemId",
          "itemType"
        );
        // console.log("update resp", item, itemName);

        UtilController.sendSuccess(req, res, next, {
          item,
        });
        console.log("byname", item);
      } catch (err) {
        console.error(err);
        UtilController.sendError(req, res, next, err);
      }
    }
  },
  addOrder: async (req, res, next) => {
    try {
      let createObj = req.body;
      createObj["operatedBy"] = req.session.userId;

      let tagResult = await Tag.findOneAndUpdate(
        {
          active: true,
          tagType: "order",
        },
        { $inc: { sequenceNo: 1 }, updatedAt: Math.floor(Date.now() / 1000) }
      );
      createObj["orderId"] =
        tagResult.prefix + UtilController.pad(tagResult.sequenceNo, 4);
      createObj["updatedAt"] = Math.floor(Date.now() / 1000);
      createObj["createdAt"] = Math.floor(Date.now() / 1000);

      await Order.create(createObj);
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  updateOrder: async (req, res, next) => {
    try {
      console.log(req.body);
      let item = await Order.findById(req.body.itemId);
      console.log("from update", item, req.body.itemId);
      let updateObj = req.body;
      updateObj["updatedAt"] = Math.floor(Date.now() / 1000);
      updateObj["operatedBy"] = req.session.userId;
      console.log("updateobj", updateObj);
      let token = await Order.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.itemId),
          // operatedBy: mongoose.Types.ObjectId(req.session.userId),
        },

        updateObj
      );

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getSearch: async (req, res, next) => {
    let title = req.body.title;
    let queryObj = {};

    try {
      let search = await Inventory.find({});
      console.log("search", search);
      UtilController.sendSuccess(req, res, next, {
        search,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getUserByName: async (req, res, next) => {
    let userName = req.body.userName;
    let query = {
      userName,
    };
    try {
      let user = await User.find(query);
      console.log("update resp", user);

      UtilController.sendSuccess(req, res, next, {
        user,
      });
      console.log("byname", user);
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  getUserSearch: async (req, res, next) => {
    let userName = req.body.userName;
    let queryObj = {};
    if (!UtilController.isEmpty(userName)) {
      queryObj["$or"] = [
        {
          userName: {
            $regex: userName,
            $options: "i",
          },
        },
      ];
    }

    try {
      let search = await User.find(queryObj).select(
        "userName fname lname _id userType"
      );

      UtilController.sendSuccess(req, res, next, {
        search,
      });
    } catch (err) {
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
};

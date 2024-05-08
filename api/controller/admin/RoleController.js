let request = require("request");
let mongoose = require("mongoose");
const returnCode = require("./../../../config/responseCode").returnCode;
const roleConfig = require("./../../../config/roleConfig");
const User = require("./../../../features/auth/model/User");
const Role = require("./../../models/Role");

const VersionTrack = require("./../../models/VersionTrack");
const NotificationController = require("./../services/NotificationController");

const UtilController = require("./../services/UtilController");
module.exports = {
  queryRole: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let queryObj = {
        active: req.body.active,
        // owner: mongoose.Types.ObjectId(req.session.userId),
      };

      if (!UtilController.isEmpty(searchKey)) {
        queryObj["$or"] = [
          {
            name: {
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
      let planResult = await Role.find(queryObj)
        .populate("owner", "fname userTag email profileImage")
        .populate("createdBy", "fname userTag email userType profileImage")
        .sort(sortOrder)
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await Role.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: planResult,
        pages: Math.ceil(pageCount / req.body.pageSize),
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  queryTitle: async (req, res, next) => {
    try {
      let roles = await Role.find({ active: true }).select("name");

      UtilController.sendSuccess(req, res, next, {
        roles,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getRoleInfoById: async (req, res, next) => {
    try {
      let admins = [];
      let roleId = req.body.roleId;

      // let roleId = "5ef0cb15e815c50d8c93244f";
      let role = await Role.findById(roleId).select("-permission").lean();
      let permissionArray = [];
      let roleAggregate = await Role.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(roleId),
          },
        },
        {
          $unwind: {
            path: "$permission",
          },
        },
        {
          $group: {
            _id: "$permission.parentId",
            access: {
              $push: "$permission",
            },
          },
        },
      ]);
      console.log(roleAggregate);
      for (var i = 0; i < roleAggregate.length; i++) {
        if (UtilController.isEmpty(roleAggregate[i]._id)) {
          for (var j = 0; j < roleAggregate[i].access.length; j++) {
            let parentPermission = roleAggregate[i].access[j];
            let childIndex = roleAggregate.findIndex(
              (x) => x._id === parentPermission.label
            );
            if (childIndex > -1) {
              //parentPermission['child']=roleAggregate[childIndex].access;// if you need third level needs to loop here
              let level2Array = [];
              for (
                var k = 0;
                k < roleAggregate[childIndex].access.length;
                k++
              ) {
                let level2Permission = roleAggregate[childIndex].access[k];
                let level2Index = roleAggregate.findIndex(
                  (x) => x._id === level2Permission.label
                );

                if (level2Index > -1) {
                  level2Permission["child"] = roleAggregate[level2Index].access;
                } else {
                  level2Permission["child"] = [];
                }
                level2Array.push(level2Permission);
              }
              parentPermission["child"] = level2Array;
            } else {
              parentPermission["child"] = []; // keep empty array
            }
            permissionArray.push(parentPermission);
          }
        }
      }
      role.permission = permissionArray;
      // let userResult = await User.find({
      //   active: true,
      //   permission: {
      //     $eq: roleId,
      //   },
      // });
      // for (var i = 0; i < userResult.length; i++) {
      //   admins.push(userResult[i]._id);
      // }
      UtilController.sendSuccess(req, res, next, {
        role,
        // admins,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  getRoleName: async (req, res, next) => {
    try {
      let queryObj = {
        active: true,
        owner: mongoose.Types.ObjectId(req.session.userId),
      };
      let activeRole = await Role.find(queryObj, "name");

      UtilController.sendSuccess(req, res, next, {
        activeRole,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  createRole: async (req, res, next) => {
    try {
      let responseCode = returnCode.duplicate;
      let roleCount = await Role.countDocuments({
        name: req.body.name.trim(),
        owner: req.session.userId,
      });
      if (roleCount === 0) {
        var addRoledata = {
          name: req.body.name,
          active: req.body.active,
          owner: req.session.userId,
          permission: roleConfig.permission,
          operatedBy: req.session.userId,
        };
        await Role.create(addRoledata);
        responseCode = returnCode.validSession;
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateRolePermission: async (req, res, next) => {
    try {
      let oldResult = await Role.findOne({
        _id: mongoose.Types.ObjectId(req.body.roleId),
      });
      await Role.findByIdAndUpdate(req.body.roleId, {
        permission: req.body.permission,
        name: req.body.name,
        active: req.body.active,
        owner: req.session.userId,
        updatedAt: Math.floor(Date.now() / 1000),
      });

      console.log(req.body);

      await VersionTrack.create({
        recordId: req.body.recordId,
        operatedBy: req.session.userId,
        data: oldResult,
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getUnassigned: async (req, res, next) => {
    try {
      console.log("assigned");
      let employees = await User.find({
        active: true,
        userType: "admin",
      });
      let admins = [];
      let userResult = await User.find({
        active: true,
        permission: {
          $eq: req.body.roleId,
        },
      });
      for (var i = 0; i < userResult.length; i++) {
        admins.push(userResult[i]._id);
      }
      UtilController.sendSuccess(req, res, next, {
        employees,
        admins,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  deleteRole: async (req, res, next) => {
    try {
      let updateObj = req.body;

      let oldDeleteResult = await Role.findOne({
        _id: mongoose.Types.ObjectId(req.body.recordId),
        operatedBy: mongoose.Types.ObjectId(req.session.userId),
      });
      await Role.findByIdAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.recordId),
          userId: mongoose.Types.ObjectId(req.session.userId),
        },
        {
          active: false,
          updatedAt: Math.floor(Date.now() / 1000),
        }
      ).select("-id");
      console.log(req.body);

      await VersionTrack.create({
        recordId: req.body.recordId,
        operatedBy: req.session.userId,
        data: oldDeleteResult,
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  grantRole: async (req, res, next) => {
    try {
      let roleId = req.body.roleId;
      let assign = req.body.assign;
      // console.log(assign)

      await Role.findByIdAndUpdate(roleId, {
        updatedAt: Math.floor(Date.now() / 1000),
      });

      let userResult = await User.find({
        permission: roleId,
      });
      let assignedEmp = [];
      for (var a = 0; a < userResult.length; a++) {
        assignedEmp.push(userResult[a]._id.toString());
      }
      let grantPermission = assign.filter((x) => !assignedEmp.includes(x));
      let removePermission = assignedEmp.filter((x) => !assign.includes(x));
      // added permission
      for (var i = 0; i < grantPermission.length; i++) {
        module.exports.updateEmployeePermission(grantPermission[i], roleId);
      }
      // remove permission
      for (var j = 0; j < removePermission.length; j++) {
        module.exports.updateEmployeePermission(removePermission[j], null);
      }
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      console.log(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  updateEmployeePermission: async (empId, roleId) => {
    try {
      await User.findByIdAndUpdate(empId, {
        permission: roleId,
      });
    } catch (err) {
      console.error(err);
    }
  },
};

let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const roleConfig = require('./../../../config/roleConfig');
const User = require('./../../models/User');
const Role = require('./../../models/Role');
const NotificationController = require('./../services/NotificationController');

const UtilController = require('./../services/UtilController');

module.exports = {
  queryRole: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let queryObj = {
        //  active: req.body.status,
        owner: mongoose.Types.ObjectId(req.session.userId)
      }

      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [{
          'title': {
            $regex: searchKey,
            $options: 'i'
          }
        }];
      }
      let planResult = await Role.find(queryObj).populate('owner', 'name userTag email userType profileImage').populate('createdBy', 'name userTag email userType profileImage').sort({
        //isTemplate: -1,
        updatedAt: -1
      }).skip(req.body.page * req.body.pageSize).limit(req.body.pageSize);
      let pageCount = await Role.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: planResult,
        pages: Math.ceil(pageCount / req.body.pageSize)
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getRoleInfoById: async (req, res, next) => {

    try {
      let employees = [];
      let roleId = req.body.roleId;
      let role = await Role.findById(roleId);
      let employeeResult = await Employee.find({
        userId: req.session.userId,
        active: true,
        permission: {
          $eq: roleId
        }
      });
      for(var i = 0; i < employeeResult.length; i++){
        employees.push(employeeResult[i]._id);
      }
      UtilController.sendSuccess(req, res, next, {
        role,
        employees
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  createRole: async (req, res, next) => {
    try {
      var addRoledata = {
        name: req.body.name,
        owner: req.session.userId,
        permission: roleConfig.permission,
        createdBy: req.session.userId,
      };
      await Role.create(addRoledata);
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateRole: async (req, res, next) => {
    try {
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  deleteRole: async (req, res, next) => {
    try {
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateRolePermission: async (req, res, next) => {
    try {
      await Role.findByIdAndUpdate(req.body.roleId, {
        permission: req.body.permission,
        name: req.body.name,
        owner: req.session.userId,
        updatedAt: Math.floor(Date.now() / 1000)
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getUnassignedEmployee: async (req, res, next) => {
    try {
      let employees = await Employee.find({
        active: true,
        userId: req.session.userId,
        // permission: {
        //   $exists: true,
        //   // $eq: req.body.roleId
        // }
      });
      UtilController.sendSuccess(req, res, next, {
        employees
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  grantRole: async (req, res, next) => {
    try {
      let roleId = req.body.roleId;
      console.log(roleId)
      let assign = req.body.assign;
      // console.log(assign)
      let employeeResult = await Employee.find({
        permission: roleId
      });
      let assignedEmp = [];
      for (var a = 0; a < employeeResult.length; a++) {
        assignedEmp.push(employeeResult[a]);
      }
      let grantPermission = assign.filter(x => !assignedEmp.includes(x));
      let removePermission = assignedEmp.filter(x => !assign.includes(x));
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
      console.log(err)
      UtilController.sendError(req, res, next, err);
    }
  },
  updateEmployeePermission: async (empId, roleId) => {
    try {
      await Employee.findByIdAndUpdate(empId, {
        permission: roleId
      });
    } catch (err) {
      console.error(err);
    }
  },
  updateRolePolicy: async (req, res, next) => {
    try {
      await Role.findByIdAndUpdate(req.body.roleId, {
        policy: req.body.policy,
        owner: req.session.userId,
        updatedAt: Math.floor(Date.now() / 1000)
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getUnassignedPolicy: async (req, res, next) => {
    try {
      let policy = await Policy.find({
        _id: {

          $nin: req.body.policy
        },
        active: true,
        publish: true,
        isTemplate: true
      });
      UtilController.sendSuccess(req, res, next, {
        policy
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  }

}

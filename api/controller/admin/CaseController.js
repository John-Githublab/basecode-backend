let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Case = require('./../../models/Case');
const Doctor = require('./../../models/Doctor');
const Medication = require('./../../models/Medication');
const Tag = require('./../../models/Tag');
const Inventory = require('./../../models/Inventory');
const Option = require('./../../models/Option');
const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  queryAllCase: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let queryObj = {
        active: req.body.active,
        caseType: req.body.caseType,
        status: req.body.status,
      };

      if (req.body.active === 'all') {
        delete queryObj.active;
      }
      if (req.body.caseType === 'all') {
        delete queryObj.caseType;
      }
      if (req.body.status === 'all') {
        delete queryObj.status;
      }
      if (!UtilController.isEmpty(req.body.userId)) {
        queryObj['userId'] = req.body.userId;
      }

      if (
        !UtilController.isEmpty(req.body.startDate) &&
        !UtilController.isEmpty(req.body.endDate)
      ) {
        queryObj['createdAt'] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };
      }

      if (!req.session.isSuperAdmin) {
        queryObj['assignedUser'] = req.session.userId;
      }
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            caseId: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            mobileNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            userName: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            patientId: {
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

      let result = await Case.find(queryObj)
        .populate(
          'userId',
          'fname lname mobileNo email userType patientId bloodPressure profileImage city state'
        )
        .populate('assignedUser', 'fname lname')
        .populate('operatedBy', 'fname lname')
        .populate('doctor', 'name')
        .sort(sortOrder)
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await Case.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / req.body.pageSize),
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getCaseById: async (req, res, next) => {
    try {
      let result = await Case.findById(req.body.recordId)
        .populate(
          'userId',
          'fname lname mobileNo height dob weight age gender email bloodGroup allergies chronicConditions surgeries familyHistory bloodPressure patientId userType profileImage'
        )
        .populate('assignedUser', 'fname lname')
        .populate('assignedUsers', 'fname lname')
        .populate('doctor')
        .populate({
          path: 'medicineList',
          model: 'Medication',
          populate: {
            path: 'itemId',
            model: 'Inventory',
            select: 'form dosageForm title',
          },
        })
        // .populate('medicineList')
        .populate('operatedBy', 'fname lname');
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  createCase: async (req, res, next) => {
    try {
      let user = await User.findById(req.body.userId).select(
        'userName mobileNo fname patientId'
      );
      let createObj = {
        userId: req.body.userId,
        userName: user.fname,
        mobileNo: user.mobileNo,
        patientId: user.patientId,
        status: 'new',
        prescription: req.body.prescription,
      };
      if (!UtilController.isEmpty(req.body.caseType)) {
        createObj['caseType'] = req.body.caseType;
      }
      let tagResult = await Tag.findOneAndUpdate(
        {
          active: true,
          tagType: 'DC',
        },
        { $inc: { sequenceNo: 1 }, updatedAt: Math.floor(Date.now() / 1000) }
      );
      createObj['caseId'] =
        tagResult.prefix + UtilController.pad(tagResult.sequenceNo, 9);
      await Case.create(createObj);
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateCase: async (req, res, next) => {
    try {
      let updateObj = req.body;

      let userUpdate = {
        weight: updateObj.weight,
        allergies:
          updateObj.allergies !== undefined && updateObj.allergies !== null
            ? updateObj.allergies.toString()
            : '',
        chronicConditions:
          updateObj.chronicConditions !== undefined &&
          updateObj.chronicConditions !== null
            ? updateObj.chronicConditions.toString()
            : '',
        surgeries:
          updateObj.surgeries !== undefined && updateObj.surgeries !== null
            ? updateObj.surgeries.toString()
            : '',
        familyHistory:
          updateObj.familyHistory !== undefined &&
          updateObj.familyHistory !== null
            ? updateObj.familyHistory.toString()
            : '',

        'bloodPressure.high':
          updateObj.bloodPressure.high !== undefined
            ? updateObj.bloodPressure.high
            : 0,
        'bloodPressure.low':
          updateObj.bloodPressure.low !== undefined
            ? updateObj.bloodPressure.low
            : 0,
      };

      await User.findByIdAndUpdate(updateObj.userId, userUpdate);

      if (updateObj.doctor === '') {
        delete updateObj.doctor;
      }

      if (updateObj.doctor === undefined) {
        if (
          updateObj.doctorData.name !== '' &&
          updateObj.doctorData.hospital !== '' &&
          updateObj.doctorData.contact.officeNo !== ''
        ) {
          updateObj.doctorData['operatedBy'] = req.session.userId;
          let doctorCount = await Doctor.countDocuments({
            name: updateObj.doctorData.name,
            hospital: updateObj.doctorData.hospital,
            'contact.officeNo': updateObj.doctorData.contact.officeNo,
          });

          let doctorResult;
          if (doctorCount > 0) {
            doctorResult = await Doctor.findOneAndUpdate(
              {
                name: updateObj.doctorData.name,
                hospital: updateObj.doctorData.hospital,
                'contact.officeNo': updateObj.doctorData.contact.officeNo,
              },
              updateObj.doctorData
            );
          } else {
            doctorResult = await Doctor.create(updateObj.doctorData);
          }

          updateObj.doctor = doctorResult._id;
        }
      }

      let medicationList = updateObj.medicineList;

      updateObj.prescriptionDate = Math.floor(
        new Date(updateObj.prescriptionDate).getTime() / 1000.0
      );

      updateObj['updatedAt'] = Math.floor(Date.now() / 1000);

      let whenToTakeVal;

      let frequencyDatesVal;

      for (i = 0; i < medicationList.length; i++) {
        medicationList[i]['caseId'] = updateObj.caseId;
        medicationList[i]['userId'] = updateObj.userId;
        medicationList[i]['doctor'] = updateObj.doctor;
        medicationList[i]['prescriptionDate'] = updateObj.prescriptionDate;

        whenToTakeVal = Object.keys(medicationList[i].whenToTake).filter(
          function (el) {
            return medicationList[i].whenToTake[el] === true;
          }
        );

        medicationList[i].whenToTake = whenToTakeVal;

        frequencyDatesVal = medicationList[i].frequencyDates.map((dates) => {
          dates = dates.substr(0, 10) + 'T00:00:00.000';
          return Math.floor(Number(new Date(dates).getTime() / 1000.0));
        });

        medicationList[i].frequencyDates = frequencyDatesVal;

        medicationList[i]['startDate'] = Math.floor(
          new Date(
            new Date(medicationList[i].startDate).setHours(0, 0, 0, 0)
          ).getTime() / 1000
        );
        medicationList[i]['endDate'] = Math.floor(
          new Date(
            new Date(medicationList[i].endDate).setHours(23, 59, 0, 0)
          ).getTime() / 1000
        );

        let medicalConditions = [];
        for (c = 0; c < medicationList[i].forMedicalConditions.length; c++) {
          medicalConditions.push(
            medicationList[i].forMedicalConditions[c].value
          );
        }

        medicationList[i][
          'forMedicalConditions'
        ] = medicalConditions.toString();

        medicationList[i]['whenToTake'] =
          medicationList[i].whenToTake !== undefined &&
          medicationList[i].whenToTake !== null
            ? medicationList[i].whenToTake
            : null;

        medicationList[i]['retire'] = updateObj.active ? false : true;

        // medicationList[i]['priceList'] = updateObj.priceList;
      }

      let medicationId = [];
      for (j = 0; j < medicationList.length; j++) {
        let count = await Medication.countDocuments({
          itemId: medicationList[j].itemId,
          caseId: medicationList[j].caseId,
        });
        let result;
        if (count > 0) {
          result = await Medication.findOneAndUpdate(
            {
              itemId: medicationList[j].itemId,
              caseId: medicationList[j].caseId,
            },
            medicationList[j]
          );
        } else {
          result = await Medication.create(medicationList[j]);
        }
        medicationId.push(result._id.toString());
      }
      updateObj.medicineList = medicationId;

      updateObj['status'] = 'processed';
      await Case.findByIdAndUpdate({ _id: req.body.recordId }, updateObj);

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  assignCase: async (req, res, next) => {
    try {
      // only super admin can assing users to handle case management
      let response = returnCode.noPermission;

      let records = req.body.recordId;

      for (i = 0; i < records.length; i++) {
        if (req.session.isSuperAdmin) {
          let record = await Case.findById(records[i]);

          response = returnCode.havePermission;

          if (
            record.assignedUser !== undefined &&
            record.assignedUser !== null &&
            record.assignedUser !== ''
          ) {
            await Case.findByIdAndUpdate(records[i], {
              assignedUser: req.body.assignee,
              operatedBy: req.session.userId,
              status: 'underReview',
              updatedAt: Math.floor(Date.now() / 1000),
              $push: {
                assignedUsers: record.assignedUser,
              },
            });
          } else {
            await Case.findByIdAndUpdate(records[i], {
              assignedUser: req.body.assignee,
              operatedBy: req.session.userId,
              status: 'underReview',
              updatedAt: Math.floor(Date.now() / 1000),
            });
          }
        }
      }

      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  addDoctor: async (req, res, next) => {
    try {
      let createObj = req.body;
      createObj['operatedBy'] = req.session.userId;
      await Doctor.create(createObj);
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  searchDoctors: async (req, res, next) => {
    try {
      let result;
      let searchKey = req.body.keyword;
      let queryObj = {
        active: true,
      };
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            name: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
        result = await Doctor.find(queryObj).limit(40).sort({
          name: 1,
        });
      } else {
        result = await Doctor.find(queryObj).limit(40).sort({
          name: 1,
        });
      }
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getUserBasedMedications: async (req, res, next) => {
    try {
      let queryObj = {
        userId: mongoose.Types.ObjectId(req.body.userId),
        retire: req.body.active,
      };

      if (req.body.active === 'all') {
        delete queryObj.retire;
      }

      let sortOrder = {};
      if (req.body.sortOrder !== '' && req.body.sortField !== '') {
        sortOrder[req.body.sortField] = req.body.sortOrder === 'false' ? -1 : 1;
      } else {
        sortOrder = {
          updatedAt: -1,
        };
      }
      let result = [];
      if (req.body.sortField === 'doctor.name') {
        result = await Medication.aggregate([
          {
            $match: {
              userId: mongoose.Types.ObjectId(req.body.userId),
            },
          },
          {
            $lookup: {
              from: 'inventories',
              localField: 'itemId',
              foreignField: '_id',
              as: 'itemId',
            },
          },
          {
            $unwind: {
              path: '$itemId',
            },
          },

          {
            $lookup: {
              from: 'doctors',
              localField: 'doctor',
              foreignField: '_id',
              as: 'doctor',
            },
          },
          {
            $unwind: {
              path: '$doctor',
            },
          },
          {
            $sort: {
              'doctor.name': req.body.sortOrder === 'false' ? -1 : 1,
            },
          },
          {
            $project: {
              userId: 1,
              caseId: 1,
              processCaseId: 1,
              startDate: 1,
              endDate: 1,
              forMedicalConditions: 1,
              prescriptionDate: 1,
              retire: 1,
              comparePrice: 1,
              itemName: 1,
              itemCount: 1,
              duration: 1,
              frequency: 1,
              frequencyDates: 1,
              whenToTake: 1,
              strength: 1,
              intakeDetails: 1,
              intake: 1,
              intakeQuantity: 1,
              priceList: 1,
              'doctor._id': '$doctor._id',
              'doctor.name': '$doctor.name',
              'itemId._id': '$itemId._id',
              'itemId.form': '$itemId.form',
              'itemId.dosageForm': '$itemId.dosageForm',
            },
          },
          {
            $skip: req.body.page * req.body.pageSize,
          },
          {
            $limit: req.body.pageSize,
          },
        ]);
      } else {
        result = await Medication.find(queryObj)
          .populate('doctor', 'name')
          .populate('itemId', 'form dosageForm')
          .sort(sortOrder)
          .skip(req.body.page * req.body.pageSize)
          .limit(req.body.pageSize);
      }

      let pageCount = await Case.countDocuments(queryObj);

      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / req.body.pageSize),
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getDoctorData: async (req, res, next) => {
    try {
      let queryObj = {};
      searchKey = req.body.name;

      // if (!UtilController.isEmpty(searchKey)) {
      //   queryObj['$or'] = [
      //     {
      //       name: {
      //         $regex: searchKey,
      //         $options: 'mi',
      //       },
      //     },
      //   ];

      // }

      result = await Doctor.find({
        name: req.body.name,
        hospital: req.body.hospital,
        'contact.officeNo': req.body.officeNo,
      });

      // let result = await Doctor.findOne(queryObj).select(
      //   '-licenseNo_fuzzy -operatedBy'
      // );
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  deleteMedications: async (req, res, next) => {
    try {
      let result = await Medication.findByIdAndDelete({
        _id: mongoose.Types.ObjectId(req.body.medicationId),
      });

      // let medicationList = await Medication.findById({
      //   itemId: mongoose.Types.ObjectId(req.body.itemId),
      //   caseId: req.body.caseId,
      // });
      let medicationList = await Case.findByIdAndUpdate(
        { _id: req.body.recordId },
        {
          $pull: {
            medicineList: mongoose.Types.ObjectId(req.body.medicationId),
          },
        }
      );

      // let result = await Doctor.findOne(queryObj).select(
      //   '-licenseNo_fuzzy -operatedBy'
      // );
      UtilController.sendSuccess(req, res, next, {
        responseCode: 109,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  updateMedication: async (req, res, next) => {
    try {
      let updateObj = req.body;
      updateObj['operatedBy'] = req.session.userId;

      updateObj['updatedAt'] = Math.floor(Date.now() / 1000);

      let medicalCondition = [];

      updateObj.forMedicalConditions.map((medCond) => {
        if (medCond !== undefined && medCond !== null) {
          if (medCond.display !== undefined && medCond.display !== null) {
            medicalCondition.push(medCond.display);
          }
        }
      });

      updateObj.forMedicalConditions = medicalCondition.toString();

      let result = await Medication.findByIdAndUpdate(
        { _id: updateObj.recordId },
        updateObj
      );

      await User.findByIdAndUpdate(result.userId, {
        updatedAt: Math.floor(Date.now() / 1000),
      });

      console.log(result);
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  returnCaseStatus: async (req, res, next) => {
    try {
      let caseMongoIds = req.body;

      let result = [];
      for (i = 0; i < caseMongoIds.length; i++) {
        let caseResult = await Case.findOne({
          _id: caseMongoIds[i],
          status: 'processed',
        }).select('status caseId');

        if (!UtilController.isEmpty(caseResult)) {
          result.push(caseResult);
        }
      }

      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  addMedicationAdd: async (req, res, next) => {
    try {
      let responseCode = returnCode.validSession;
      updateObj = {
        value: req.body.value,
        display: req.body.value,
        active: true,
        logo: '',
      };

      let query = {
        name: 'medicalConditions',
        'options.value': { $regex: updateObj.value, $options: 'i' },
      };

      let countResult = await Option.countDocuments(query);

      if (countResult === 0) {
        await Option.findOneAndUpdate(
          { name: 'medicalConditions' },
          {
            $push: { options: updateObj },
          }
        );
      } else {
        responseCode = returnCode.duplicate;
      }
      UtilController.sendSuccess(req, res, next, { responseCode });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getCaseMongoIdWithCaseId: async (req, res, next) => {
    try {
      let result = await Case.findOne({ caseId: req.body.caseId }).select(
        'caseId'
      );
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  updatePrescriptionCase: async (req, res, next) => {
    try {
      let updateObj = req.body;

      updateObj['updatedAt'] = Math.floor(Date.now() / 1000);

      updateObj['status'] = 'processed';
      await Case.findByIdAndUpdate({ _id: req.body.recordId }, updateObj);

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};

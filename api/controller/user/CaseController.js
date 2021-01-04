let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Case = require('./../../models/Case');
const Doctor = require('./../../models/Doctor');
const Medication = require('./../../models/Medication');
const Tag = require('./../../models/Tag');
const Inventory = require('./../../models/Inventory');
const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');

module.exports = {
  queryAllCase: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.body.pageNo === undefined ||
          req.body.pageNo === null ||
          req.body.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.body.pageNo);
      }
      let searchKey = req.body.keyword;
      let queryObj = {
        active: true,
        userId: mongoose.Types.ObjectId(req.body.userId),
      };
      if (!UtilController.isEmpty(req.body.status)) {
        queryObj['status'] = req.body.status;
      }
      if (!UtilController.isEmpty(req.body.userReview)) {
        queryObj['userReview'] = req.body.userReview;
      }
      if (!UtilController.isEmpty(req.body.caseType)) {
        queryObj['caseType'] = req.body.caseType;
      }
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            rfidTag: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }
      let result = await Case.find(queryObj)
        .sort({
          //isTemplate: -1,
          updatedAt: -1,
        })
        .populate('userId', 'fname lname')
        .skip(skipVal)
        .limit(pageLength);
      let pageCount = await Case.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / pageLength),
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
  caseInfo: async (req, res, next) => {
    try {
      let result = await Case.findById(req.query.recordId)
        .populate(
          'itemList.itemId',
          'title company category subCategory images itemType price discount tax available'
        )
        .populate('userId', 'name mobileNo'); // recordId means mongoId
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getDoctors: async (req, res, next) => {
    try {
      // needs to get only distinct doctor, no duplicate
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.query.pageNo === undefined ||
          req.query.pageNo === null ||
          req.query.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
      let result = await Case.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.query.userId),
            active: true,
          },
        },
        {
          $group: {
            _id: '$doctor',
            cases: {
              $addToSet: {
                _id: '$_id',
                caseId: '$caseId',
                prescriptionDate: '$prescriptionDate',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
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
          $project: {
            _id: 1,
            cases: '$cases',
            doctor: {
              contact: '$doctor.contact',
              contactPersonName: '$doctor.contactPersonName',
              contactPersonMobileNo: '$doctor.contactPersonMobileNo',
              name: '$doctor.name',
              specialization: '$doctor.specialization',
              otherSpecialization: '$doctor.otherSpecialization',
              qualification: '$doctor.qualification',
              licenseNo: '$doctor.licenseNo',
              hospital: '$doctor.hospital',
              designation: '$doctor.designation',
              address: '$doctor.address',
            },
          },
        },
        {
          $skip: skipVal,
        },
        {
          $limit: pageLength,
        },
      ]);

      // await Case.find({
      //   //active: true,
      //   userId: req.query.userId
      // }).select('_id doctor caseId').populate('doctor', 'name qualification specialization licenseNo designation hospital contact profileImage').skip(skipVal).limit(pageLength); // recordId means mongoId

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getDoctorPrescription: async (req, res, next) => {
    try {
      let result = await Case.find({
        //active:true,
        userId: req.session.userId,
        doctor: req.query.recordId, // here recordId means doctorId
      }).select('-assignedUsers -doctor');
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getMedications: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.query.pageNo === undefined ||
          req.query.pageNo === null ||
          req.query.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
      let result = {};
      if (req.query.sortBy === 'productName') {
        result = await Medication.find({ userId: req.query.userId })
          .populate('doctor')
          .populate('itemId')
          .sort({
            itemName: 1,
            retire: 1,
          })
          .skip(skipVal)
          .limit(pageLength);
      } else {
        result = await Medication.aggregate([
          {
            $match: {
              userId: mongoose.Types.ObjectId(req.query.userId),
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
            $group: {
              _id: '$doctor',
              medication: { $push: '$$ROOT' },
            },
          },
          {
            $lookup: {
              from: 'doctors',
              localField: '_id',
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
              'doctor.name': -1,
            },
          },
          {
            $project: {
              // specifications
              'medication.caseId': 1,
              'medication.itemName': 1,
              'medication.forMedicalConditions': 1,
              'medication.createdAt': 1,
              'medication.itemId._id': 1,
              'medication.itemId.form': 1,
              'medication.itemId.dosageForm': 1,
              'medication.itemId.description': 1,
              'medication.itemId.manufacturer': 1,
              'doctor.name': '$doctor.name',
              'doctor.specialization': '$doctor.specialization',
              'doctor.otherSpecialization': '$doctor.otherSpecialization',
              
            },
          },
          {
            $skip: skipVal,
          },
          {
            $limit: pageLength,
          },
        ]);
      }

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getComparePriceMedications: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.query.pageNo === undefined ||
          req.query.pageNo === null ||
          req.query.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
      let result = {};
      result = await Medication.find({
        userId: req.query.userId,
        comparePrice: true,
      })
        .populate('doctor')
        .populate('itemId')
        .sort({
          updatedAt: 1,
          retire: 1,
        })
        .skip(skipVal)
        .limit(pageLength);
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  removeMedicationFromComparePrice: async (req, res, next) => {
    try {
      await Medication.findByIdAndUpdate(req.query.recordId, {
        comparePrice: false,
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  addMedicationFromComparePrice: async (req, res, next) => {
    try {
      await Medication.findByIdAndUpdate(req.query.recordId, {
        comparePrice: true,
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getMedicationsByGrouping: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.query.pageNo === undefined ||
          req.query.pageNo === null ||
          req.query.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.query.pageNo);
      }

      let result = await Medication.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.query.userId),
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
        { $unwind: '$doctor' },
        {
          $lookup: {
            from: 'inventories',
            localField: 'itemId',
            foreignField: '_id',
            as: 'inventory',
          },
        },
        {
          $unwind: '$inventory',
        },
        {
          $group: {
            _id: '$itemId',
            medication: {
              $push: {
                _id: '$_id',
                name: '$itemName',
                caseId: '$caseId',
                prescriptionDate: '$prescriptionDate',
                retire: '$retire',
                frequency: '$frequency',
                whenToTake: '$whenToTake',
                strength: '$strength',
                intakeDetails: '$intakeDetails',
                intake: '$intake',
                frequencyDates: '$frequencyDates',
                itemId: '$itemId',
                startDate: '$startDate',
                updatedAt: '$updatedAt',
                endDate: '$endDate',
                forMedicalConditions: '$forMedicalConditions',
                itemName: '$itemName',
                itemCount: '$itemCount',
                duration: '$duration',
                priceList: '$priceList',
                doctor: '$doctor._id',
                doctorName: '$doctor.name',
                qualification: '$doctor.qualification',
                specialization: '$doctor.specialization',
              },
            },

            medicine: {
              $addToSet: {
                itemName: '$inventory.title',
                unitPackSize: '$inventory.unitPackSize',
                form: '$inventory.form',
                productSku: '$inventory.productSku',
              },
            },
          },
        },
        {
          $sort: {
            'medication.updatedAt': -1,
            // retire: 1,
          },
        },

        { $skip: skipVal },
        { $limit: pageLength },
      ]);

      let calculatePageCount = await Medication.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.query.userId),
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
        { $unwind: '$doctor' },
        {
          $group: {
            _id: '$itemId',

            medication: {
              $push: {
                name: '$itemName',
                caseId: '$caseId',
                prescriptionDate: '$prescriptionDate',
                retire: '$retire',
                frequency: '$frequency',
                whenToTake: '$whenToTake',
                strength: '$strength',
                intakeDetails: '$intakeDetails',
                itemId: '$itemId',
                itemName: '$itemName',
                itemCount: '$itemCount',
                forMedicalConditions: '$forMedicalConditions',
                duration: '$duration',
                priceList: '$priceList',
                doctor: '$doctor._id',
                doctorName: '$doctor.name',
                qualification: '$doctor.qualification',
                specialization: '$doctor.specialization',
              },
            },
            medicine: { $addToSet: '$itemName' },
          },
        },
      ]);

      let pageCount = calculatePageCount.length;

      UtilController.sendSuccess(req, res, next, {
        result,
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getPrescriptionDetails: async (req, res, next) => {
    try {
      let prescription = await Case.findById(
        req.query.recordId // here recordId means doctorId
      )
        .populate('userId')
        .populate('doctor')
        .populate({
          path: 'medicineList',
          populate: {
            path: 'itemId',
          },
        });
      if (prescription.status === 'processed') {
        await Case.findByIdAndUpdate(req.query.recordId, { userReview: true });
      }
      UtilController.sendSuccess(req, res, next, {
        prescription,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getMedicationsDetails: async (req, res, next) => {
    try {
      let medication = await Medication.find({ caseId: req.query.recordId });
      UtilController.sendSuccess(req, res, next, {
        medication,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getIntakeMedications: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.query.pageNo === undefined ||
          req.query.pageNo === null ||
          req.query.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
      console.log(req.query);
      // let result=await Medication.find({userId:req.query.userId}).sort({updatedAt:-1,retire:1}).skip(skipVal).limit(pageLength);
      let result = await Medication.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.query.userId),
            retire: false,
            startDate: {
              $lt: Number(req.query.intakeDate),
            },
            endDate: {
              $gt: Number(req.query.intakeDate),
            },
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
          $lookup: {
            from: 'inventories',
            localField: 'itemId',
            foreignField: '_id',
            as: 'inventory',
          },
        },
        {
          $unwind: {
            path: '$whenToTake',
          },
        },
        {
          $sort: {
            itemName: 1,
          },
        },
        {
          $group: {
            _id: '$whenToTake',
            medicine: {
              $push: {
                _id: '$_id',
                itemName: '$itemName',
                cases: '$caseId',
                intakeDetails: '$intakeDetails',
                frequencyDates: '$frequencyDates',
                frequency: '$frequency',
                intake: '$intake',
                intakeQuantity: '$intakeQuantity',
                form: { $arrayElemAt: ['$inventory.form', 0] },
                dosageForm: { $arrayElemAt: ['$inventory.dosageForm', 0] },
                marketedBy: { $arrayElemAt: ['$inventory.marketedBy', 0] },
                brand: { $arrayElemAt: ['$inventory.brand', 0] },
                doctorName: { $arrayElemAt: ['$doctor.name', 0] },
              },
            },
          },
        },
      ])
        .skip(skipVal)
        .limit(pageLength);
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updatePatientNotes: async (req, res, next) => {
    try {
      await Case.findByIdAndUpdate(req.body.recordId, {
        patientNotes: req.body.patientNotes,
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getMangoCaseIdFromCaseId: async (req, res, next) => {
    try {
      let result = await Case.find({ caseId: req.query.recordId });
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};

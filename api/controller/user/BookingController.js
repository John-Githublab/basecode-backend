let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Clinic = require('./../../models/Clinic');
const Doctor = require('./../../models/Doctor');
const Specialization = require('./../../models/Specialization');
const Booking = require('./../../models/Booking');
const Slot = require('./../../models/Slot');

const Tag = require('./../../models/Tag');
const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  // Search will based on keywork and final input, this will search doctor and clinic, and provide auto suggesion also
  searchDoctors: async (req, res, next) => {
    try {
      let search = req.body.search; // single word
      let searchKey = req.body.keyword; // each letter type in input
      let queryObj = {
        active: true
      }
      let pageLength = 10;
      let skipVal = 0;
      if (!(req.body.pageNo === undefined || req.body.pageNo === null || req.body.pageNo.length === 0)) {
        skipVal = pageLength * Number(req.body.pageNo);
      }
      // get the matching keyword symptoms and their specialization to find a matching doctors

      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [{
            name: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            specialization: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            symptoms: {
              $in: [searchKey]
            }
          }
        ];
      }
      let clinics = [],
        doctors = [],
        symptoms = [];
      clinics = await Clinic.find(queryObj).select('-operationSlots').sort({
        updatedAt: -1
      }).skip(skipVal).limit(pageLength).lean();
      doctors = await Doctor.find(queryObj).select('name').sort({
        updatedAt: -1
      }).skip(skipVal).limit(pageLength);
      symptoms = await Specialization.find(queryObj).select('name').sort({
        updatedAt: -1
      }).skip(skipVal).limit(pageLength);
      UtilController.sendSuccess(req, res, next, {
        clinics,
        doctors,
        symptoms
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
}

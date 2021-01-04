let request = require('request');
let mongoose = require('mongoose');
var Excel = require('exceljs');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Inventory = require('./../../models/Inventory');
const DataFileUpload = require('./../../models/DataFileUpload');
const UploadedDatafileProcessing = require('./../services/UploadedDatafileProcessing');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
const AddToCart = require('../../models/AddToCart');
module.exports = {
  queryInventory: async (req, res, next) => {
    try {
        let searchKey = req.body.keyword;
        let queryObj = {
           active:true,
           publish:true
        }
        let pageLength = 10;
      let skipVal = 0;
      if (!(req.body.pageNo === undefined || req.body.pageNo === null || req.body.pageNo.length === 0)) {
        skipVal = pageLength * Number(req.body.pageNo);
      }
          // let planResult = await Inventory.find(queryObj).select('title company category subCategory images itemType price discount tax available').sort({
          //   //isTemplate: -1,
          //   updatedAt: -1
          // }).skip(req.body.page * req.body.pageSize).limit(req.body.pageSize);
          let planResult = await Inventory.fuzzySearch(searchKey,queryObj).select('title company category subCategory images itemType price discount tax available').sort({
              //isTemplate: -1,
              updatedAt: -1
            }).skip(skipVal).limit(pageLength);

          let pageCount = await Inventory.countDocuments(queryObj);
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            pages: Math.ceil(pageCount / pageLength)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getFilterParameters: async (req, res, next) => {
    try {
        let searchKey = req.body.keyword;
        let category = req.body.category;
        let subCategory = req.body.subCategory;
        let queryObj = {
           active:true,
           publish:true
        }
        if (!UtilController.isEmpty(category)) {
          queryObj['category'] = category;
        }
        if (!UtilController.isEmpty(subCategory)) {
          queryObj['subCategory'] = subCategory;
        }

          let planResult = await Inventory.aggregate([{
            $match: queryObj
            },{
              $group: {
                _id: null,
                company:{$addToSet: "$company"},
                brand:{$addToSet: "$brand"},
              }
            }]);

          UtilController.sendSuccess(req, res, next, {
            result: planResult,
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  queryInventoryByCategory: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (!(req.body.pageNo === undefined || req.body.pageNo === null || req.body.pageNo.length === 0)) {
        skipVal = pageLength * Number(req.body.pageNo);
      }
        let searchKey = req.body.keyword;
        let category = req.body.category;
        let subCategory = req.body.subCategory;
        let sortBy= req.body.sortBy;


        let sortObject={

        }
        if(sortBy==="popularity"){
          sortObject['updatedAt']=-1;
        }
        if(sortBy==="pricelowtohigh"){
          sortObject['price']=1;
        }
        if(sortBy==="pricehightolow"){
          sortObject['price']=-1;
        }
        if(sortBy==="nameatoz"){
          sortObject['title']=1;
        }
        if(sortBy==="nameztoa"){
          sortObject['title']=-1;
        }

        let queryObj = {
              publish:true,
              active:true
        }
          if (!UtilController.isEmpty(searchKey)) {

            let searchArry=[];
            let srKeys = searchKey.split(',');



            for (var i = 0; i < srKeys.length; i++) {
              searchArry.push({
                'title': {
                  $regex: srKeys[i],
                  $options: 'i'
                },
              });

            }
            queryObj['$or']=searchArry


          }
          if (!UtilController.isEmpty(category)) {
            queryObj['category'] = category;
          }
          if (!UtilController.isEmpty(subCategory)) {
            queryObj['subCategory'] = subCategory;
          }
          console.log(req.body)
          let filterArr = [];
          if (!UtilController.isEmpty(req.body.priceFilter)) {
            console.log("abc")
            let priceArr = [];
            for(let i=0;i<req.body.priceFilter.length;i++){
              let priceSplit = req.body.priceFilter[i].split("-");
              console.log(priceSplit)
              priceArr.push({
                price : {
                  "$gte": priceSplit[0],
                  "$lte": priceSplit[1]
                }
              })
            }
            filterArr.push({'$or':priceArr})

          }
          if (!UtilController.isEmpty(req.body.discountFilter)) {
            console.log("abc")
            let discountArr = [];
            for(let i=0;i<req.body.discountFilter.length;i++){
              let discountSplit = req.body.discountFilter[i].split("-");
              console.log(discountSplit)
              discountArr.push({
                discount : {
                  "$gte": discountSplit[0],
                  "$lte": discountSplit[1]
                }
              })
            }
            filterArr.push({'$or':discountArr})
          }
          if (!UtilController.isEmpty(req.body.brandFilter)) {
            console.log("abc")



              filterArr.push({
                brand : {'$in':req.body.brandFilter}
              })


          }
          if (!UtilController.isEmpty(req.body.companyFilter)) {
            console.log("abc")
            filterArr.push({
              company : {'$in':req.body.companyFilter}
            })

          }
          if (!UtilController.isEmpty(filterArr)) {
            queryObj['$and']=filterArr;

          }

          console.log(queryObj)


          let  planResult = await Inventory.find(queryObj).select('title company category subCategory images itemType price discount tax available').sort(sortObject)
          .skip(skipVal).limit(pageLength);


          let pageCount = await Inventory.countDocuments(queryObj);
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            pages: Math.ceil(pageCount / pageLength)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getInventoryById: async (req, res, next) => {
    try {
        let queryObj = {
            _id:mongoose.Types.ObjectId(req.query.recordId),
        }
          let result = await Inventory.findById(queryObj)

          UtilController.sendSuccess(req, res, next, {
            result:result
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

}

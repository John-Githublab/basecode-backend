let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Order = require('./../../models/Order');
const Inventory = require('./../../models/Inventory');
const AddToCart = require('./../../models/AddToCart');
const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
const responseCode = require('../../../config/responseCode');
const Tag = require('./../../models/Tag');
module.exports = {
  queryAllOrder: async (req, res, next) => {
    try {
      let searchKey = req.query.keyword;
      let queryObj = {
        active: true,
        userId: mongoose.Types.ObjectId(req.session.userId)
      };
      if (!UtilController.isEmpty(req.query.status)) {
        queryObj['status'] = req.query.status;
      }
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [{
            'rfidTag': {
              $regex: searchKey,
              $options: 'i'
            }
          },
          // {
          //   'description': {
          //     $regex: searchKey,
          //     $options: 'i'
          //   }
          // }
        ];
      }
      let result = await Order.find(queryObj).select('rfidTag orderType invoiceId payment receivedPayment itemCount trackId orderType paymentDone status orderId createdAt deliveryOtp deliveryCharge').sort({
        //isTemplate: -1,
        updatedAt: -1
      }).skip(req.query.page * req.query.pageSize).limit(req.query.pageSize);
      let pageCount = await Order.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / req.query.pageSize)
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  orderInfo: async (req, res, next) => {
    try {
      let result = await Order.findById(req.query.recordId).populate('itemList.itemId','title company category subCategory images itemType price discount tax available').populate('userId','name mobileNo') // recordId means mongoId
      UtilController.sendSuccess(req, res, next, {
        result
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  createOrder: async (req, res, next) => {
    try {
       let createObj= req.body;
       createObj['userId'] = req.session.userId;
       let responseCode = returnCode.validSession;
       if(!UtilController.isEmpty(req.body.itemList)){
         let itemList = req.body.itemList;
         let prescription=false;
         for(let i=0;i<itemList.length;i++){
          let result = await Inventory.findById({_id:mongoose.Types.ObjectId(itemList[i].itemId)}).select('itemType')
          if(result.itemType ==="prescription"){
            prescription=true;
          }
        }
        if(prescription){
          let tagResult = await Tag.findOneAndUpdate({
            active:true,
            tagType:'order'
          },{$inc: { sequenceNo: 1},updatedAt:Math.floor(Date.now() / 1000)} );
          createObj['orderId']=tagResult.prefix+UtilController.pad(tagResult.sequenceNo,5);
          createObj['updatedAt'] = Math.floor(Date.now() / 1000);
          createObj['createdAt'] = Math.floor(Date.now() / 1000);
          await Order.create(createObj)
          let cartResult = await AddToCart.find({
            userId: mongoose.Types.ObjectId(req.session.userId)
          }).select('-id');
          for(let i=0;i<cartResult.length;i++){
            await AddToCart.findOneAndDelete({
              _id: mongoose.Types.ObjectId(cartResult[i]._id)
            });
          }
        }else{
          for(let i=0;i<itemList.length;i++){
            let result = await Inventory.findById({_id:mongoose.Types.ObjectId(itemList[i].itemId)}).select('available')
            if(itemList[i].itemCount>result.available){
              responseCode = returnCode.notAvailable;
            }
          }
         
         if(responseCode !== returnCode.notAvailable){
          let itemList = req.body.itemList;
          for(let i=0;i<itemList.length;i++){
            let result = await Inventory.findById({_id:mongoose.Types.ObjectId(itemList[i].itemId)}).select('available')
            let  updated_inventory = result.available - itemList[i].itemCount
            await Inventory.findOneAndUpdate({_id:mongoose.Types.ObjectId(itemList[i].itemId)},{
              available:updated_inventory
            })
  
          }
          let tagResult = await Tag.findOneAndUpdate({
            active:true,
            tagType:'order'
          },{$inc: { sequenceNo: 1},updatedAt:Math.floor(Date.now() / 1000)} );
          createObj['orderId']=tagResult.prefix+UtilController.pad(tagResult.sequenceNo,5);
          console.log(UtilController.pad(tagResult.sequenceNo,4))
          createObj['updatedAt'] = Math.floor(Date.now() / 1000);
          createObj['createdAt'] = Math.floor(Date.now() / 1000);
          await Order.create(createObj)
          let cartResult = await AddToCart.find({
            userId: mongoose.Types.ObjectId(req.session.userId)
          }).select('-id');
          for(let i=0;i<cartResult.length;i++){
            await AddToCart.findOneAndDelete({
              _id: mongoose.Types.ObjectId(cartResult[i]._id)
            });
          }
         }
        }
        
      }else{
        let tagResult = await Tag.findOneAndUpdate({
          active:true,
          tagType:'order'
        },{$inc: { sequenceNo: 1},updatedAt:Math.floor(Date.now() / 1000)} );
        createObj['orderId']=tagResult.prefix+UtilController.pad(tagResult.sequenceNo,5);
        createObj['updatedAt'] = Math.floor(Date.now() / 1000);
        createObj['createdAt'] = Math.floor(Date.now() / 1000);
        await Order.create(createObj)
        
      }
       
      UtilController.sendSuccess(req, res, next, {
        responseCode
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  editOrder: async (req, res, next) => {
    try {
      UtilController.sendSuccess(req, res, next, {

      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  confirmOrder: async (req, res, next) => {
    try {
      let responseCode = returnCode.validSession;
      let order = await Order.findById({
        _id:mongoose.Types.ObjectId(req.body.recordId)
      })
      let itemList = order.itemList;
      for(let i=0;i<itemList.length;i++){
        let result = await Inventory.findById({_id:mongoose.Types.ObjectId(itemList[i].itemId)}).select('available')
        if(itemList[i].itemCount>result.available){
          responseCode = returnCode.notAvailable;
        }
      }
     
     if(responseCode !== returnCode.notAvailable){
      // let itemList = order.itemList;
      for(let i=0;i<itemList.length;i++){
        let result = await Inventory.findById({_id:mongoose.Types.ObjectId(itemList[i].itemId)}).select('available')
        let  updated_inventory = result.available - itemList[i].itemCount
        await Inventory.findOneAndUpdate({_id:mongoose.Types.ObjectId(itemList[i].itemId)},{
          available:updated_inventory
        })
      }
      let updateObj={
        
        paymentMode:req.body.paymentMode,
        updatedAt:Math.floor(Date.now() / 1000),
        status:"confirmed"
      }
      let paymentRefId=req.body.paymentRefId;
      let  paymentProof=req.body.paymentProof;
      if(!UtilController.isEmpty(paymentRefId)){
        updateObj['paymentRefId'] = paymentRefId
      }
      if(!UtilController.isEmpty(paymentProof)){
        updateObj['paymentProof'] = paymentProof
      }
      await Order.findByIdAndUpdate({
        _id:mongoose.Types.ObjectId(req.body.recordId)
      },updateObj)
    }
      
      UtilController.sendSuccess(req, res, next, {
        responseCode
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  deleteOrder: async (req, res, next) => {
    try {
      UtilController.sendSuccess(req, res, next, {

      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  queryAllCart: async (req, res, next) => {
    try {
      let result = await AddToCart.find({
        userId: mongoose.Types.ObjectId(req.session.userId)
      }).populate('itemId','title company category subCategory images itemType price discount tax available');
      UtilController.sendSuccess(req, res, next, {
        result
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  addToCart: async (req, res, next) => {
    try {
      let updateObj = req.body;
      updateObj['userId'] = req.session.userId;
      let result = await AddToCart.find({
        userId: mongoose.Types.ObjectId(req.session.userId),
        itemId: mongoose.Types.ObjectId(req.body.itemId)
      });
      if(result.length>0){
        var count  = result[0].itemCount;
        count = count + req.body.itemCount;
        let updateObjNew = {
          itemCount:count
        }
        await AddToCart.findOneAndUpdate({
          itemId: mongoose.Types.ObjectId(req.body.itemId),
          userId: mongoose.Types.ObjectId(req.session.userId)
        }, updateObjNew);
      }else{
        await AddToCart.create(updateObj);
      }
      
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateCartItem: async (req, res, next) => {
    try {
      let updateObj = req.body;
      updateObj['updatedAt'] = Math.floor(Date.now() / 1000)
      let result = await AddToCart.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(req.body.recordId),
        userId: mongoose.Types.ObjectId(req.session.userId)
      }, updateObj);
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  deleteCartItem: async (req, res, next) => {
    try {
      let result = await AddToCart.findOneAndDelete({
        _id: mongoose.Types.ObjectId(req.body.recordId),
        userId: mongoose.Types.ObjectId(req.session.userId)
      });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getCartCount: async (req, res, next) => {
    try {
        let queryObj = {
            userId:mongoose.Types.ObjectId(req.session.userId),
        }
          let count = await AddToCart.countDocuments(queryObj)
          
          UtilController.sendSuccess(req, res, next, {
            count
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
}

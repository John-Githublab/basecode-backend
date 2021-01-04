let mongoose = require('mongoose');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

let inventorySchema = mongoose.Schema(
  {
    // storeId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Store'
    // }, // will use in future, once we established multiple stores
    title: {
      //  this is the product name
      type: String,
      default: '',
    },
    genericName: {
      // it is the generic name / composition
      type: String,
      default: '',
    },
    searchableTitle: {
      // system generate
      type: String,
      default: '',
    },
    keywords: {
      // this is require to add these keywords into meta data of individual product page on web
      type: String,
      default: '',
    },
    productSku: {
      // unique key for individual inventory product
      type: String,
      default: '',
    },
    barCodeId: {
      type: String,
      default: '',
    },
    unitPackSize: {
      type: String,
      default: '',
    },
    marketedBy: {
      type: String,
      default: '',
    },
    distributedBy: {
      type: String,
      default: '',
    },
    drcNo: {
      // this can be DRC/IR Number / Notification no
      type: String,
      default: '',
    },
    form: {
      // like  Tablet, Injection
      type: String,
      default: '',
    },
    dosageForm: {
      type: String,
      default: '',
    },
    overview: {
      type: String,
      default: '',
    },
    description: {
      // here include all kind of information like,when not to use, Warnings, Dosage etc
      type: String,
      default: '',
    },
    substitutes: Array, // this will be the list of productSku,
    // substitutes: [
    //   {
    //     // this should give you the product sku while uploading from excel sheet
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Inventory",
    //   },
    // ],
    concerns: {
      type: String,
      default: '',
    },
    composition: {
      type: String,
      default: '',
    },

    brand: {
      // this is drug brand
      type: String,
      default: '',
    },
    drugClass: {
      type: String,
      default: '',
    },
    offLabel: {
      type: String,
      default: '',
    },
    preg: {
      type: String,
      default: '',
    },
    csa: {
      // CSA schedule
      type: String,
      default: '',
    },
    alcohol: {
      type: String,
      default: '',
    },
    rating: {
      type: String,
      default: '',
    },
    popularity: {
      type: String,
      default: '',
    },
    images: Array, // this will multiple profile image of one product, it contains only images url
    manufacturer: {
      // manufacturing company
      type: String,
      default: '',
    },
    category: {
      // this will be a dropdown, like skin and other menu options
      type: String,
      default: '',
    },
    // subCategory: {
    //   // this will be a dropdown, like skin and other menu options
    //   type: String,
    //   default: "",
    // },
    itemType: {
      // generic,prescription,otc, narcotic , this is to distinguest product type, so that we can restrict user to purchase all kind of product without restriction
      type: String,
      default: 'otc',
    },
    // salesPrice: { // future purpose
    //   type: Number,
    //   default: 0,
    // },
    price: {
      // actual MRP price
      type: Number,
      default: 0,
    },
    discount: {
      // this will an optional, it will consider while taking order and showing discount value
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    // shipping: { // shipping fee or charges
    //   type: Number,
    //   default: 0,
    // },
    available: {
      // this is to keep track of inventory stock before taking order
      type: Number,
      default: 0,
    },
    // pricing comparison
    pricingList: [
      {
        provider: String, // like 1mg, netmats
        sourceLink: String, // website link where pricing data is fetching
        price: Number,
        discount: Number,
        tax: Number,
        shipping: Number,
        updatedAt: Number,
      },
    ],
    locked: {
      // this will come into picture when user upload prescription and asking for quatation, and later will do order
      type: Number,
      default: 0,
    },
    isCod: {
      // cash on delivery, if it is true then payment can collect on delivery
      type: Boolean,
      default: true,
    },
    isReturnable: {
      // this is to check the return and replacement condition, if this value is false then these products are not returnable. once purchase is gone
      type: Boolean,
      default: true,
    },
    deliveryDays: {
      type: String,
      default: '2 days',
    },
    active: {
      type: Boolean,
      default: true,
    },
    publish: {
      type: Boolean,
      default: true,
    },
    isReviewed: {
      // this is for the future, later we can use this parameter to decide this product is reviewd or not
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: true, // this value should be false when ever we are inserting from process case, so later admin as to review and update these records
    },
    operatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }, // we can define modules for each plan subscribe, there modules will add defaultly, later can change if they need
    updatedAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
    createdAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    // this block will use when do we need to specify collection name. collection name should be case sensitive
    //otherwise model plural name consider as collection name
    collection: 'inventories',
  }
);
inventorySchema.plugin(mongoose_fuzzy_searching, {
  fields: ['title', 'searchableTitle', 'composition'],
});
module.exports = mongoose.model('Inventory', inventorySchema);

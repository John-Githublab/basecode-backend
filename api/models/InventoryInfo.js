let mongoose = require("mongoose");
const mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");

let inventoryInfoSchema = mongoose.Schema(
  {
    productId: { // this is inventoryId, mongo id from inventory collection
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    productSku: {
      // unique key for individual inventory product
      type: String,
      default: "",
    },

    additionalInfo: [
      // here we can add refences, USES OF DOLO TABLET,BENEFITS OF TABLET etc
      // Recommended Indications (as per Pack Insert)*, Recommended Dosage / Direction for use (as per Pack Insert)*, Possible side effects
      {
        heading: String,
        content: String,
        contentType: {
          type: String,
          default: "text",
        }, // this will be a dropdown and will contain value like text,images,videos
      },
    ],
    externalLink:[{
        heading: String,
        //content: String,
        url:String, // website url
        contentType: {
          type: String,
          default: "url",
        }, // this will be a dropdown and will contain value like text,images,videos
      }],
      relatedTreatements:{
        type:String,
        default:""
      },
      relatedDrugs:{
        type:String,
        default:""
      },

    operatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    collection: "inventoryinfo", // this is for the addition info storage
  }
);
inventoryInfoSchema.plugin(mongoose_fuzzy_searching, {
  fields: ["productSku"],
});
module.exports = mongoose.model("InventoryInfo", inventoryInfoSchema);

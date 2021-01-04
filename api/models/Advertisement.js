let mongoose = require("mongoose");

let advertisementSchema = mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      require: true,
    },
    tagline: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    images: Array,
    siteLink: {
      // this can be a website link or page link,
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    priority: {
      // high, normal,low
      type: String,
      default: "normal",
    },
    adPosition: { // this si advertizement position in page, like top, middle, and bottom
      type: String,
      default: "top",
    },
    pageViews: {
      type: Number,
      default: 0,
    },
    totalClick: {
      type: Number,
      default: 0,
    },
    startAt: {
      type: Number,
      default: 0,
    },
    endAt: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "all",
    },

    subCategory: {
      type: String,
      default: "all",
    },
    searchKey: {
      type: String,
    },

    typeOfLink: { type: String, default: "internal" }, // values can be internal, external, products and banner(this is list of ad's)
    products: [{ // these are the Inventory ids, which will show in UI front end
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    }],
    bannerList:[{ // this is it show trending list and other list of advertizements
      image:String,
      siteLink: {
        // this can be a website link or page link,
        type: String,
        default: "",
      },
      searchKey: {
        type: String,
      },
      category: {
        type: String,
        default: "all",
      },
      subCategory: {
        type: String,
        default: "all",
      },
    }],
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
    collection: "advertisements",
  }
);
module.exports = mongoose.model("Advertisement", advertisementSchema);

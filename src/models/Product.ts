import mongoose from "mongoose";

export type ProductModel = mongoose.Document & {
  productCode: string,
  productName: string,
  productNameCh: string,
  productDesc: string,
  status: string,
  createdBy: string,
  updatedBy: string
};

const productSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true, uppercase: true },
  productName: { type: String, required: true, uppercase: true },
  productNameCh: String,
  productDesc: String,
  status: { type: String, required: true, default: "A" },
  createdBy: String,
  updatedBy: String
}, { timestamps: true });

// Virtual for Member's URL
productSchema
.virtual("url")
.get(function() {
    return "/product/" + this._id;
});

const Product = mongoose.model("Product", productSchema);
export default Product;

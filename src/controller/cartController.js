const cartModel = require('../model/cartModel')
const productModel = require('../model/productModel')
const userModel=require('../model/userModel')

const {isValidEmail,isValidObjectId,isValidphone,isValidBody,isValidRequestBody,isValidName,isValidpassword,isValidCity,isValidPinCode,isValidProductName,isValidPrice,isValidateSize,isValidNo,isValidImage}=require('../util/validator')
// ------create-cart------
exports. createCart = async function (req, res) {
  try {
      let userId = req.params.userId;
      let data = req.body;
      let { productId, cartId, quantity } = data;
      if (!quantity) {
          quantity = 1
      }
      if(!isValidObjectId(productId)) return res.status(400).send(({status:false , message:"Please provide valid product Id"}))

      if(!isValidObjectId(userId)) return res.status(400).send(({status:false , message:"Please provide valid user Id"}))
      let ProductData = await productModel.findOne({ _id: productId ,isDeleted:false})
      if (ProductData == null) {
          return res.status(404).send({ status: false, message: "productId is not found" })
      }
      let price = ProductData.price

      let cartData = await cartModel.findOne({ userId: userId })

      if (cartData == null) {

          let data = {
              userId: userId,
              items: [{ productId: productId, quantity: quantity }],
              totalPrice: (price * quantity).toFixed(2),
              totalItems: 1,
          }

          let createCart = await cartModel.create(data)
          res.status(201).send({ status: true,message:"Success", data: createCart })
      }


      else {

          let items = cartData.items
          let totalPrice = cartData.totalPrice
          let totalItems= cartData.totalItems


          let flag = 0;
          // let NewQuantity = 0;
          for (let i = 0; i < items.length; i++) {
              if (items[i].productId == productId) {
                  items[i].quantity += quantity
                  // NewQuantity = items[i].quantity
                  flag = 1
              }
          }
          if (flag == 1) {
              price = (quantity * price) + totalPrice
              let data = {
                  totalPrice: price,
                  items: items,
                  totalItems:items.length
              }
              let updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: data }, { new: true })
              return res.status(201).send({ status: true,message:"Success",data: updateCart })
          } else if (flag == 0) {
              items.push({ productId: productId, quantity: quantity })
              price = (price * quantity) + totalPrice
              totalItems= totalItems + 1
              let data = {
                  items: items,
                  totalPrice: price,
                  totalItems:totalItems

              }
              let updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: data }, { new: true })
              return res.status(201).send({ status: true,message:"Success", data: updateCart })

          }
      }

  }
  catch (err) {
      return res.status(500).send({ status: false, message: err.message })
  }
}

// -------update-cart------

exports.updateCart = async function (req, res) {
  try {
     let body = req.body;
     let userId = req.params.userId

     let { cartId, productId, removeProduct } = body
    
     if (!isValidRequestBody(body)) return res.status(400).send({ status: false, message: "Body should not be empty" })
     let findUser = await userModel.findById({ _id: userId })
     if (!findUser) return res.status(404).send({ status: false, message: "User not found" })
     
     if (!cartId) return res.status(400).send({ status: false, message: "please enter your cartId" })
     if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "card Id is invalid" })
     const findCart = await cartModel.findOne({ _id: cartId })
     if (!findCart) return res.status(404).send({ status: false, message: "Cart id not exist" })

     if (!productId) return res.status(400).send({ status: false, message: "please enter your productId" })
     if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "product Id is invalid" })
     const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
     if (!findProduct) return res.status(404).send({ status: false, message: "product does not not exist" })

     if (![0, 1].includes(removeProduct)) return res.status(400).send({ status: false, message: "Remove product should be only in 0 or 1 " })

     for (let i = 0; i < findCart.items.length; i++) {
 
         if (findProduct._id.toString() == findCart.items[i].productId.toString()) {
             if (removeProduct == 1 && findCart.items[i].quantity > 1) {
                 let updateCart = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId }, { $inc: { "items.$.quantity": -1, totalPrice: -(findProduct.price) } }, { new: true }).select({ __v: 0, "items._id": 0 })
                 return res.status(200).send({ status: true, message: "cart updated successfully", data: updateCart })
             } else {
                 let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, $inc: { totalItems: -1, totalPrice: -(findProduct.price * (findCart.items[i].quantity)) } }, { new: true }).select({ __v: 0, "items._id": 0 })
                 return res.status(200).send({ status: true, message: "removed successfully", data: updateCart })
              }
         }
     } return res.status(404).send({ status: false, message: "product not found with cartId" })

 } catch (err) {
     return res.status(500).send({ status: false, message: err.message })
 }
}

// ------get-cart------
exports.getCart= async function(req,res){
  try{
      const userId=req.params.userId;

      if (!isValidObjectId(userId)) return res.status(400).send({status : false , message : "invalid userId"})
      // ----authorisation-----
      if ( userId !=req.decode.userId)  return res.status(403).send({ status: false, message: "you are not Athorised" });

      const userData = await cartModel.find({userId:userId})
      if(!userData) return res.status(404).send({status:false, message:"user not exist"})

        return res.status(200).send({status:true, message:"Success",data:userData})
    }
catch(err){      
       return res.status(500).send({status:false,message:err.message})
   }
}

// ------delete-cart------
exports.deleteCart= async function(req,res){
  try{
      const userId=req.params.userId;
     
      if (!isValidObjectId(userId)) return res.status(400).send({status : false , message : "invalid userId"})
      
     if (req.decode.userId!=userId) return res.status(403).send({status : false , message : "you are not authorised"})

      const updateData = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 }}, { new: true })

      if(!updateData) return res.status(404).send({status:false, message:"user not exist"})

      return res.status(204).send()
  }
catch(err){     
          return res.status(500).send({status:false,message:err.message})
 }

}



const productModel=require('../model/productModel')

exports.deleteProduct=async(req,res)=>{
    try{
        const productid=req.params.productid
        await productModel.findOneAndUpdate({_id:productid,isDeleted:false},{$set:{isDeleted:true}},{$new:true})
        return res.status(200).json({status:true,message:"deleted successfull"})

    }catch(error){
      return res.status(500).json({status:"false",message:error.message})
    }
}
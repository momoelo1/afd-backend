const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const cartRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const config = require("../utils/config");

/**********  GET CART PRODUCTS  **********/

cartRouter.get("/", async (req, res) => {
  const accessToken = req.cookies.accessToken;

  const decodedToken = jwt.verify(accessToken, process.env.SECRET);

  const user = await User.findById(decodedToken.userId).populate("cartItems");
  console.log("us", user._id.toString());

  const cart = await Cart.find({ userId: user._id });

  res.json(cart);
});

cartRouter.get("/:id", async (req, res) => {

  const { id } = req.params
  console.log(id);

  const accessToken = req.cookies.accessToken;

  const decodedToken = jwt.verify(accessToken, config.SECRET);

  const user = await User.findById(decodedToken.userId).populate("cartItems");
  
  const singleItem = await Cart.findById({_id: id})
  console.log(singleItem);

  res.json(singleItem)
  
});

/**********  POST PRODUCTS TO CART  **********/

cartRouter.post("/", async (req, res) => {
  try {
  const { productId, quantity } = req.body;
    console.log('Received request to add product:', { productId, quantity });

  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  const decodedToken = jwt.verify(accessToken, config.SECRET);
    console.log('User ID from token:', decodedToken.userId);

  const user = await User.findById(decodedToken.userId).populate("cartItems");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Debug user's cart state
    console.log('Current user cart state:', {
      userId: user._id,
      username: user.username,
      cartItemsLength: user.cartItems.length,
      cartItemIds: user.cartItems.map(item => item._id)
    });

    // Clean up any invalid cart references
    const validCartItems = await Cart.find({ _id: { $in: user.cartItems } });
    const validCartItemIds = validCartItems.map(item => item._id.toString());
    
    if (user.cartItems.length !== validCartItems.length) {
      console.log('Found invalid cart references. Cleaning up...');
      user.cartItems = user.cartItems.filter(itemId => 
        validCartItemIds.includes(itemId.toString())
      );
      await user.save();
      console.log('Cart references cleaned up');
    }

    // Find if the product already exists in the user's cart
    const existingCartItem = await Cart.findOne({
      userId: user._id,
      productId: productId
    });

    if (existingCartItem) {
      console.log('Found existing cart item:', {
        itemId: existingCartItem._id,
        productId: existingCartItem.productId,
        currentQuantity: existingCartItem.quantity
      });
    }

    console.log('Fetching Stripe product...');
    let stripeProd;
    try {
      stripeProd = await stripe.products.retrieve(productId, {
    expand: ["default_price"],
  });

      if (!stripeProd.default_price) {
        console.error('Product has no default price:', stripeProd);
        return res.status(400).json({ error: "Product has no price configured" });
      }

      if (!stripeProd.description) {
        console.error('Product has no description:', stripeProd);
        return res.status(400).json({ error: "Product has no description configured" });
      }

      if (!stripeProd.images || stripeProd.images.length === 0) {
        console.error('Product has no images:', stripeProd);
        return res.status(400).json({ error: "Product has no images configured" });
      }

      console.log('Stripe product found:', {
        id: stripeProd.id,
        name: stripeProd.name,
        hasPrice: !!stripeProd.default_price,
        hasDescription: !!stripeProd.description,
        hasImages: stripeProd.images.length > 0
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return res.status(400).json({ 
        error: "Invalid product ID or product not found in Stripe",
        details: stripeError.message
      });
    }

    let updatedCartItem;
    if (existingCartItem) {
      console.log('Updating existing cart item quantity...');
      existingCartItem.quantity += quantity;
      updatedCartItem = await existingCartItem.save();
      console.log('Cart item quantity updated:', {
        itemId: updatedCartItem._id,
        newQuantity: updatedCartItem.quantity
      });
    } else {
      console.log('Creating new cart item...');
    const newCartProduct = new Cart({
      userId: user._id,
      productId: productId,
      name: stripeProd.name,
      desc: stripeProd.description,
      img: stripeProd.images[0],
      quantity: quantity,
      price: stripeProd.default_price.unit_amount,
        category: stripeProd.metadata.category || 'uncategorized'
      });

      updatedCartItem = await newCartProduct.save();
      console.log('New cart item saved:', {
        itemId: updatedCartItem._id,
        productId: updatedCartItem.productId
      });
      
      // Ensure we're not adding duplicate references
      if (!user.cartItems.includes(updatedCartItem._id)) {
        user.cartItems.push(updatedCartItem);
        await user.save();
        console.log('Cart reference added to user');
      }
    }

    // Get the updated cart items
    const updatedCart = await Cart.find({ userId: user._id });
    console.log('Returning updated cart:', {
      itemCount: updatedCart.length,
      items: updatedCart.map(item => ({
        id: item._id,
        productId: item.productId,
        quantity: item.quantity
      }))
    });
    
    return res.json(updatedCart);

  } catch (error) {
    console.error('Cart operation error:', {
      error: error.message,
      stack: error.stack,
      userId: req.cookies.accessToken ? jwt.decode(req.cookies.accessToken).userId : 'unknown'
    });
    return res.status(500).json({ 
      error: "Failed to add product to cart",
      details: error.message
    });
  }
});

cartRouter.delete("/", async (req, res) => {
  const { productId } = req.body;
  console.log(productId);

  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  const decodedToken = jwt.verify(accessToken, config.SECRET);

  const user = await User.findById(decodedToken.userId).populate("cartItems");

  const existingItem = user.cartItems.find(
    (item) => item.productId === productId
  );

  if (existingItem) {
    await Cart.findByIdAndDelete(existingItem._id);

    user.cartItems = user.cartItems.filter(
      (item) => item.productId !== productId
    );

    await user.save();
  }

  return res.json(user.cartItems);
});

module.exports = cartRouter;

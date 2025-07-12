const productRouter = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// Get all products grouped by category
productRouter.get("/", async (req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"],
    });

    const activeProds = products.data.filter(
      (product) => product.active === true
    );

    // Group products by category
    const groupedProducts = activeProds.reduce((acc, product) => {
      const category = product.metadata.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    res.json({
      categories: Object.keys(groupedProducts),
      groupedProducts,
      allProducts: activeProds
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to get products" });
  }
});

// Get products by specific category
productRouter.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await stripe.products.search({
      query: `active:'true' AND metadata['category']:'${category}'`,
      expand: ["data.default_price"],
    });

    res.json(products.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to get products by category" });
  }
});

// Get all available categories
productRouter.get("/categories", async (req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"],
    });

    const categories = [...new Set(
      products.data
        .filter(product => product.active)
        .map(product => product.metadata.category || 'uncategorized')
    )];

    res.json(categories);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to get categories" });
  }
});

// Get specific product by ID
productRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await stripe.products.retrieve(id, {
      expand: ["default_price"],
    });

    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to get product" });
  }
});

module.exports = productRouter;

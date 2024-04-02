const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const moment = require('moment-timezone');



const uri = "mongodb+srv://sarthak:Fv5tTIQInHpnX4QD@assignment3.wjujx96.mongodb.net/?retryWrites=true&w=majority&appName=assignment3";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB once when the application starts
async function main() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB.");
    // Start your express server after successful MongoDB connection
    app.listen(process.env.PORT, () => {
      console.log('Server listening on port 3000');
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}


// API Keys
const API_KEY_FINNHUB = 'co4b1c1r01qqksec5b20co4b1c1r01qqksec5b2g';
const API_KEY_POLYGON = 'p0AyuzqliqxOimDrDbEAtNbDRrp4vZQM';
app.use('/',express.static('static'));
// Enable CORS
app.use(cors(
  {
    origin: 'https://assignment3-419001.wl.r.appspot.com'
  
  }
));
app.use(express.json());


// Middleware to validate query params
const validateQueryParams = (req, res, next) => {
  const symbol = req.query.symbol;
  if (!symbol) {
    return res.status(400).json({ error: "Invalid 'symbol' query parameter" });
  }
  next();
};

// Function to fetch stock details (replace with your actual implementation)
async function fetchStockDetails(symbol) {
  try {
    // Fetch data from Finnhub or other sources
    const response1 = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
    const response2 = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
    let response = {...response1.data, ...response2.data};
    return response;
  } catch (error) {
    console.error('Error fetching stock details:', error);
    return null; // Or handle the error appropriately
  }
}

// Watchlist API endpoints
app.get('/watchlist', async (req, res) => {
  try {
    const database = client.db('assignment3');
    const watchlistCollection = database.collection('watchlist');
    const watchlist = await watchlistCollection.find().toArray();
    res.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});


app.post('/watchlist', async (req, res) => {
  try {
    const database = client.db('assignment3');
    const watchlistCollection = database.collection('watchlist');
    const stockDetails = req.body;
    // Check if the stock is already in the watchlist
    const existingStock = await watchlistCollection.findOne({ symbol: stockDetails.symbol });
    if (existingStock) {
      res.status(409).json({ message: 'Stock is already in the watchlist' }); // Use a 409 Conflict status
    } else {
      // If not, add the stock to the watchlist
      const result = await watchlistCollection.insertOne(stockDetails);
      res.json({ message: 'Stock added to watchlist successfully', stockId: result.insertedId });
    }
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});


app.delete('/watchlist/:symbol', async (req, res) => {
  try {
    const database = client.db('assignment3');
    const watchlistCollection = database.collection('watchlist');
    const symbol = req.params.symbol;
    const result = await watchlistCollection.deleteOne({ symbol });
    if (result.deletedCount === 1) {
      res.json({ message: 'Stock removed from watchlist successfully' });
    } else {
      res.status(404).json({ error: 'Stock not found in watchlist' });
    }
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});


// Watchlist API endpoints
// Portfolio API endpoints

// Get all portfolio stocks
app.get('/portfolio', async (req, res) => {
  const db = client.db('assignment3');
  const portfolioCollection = db.collection('portfolio');
  try {
    let portfolioStocks = await portfolioCollection.find().toArray();
    for (let stock of portfolioStocks) {
      const stockDetails = await fetchStockDetails(stock.symbol); // Fetch current stock price
      if (stockDetails) {
        stock.currentPrice = stockDetails.c; // Assuming 'c' is the current price key
        stock.change = (stock.currentPrice - stock.averageCost) * stock.quantity;
        stock.marketValue = stock.currentPrice * stock.quantity;
        stock.name = stockDetails.name;
        if (!stock.name) {
          const profileDetails = await fetchProfileDetails(stock.symbol); // Fetch the company profile including name
          stock.name = profileDetails.name; // Assuming 'name' is a key in the company profile response
        }
      } else {
        // If stockDetails is null due to API error, provide a fallback or error handling
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch portfolio stocks' });
      }
    }
    res.json(portfolioStocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch portfolio stocks' });
  }
});

// Ensure that fetchProfileDetails is implemented to fetch the stock's company name
async function fetchProfileDetails(symbol) {
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
}



// Buy a stock
app.post('/portfolio/buy', async (req, res) => {
  const { symbol, quantity, price: buyPrice } = req.body;
  const db = client.db('assignment3');
  const portfolioCollection = db.collection('portfolio');
  const userdataCollection = db.collection('userdata');
  const transactionsCollection = db.collection('transactions');

  // Fetch the user's wallet balance
  const userData = await userdataCollection.findOne({});
  let walletBalance = userData.walletBalance;

  // Calculate the cost of purchase based on the provided price or the current market price
  const stockDetails = await fetchStockDetails(symbol);
  const currentPrice = stockDetails.c; // Assuming 'c' is the current price key from fetchStockDetails
  const effectivePrice = buyPrice || currentPrice; // Use buyPrice if provided, else use currentPrice
  const costOfPurchase = effectivePrice * quantity;

  if (walletBalance < costOfPurchase) {
    return res.status(400).json({ error: "Insufficient funds to complete the purchase." });
  }

  // Check if the stock already exists in the user's portfolio
  let stock = await portfolioCollection.findOne({ symbol });

  if (stock) {
    // Stock already exists, update the existing document
    const newQuantity = stock.quantity + quantity;
    const newTotalCost = stock.totalCost + (quantity * effectivePrice);
    await portfolioCollection.updateOne(
      { symbol },
      { $set: { quantity: newQuantity, totalCost: newTotalCost, averageCost: newTotalCost / newQuantity } }
    );
  } else {
    // Stock does not exist, insert a new document
    await portfolioCollection.insertOne({
      symbol,
      name: stockDetails.name, // include the stock's name from stockDetails
      quantity,
      totalCost: quantity * effectivePrice,
      averageCost: effectivePrice
    });
  }

  // Update the user's wallet balance
  walletBalance -= costOfPurchase;
  await userdataCollection.updateOne({}, { $set: { walletBalance: walletBalance } });

  // Record the buy transaction
  await transactionsCollection.insertOne({
    type: 'buy',
    symbol,
    quantity,
    price: effectivePrice,
    date: new Date() // Record the current date and time of the transaction
  });

  // Return a response to the client
  res.json({
    message: "Stock purchased successfully",
    walletBalance: walletBalance // Include the updated wallet balance in the response
  });
});





// Sell a stock
app.post('/portfolio/sell', async (req, res) => {
  const { symbol, quantity: sellQuantity, price: sellPrice } = req.body;
  const db = client.db('assignment3');
  const portfolioCollection = db.collection('portfolio');
  const userdataCollection = db.collection('userdata');
  const transactionsCollection = db.collection('transactions');

  // Fetch the user's wallet balance
  const userData = await userdataCollection.findOne({});
  let walletBalance = userData.walletBalance;

  try {
    let stock = await portfolioCollection.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found in portfolio' });
    }

    // Fetch and sort buy transactions for FIFO implementation
    const buyTransactions = await transactionsCollection.find({ symbol, type: 'buy' }).sort({ date: 1 }).toArray();
    let remainingSellQuantity = sellQuantity;

    for (const transaction of buyTransactions) {
      if (remainingSellQuantity <= 0) break; // Sold enough shares

      const availableForSale = Math.min(transaction.quantity, remainingSellQuantity);
      remainingSellQuantity -= availableForSale;
      transaction.quantity -= availableForSale;

      // Update or remove the transaction based on the remaining quantity
      if (transaction.quantity > 0) {
        await transactionsCollection.updateOne({ _id: transaction._id }, { $set: { quantity: transaction.quantity } });
      } else {
        await transactionsCollection.deleteOne({ _id: transaction._id });
      }
    }

    if (remainingSellQuantity > 0) {
      return res.status(400).json({ error: 'Not enough shares to sell based on FIFO' });
    }

    // Fetch the current price if not provided
    let effectivePrice = sellPrice;
    if (!effectivePrice) {
      const stockDetails = await fetchStockDetails(symbol);
      effectivePrice = stockDetails.c; // Assuming 'c' is the current price
    }

    // Update the portfolio collection based on the new quantity after selling
    const newQuantity = stock.quantity - sellQuantity;
    if (newQuantity === 0) {
      // Remove the stock from the portfolio if all shares are sold
      await portfolioCollection.deleteOne({ symbol });
    } else {
      const newTotalCost = stock.totalCost - (sellQuantity * stock.averageCost);
      await portfolioCollection.updateOne(
        { symbol },
        { $set: { quantity: newQuantity, totalCost: newTotalCost, averageCost: newTotalCost / newQuantity } }
      );
    }

    // Update the user's wallet balance
    const saleAmount = sellQuantity * effectivePrice;
    walletBalance += saleAmount;
    await userdataCollection.updateOne({}, { $set: { walletBalance: walletBalance } });

    // Record the sell transaction
    await transactionsCollection.insertOne({
      type: 'sell',
      symbol,
      quantity: sellQuantity,
      price: effectivePrice,
      date: new Date()
    });

    // Return a response to the client
    res.json({
      message: "Shares sold successfully",
      walletBalance: walletBalance // Include the updated wallet balance in the response
    });
  } catch (error) {
    console.error('Error processing sell transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Get a specific stock from the portfolio
app.get('/portfolio/stock-details/:symbol', async (req, res) => {
  try {
    const db = client.db('assignment3');
    const portfolioCollection = db.collection('portfolio');

    const symbol = req.params.symbol;
    const stock = await portfolioCollection.findOne({ symbol: symbol });

    if (stock) {
      // Assuming the stock document contains a 'quantity' field representing the available quantity
      res.json({ availableQuantity: stock.quantity });
    } else {
      res.json({ availableQuantity: 0 }); // Indicates stock is not in portfolio
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } 
});




// Wallet API Endpoint
app.get('/userdata', async (req, res) => {
  try {
    const database = client.db('assignment3');
    const userdataCollection = database.collection('userdata');

    const userdata = await userdataCollection.findOne({});
    res.json(userdata);
  } catch (error) {
    console.error('Error fetching userdata:', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});

// Update wallet balance
app.post('/userdata/update-wallet', async (req, res) => {
  const { newBalance } = req.body;

  try {
    const database = client.db('assignment3');
    const userdataCollection = database.collection('userdata');

    const result = await userdataCollection.updateOne({}, { $set: { walletBalance: newBalance } });
    if (result.modifiedCount === 1) {
      res.json({ message: 'Wallet balance updated successfully' });
    } else {
      res.status(404).json({ error: 'User data not found' });
    }
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});

// Company Profile
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/company_profile', validateQueryParams, async (req, res) => {
  const symbol = req.query.symbol;
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
    const data = response.data;
    if (!data || data.error) {
      return res.status(404).json({ error: 'No record has been found' });
    }
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: 'No record has been found' });
  }
});


// Stock quote route
app.get('/stock_quote', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Recommendation trends route
app.get('/recommendation_trends', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Charts data route
app.get('/charts_data', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 2);
    startDate.setDate(startDate.getDate() - 1);
  
    const startDateFormatted = startDate.toISOString().slice(0, 10);
    const endDateFormatted = endDate.toISOString().slice(0, 10);
  
    try {
      const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDateFormatted}/${endDateFormatted}?adjusted=true&sort=asc&apiKey=${API_KEY_POLYGON}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Helper function to get the last trading day
function getLastTradingDay(currentTime) {
    let lastTradingDay = currentTime.clone().subtract(1, 'days');

    // Adjust for weekends
    if (lastTradingDay.day() === 0) { // Sunday
        lastTradingDay.subtract(2, 'days'); // Move to Friday
    } else if (lastTradingDay.day() === 6) { // Saturday
        lastTradingDay.subtract(1, 'days'); // Move to Friday
    }

    return lastTradingDay.format('YYYY-MM-DD');
}

// Endpoint for Hourly Charts Data
app.get('/hourly_charts_data', async (req, res) => {
    const symbol = req.query.symbol;
    const currentTime = moment.tz("America/Los_Angeles");
    const marketOpenTime = currentTime.clone().set({ hour: 6, minute: 30, second: 0 });
    const marketCloseTime = currentTime.clone().set({ hour: 13, minute: 0, second: 0 });

    let startDate, endDate;

    // Use the last trading day as the start date if it's before market open or after market close
    if (currentTime.isBefore(marketOpenTime) || currentTime.isAfter(marketCloseTime)) {
        startDate = getLastTradingDay(currentTime);
    } else {
        // If today is Monday, we adjust to the previous Friday. Otherwise, adjust to the previous day.
        if (currentTime.day() === 1) {
            startDate = getLastTradingDay(currentTime);
        } else {
            startDate = getLastTradingDay(currentTime); // Adjust to the previous day for Tuesday-Friday within market hours
        }
    }

    endDate = currentTime.format('YYYY-MM-DD');

    try {
        const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/hour/2023-04-28/${endDate}?adjusted=true&sort=asc&apiKey=${API_KEY_POLYGON}`);
        const data = response.data;
        if (!data || data.error) {
            return res.status(404).json({ error: 'No record has been found' });
        }
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});




// Latest news route
app.get('/latest_news', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = new Date();
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate.toISOString().slice(0, 10)}&to=${toDate.toISOString().slice(0, 10)}&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Autocomplete route
app.get('/autocomplete', async (req, res) => {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Invalid 'q' query parameter" });
    }
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
  
      // Filter the results based on the criteria mentioned in the PDF
      const filteredResults = data.result.filter(result => result.type === 'Common Stock' && !result.symbol.includes('.'));
  
      res.json(filteredResults);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Company insider sentiment route
app.get('/insider_sentiment', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${symbol}&from=2022-01-01&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Company peers route
app.get('/company_peers', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });

// Company earnings route
app.get('/company_earnings', validateQueryParams, async (req, res) => {
    const symbol = req.query.symbol;
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${API_KEY_FINNHUB}`);
      const data = response.data;
      if (!data || data.error) {
        return res.status(404).json({ error: 'No record has been found' });
      }
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: 'No record has been found' });
    }
  });


// Close MongoDB connection when server shuts down
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

main(); // Initiate MongoDB connection and start the server